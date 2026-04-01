import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, rateLimits, getClientIp } from '@/lib/rate-limit';
import { supabaseAdmin } from '@/lib/supabase';
import { isAllowedRedirectOrigin } from '@/lib/redirect';

const DODO_API_KEY = process.env.DODO_PAYMENTS_API_KEY;
const DODO_BASE_URL = process.env.DODO_PAYMENTS_BASE_URL || (process.env.NODE_ENV === 'production' ? 'https://live.dodopayments.com' : 'https://test.dodopayments.com');
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

export async function POST(request: NextRequest): Promise<NextResponse> {
    let newPayment: any = null;
    try {
        const identifier = getClientIp(request);
        const rateLimitResult = await checkRateLimit(identifier, rateLimits.standard);
        if (!rateLimitResult.success) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again later.' },
                { status: 429 },
            );
        }

        if (!DODO_API_KEY) {
            return NextResponse.json(
                { error: 'Payment provider is not configured' },
                { status: 500 },
            );
        }

        const { submissionId, baseUrl: clientBaseUrl, email: callerEmail } =
            (await request.json().catch(() => null)) || {};

        if (!submissionId || typeof submissionId !== 'string') {
            return NextResponse.json({ error: 'submissionId is required' }, { status: 400 });
        }

        if (!callerEmail || typeof callerEmail !== 'string') {
            return NextResponse.json({ error: 'email is required for ownership verification' }, { status: 400 });
        }

        // Load the latest payment for this submission to get context
        const { data: latestPayment, error: latestError } = await supabaseAdmin
            .from('payments')
            .select('*')
            .eq('submission_id', submissionId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (latestError) {
            console.error('[Retry Payment] Failed to fetch latest payment', latestError);
            return NextResponse.json(
                { error: 'Failed to load payment info' },
                { status: 500 },
            );
        }

        if (!latestPayment) {
            return NextResponse.json(
                { error: 'No payment found for this submission' },
                { status: 404 },
            );
        }

        // SEC-01: Ownership verification — caller must prove they own this submission
        if (
            !latestPayment.submitter_email ||
            callerEmail.toLowerCase().trim() !== latestPayment.submitter_email.toLowerCase().trim()
        ) {
            return NextResponse.json(
                { error: 'Ownership verification failed' },
                { status: 403 },
            );
        }


        const productId = latestPayment.product_id;
        if (!productId) {
            return NextResponse.json(
                { error: 'Payment product configuration missing' },
                { status: 500 },
            );
        }

        // Create a new payment attempt
        const { data: insertedPayment, error: insertError } = await supabaseAdmin
            .from('payments')
            .insert({
                submission_id: latestPayment.submission_id,
                submitter_name: latestPayment.submitter_name,
                submitter_email: latestPayment.submitter_email,
                tool_name: latestPayment.tool_name,
                tool_url: latestPayment.tool_url,
                plan: latestPayment.plan,
                product_id: productId,
                payment_provider: 'dodo',
                status: 'initiated',
            })
            .select('*')
            .single();

        if (insertError || !insertedPayment) {
            console.error('[Retry Payment] Failed to create payment attempt', insertError);
            return NextResponse.json(
                { error: 'Failed to create payment attempt' },
                { status: 500 },
            );
        }

        newPayment = insertedPayment;

        // Validate and sanitize the redirect URL - fail closed to prevent open redirects
        let baseUrl = SITE_URL || request.nextUrl.origin;
        if (clientBaseUrl && typeof clientBaseUrl === 'string' && isAllowedRedirectOrigin(clientBaseUrl)) {
            baseUrl = clientBaseUrl;
        }
        const returnUrl = `${baseUrl.replace(/\/$/, '')}/submit/result/${submissionId}`;

        // Create Dodo checkout session
        const rawTimeout = Number(process.env.DODO_TIMEOUT_MS);
        const timeoutMs = Number.isFinite(rawTimeout) && rawTimeout > 0 ? rawTimeout : 10_000;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);

        let response: Response;
        try {
            response = await fetch(`${DODO_BASE_URL}/checkouts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${DODO_API_KEY}`,
                },
                body: JSON.stringify({
                    product_cart: [
                        {
                            product_id: productId,
                            quantity: 1,
                        },
                    ],
                    customer: {
                        email: latestPayment.submitter_email,
                        name: latestPayment.submitter_name,
                    },
                    return_url: returnUrl,
                    metadata: {
                        submission_id: submissionId,
                        payment_id: newPayment.id,
                        tool_name: latestPayment.tool_name,
                        plan: latestPayment.plan,
                    },
                }),
                signal: controller.signal,
            });
        } catch (error: any) {
            if (error?.name === 'AbortError') {
                await supabaseAdmin.from('payments').update({ status: 'failed' }).eq('id', newPayment.id);
                return NextResponse.json(
                    { error: 'Payment provider timeout. Please try again.' },
                    { status: 504 },
                );
            }
            throw error;
        } finally {
            clearTimeout(timeout);
        }

        if (!response.ok) {
            const text = await response.text().catch(() => '');
            console.error('[Retry Payment] Failed to create Dodo checkout', response.status, text);

            // Update payment status to failed on checkout failure
            const { error: updateError } = await supabaseAdmin
                .from('payments')
                .update({ status: 'failed' })
                .eq('id', newPayment.id);

            if (updateError) {
                console.error('[Retry Payment] Failed to mark payment as failed', updateError);
            }

            return NextResponse.json(
                { error: 'Failed to start checkout. Please try again.' },
                { status: 502 },
            );
        }

        const session = (await response.json()) as {
            session_id: string;
            checkout_url: string;
        };

        if (!session.checkout_url) {
            console.error('[Retry Payment] Missing checkout_url in Dodo response', session);
            const { error: updateError } = await supabaseAdmin
                .from('payments')
                .update({ status: 'failed' })
                .eq('id', newPayment.id);
            if (updateError) {
                console.error('[Retry Payment] Failed to mark payment as failed', updateError);
            }
            return NextResponse.json(
                { error: 'Failed to start checkout. Please try again.' },
                { status: 502 },
            );
        }

        // BUG-01 FIX: Persist session_id so webhooks can reconcile this payment
        if (session.session_id) {
            const { error: sessionUpdateErr } = await supabaseAdmin
                .from('payments')
                .update({ payment_id: session.session_id })
                .eq('id', newPayment.id);
            if (sessionUpdateErr) {
                console.error('[Retry Payment] Failed to persist session_id', sessionUpdateErr);
            }
        }

        return NextResponse.json({
            success: true,
            paymentId: newPayment.id,
            checkoutUrl: session.checkout_url,
        });
    } catch (error: any) {
        console.error('[Retry Payment] Unhandled error', error);

        if (newPayment?.id) {
            try {
                await supabaseAdmin.from('payments').update({ status: 'failed', failure_reason: 'Internal error during checkout' }).eq('id', newPayment.id);
            } catch (cleanupErr) {
                console.error('[Retry Payment] Failed to mark payment as failed during cleanup', cleanupErr);
            }
        }

        return NextResponse.json(
            { error: 'Failed to retry payment' },
            { status: 500 },
        );
    }
}

