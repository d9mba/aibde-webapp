import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const DODO_API_KEY = process.env.DODO_PAYMENTS_API_KEY;
const DODO_BASE_URL = process.env.DODO_PAYMENTS_BASE_URL || 'https://test.dodopayments.com';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        if (!DODO_API_KEY) {
            return NextResponse.json(
                { error: 'Payment provider is not configured' },
                { status: 500 },
            );
        }

        const { submissionId, baseUrl: clientBaseUrl } =
            (await request.json().catch(() => null)) || {};

        if (!submissionId || typeof submissionId !== 'string') {
            return NextResponse.json({ error: 'submissionId is required' }, { status: 400 });
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

        const productId = latestPayment.product_id;
        if (!productId) {
            return NextResponse.json(
                { error: 'Payment product configuration missing' },
                { status: 500 },
            );
        }

        // Create a new payment attempt
        const { data: newPayment, error: insertError } = await supabaseAdmin
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

        if (insertError || !newPayment) {
            console.error('[Retry Payment] Failed to create payment attempt', insertError);
            return NextResponse.json(
                { error: 'Failed to create payment attempt' },
                { status: 500 },
            );
        }

        const isDev = process.env.NODE_ENV === 'development';
        const baseUrl =
            clientBaseUrl ||
            (isDev ? request.nextUrl.origin : SITE_URL || request.nextUrl.origin);
        const returnUrl = `${baseUrl.replace(/\/$/, '')}/submit/result/${submissionId}`;

        // Create Dodo checkout session
        const response = await fetch(`${DODO_BASE_URL}/checkouts`, {
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
                    email: latestPayment.submitter_email,
                    plan: latestPayment.plan,
                },
            }),
        });

        if (!response.ok) {
            const text = await response.text().catch(() => '');
            console.error('[Retry Payment] Failed to create Dodo checkout', response.status, text);
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
            return NextResponse.json(
                { error: 'Failed to start checkout. Please try again.' },
                { status: 502 },
            );
        }

        return NextResponse.json({
            success: true,
            paymentId: newPayment.id,
            checkoutUrl: session.checkout_url,
        });
    } catch (error) {
        console.error('[Retry Payment] Unhandled error', error);
        return NextResponse.json(
            { error: 'Failed to retry payment' },
            { status: 500 },
        );
    }
}

