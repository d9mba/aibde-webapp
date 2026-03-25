import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, rateLimits, getClientIp } from '@/lib/rate-limit';
import { verifyTurnstile } from '@/lib/turnstile';
import { supabaseAdmin } from '@/lib/supabase';
import { generateSubmissionRef } from '@/lib/submission-ref';

const MAX_LEN = {
    name: 100,
    email: 254,
    toolName: 200,
    url: 500,
    shortDesc: 1000,
    longDesc: 5000,
    tags: 500,
    features: 2000,
};

const DODO_API_KEY = process.env.DODO_PAYMENTS_API_KEY;
const DODO_BASE_URL = process.env.DODO_PAYMENTS_BASE_URL || 'https://test.dodopayments.com';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

const BASIC_PRODUCT_ID = process.env.NEXT_PUBLIC_DODO_BASIC_PRODUCT_ID;
const VERIFIED_PRODUCT_ID = process.env.NEXT_PUBLIC_DODO_VERIFIED_PRODUCT_ID;
const FEATURED_PRODUCT_ID = process.env.NEXT_PUBLIC_DODO_FEATURED_PRODUCT_ID;

type PlanType = 'basic' | 'verified' | 'featured';

interface SocialLink {
    platform: string;
    url: string;
}

interface ToolSubmissionData {
    // Submitter info
    submitterName: string;
    submitterEmail: string;

    // Basic tool info
    toolName: string;
    toolUrl: string;
    shortDescription: string;
    longDescription?: string;

    // Classification
    pricing?: string;
    releasedDate?: string;
    tags?: string;
    features?: string;
    customCategory?: string;

    // Affiliate
    hasAffiliateProgram?: boolean;
    affiliateUrl?: string;

    // Social & Media
    socialLinks?: SocialLink[];
    imageUrls?: string;
    videoUrls?: string;
    logoUrl?: string;

    // Selected paid plan
    plan: PlanType;

    // URL & Security
    baseUrl?: string;
    turnstileToken: string;
}

function getProductIdForPlan(plan: PlanType): string | null {
    switch (plan) {
        case 'basic':
            return BASIC_PRODUCT_ID || null;
        case 'verified':
            return VERIFIED_PRODUCT_ID || null;
        case 'featured':
            return FEATURED_PRODUCT_ID || null;
        default:
            return null;
    }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const identifier = getClientIp(request);
        if (!identifier) {
            return NextResponse.json({ error: 'Unable to identify client' }, { status: 400 });
        }
        const rateLimit = await checkRateLimit(`submit:${identifier}`, rateLimits.sensitive);
        if (!rateLimit.success) {
            return NextResponse.json(
                { error: 'Too many submissions. Try again later.' },
                {
                    status: 429,
                    headers: {
                        'Retry-After': String(
                            Math.max(1, Math.ceil((rateLimit.resetTime - Date.now()) / 1000)),
                        ),
                    },
                },
            );
        }

        const body: ToolSubmissionData = await request.json();

        if (
            !body.submitterName ||
            !body.submitterEmail ||
            !body.toolName ||
            !body.toolUrl ||
            !body.shortDescription ||
            !body.plan
        ) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 },
            );
        }

        if (!['basic', 'verified', 'featured'].includes(body.plan)) {
            return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
        }

        const productId = getProductIdForPlan(body.plan);
        if (!productId) {
            return NextResponse.json(
                { error: 'Payment configuration is missing for selected plan' },
                { status: 500 },
            );
        }

        if (!DODO_API_KEY) {
            return NextResponse.json(
                { error: 'Payment provider is not configured' },
                { status: 500 },
            );
        }

        if (body.submitterName.length > MAX_LEN.name) {
            return NextResponse.json({ error: 'Submitter name too long' }, { status: 400 });
        }
        if (body.submitterEmail.length > MAX_LEN.email) {
            return NextResponse.json({ error: 'Email too long' }, { status: 400 });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.submitterEmail)) {
            return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
        }
        const lengthErrors: string[] = [];
        if (body.toolName.length > MAX_LEN.toolName) lengthErrors.push('Tool name too long');
        if (body.toolUrl.length > MAX_LEN.url) lengthErrors.push('Tool URL too long');
        if (lengthErrors.length > 0) {
            return NextResponse.json({ error: lengthErrors.join('; ') }, { status: 400 });
        }
        if (body.shortDescription.length > MAX_LEN.shortDesc) {
            return NextResponse.json({ error: 'Short description too long' }, { status: 400 });
        }
        if (body.longDescription && body.longDescription.length > MAX_LEN.longDesc) {
            return NextResponse.json({ error: 'Long description too long' }, { status: 400 });
        }
        if (body.tags && body.tags.length > MAX_LEN.tags) {
            return NextResponse.json({ error: 'Tags too long' }, { status: 400 });
        }
        if (body.features && body.features.length > MAX_LEN.features) {
            return NextResponse.json({ error: 'Features too long' }, { status: 400 });
        }

        if (!body.turnstileToken) {
            return NextResponse.json(
                { error: 'Security verification required' },
                { status: 400 },
            );
        }

        const isTurnstileValid = await verifyTurnstile(body.turnstileToken);
        if (!isTurnstileValid) {
            return NextResponse.json(
                { error: 'Security verification failed. Please try again.' },
                { status: 400 },
            );
        }

        const { turnstileToken: _turnstile, baseUrl: clientBaseUrl, ...formData } = body;

        const submissionRef = generateSubmissionRef(formData.plan);

        // 1) Insert tool submission (with human-readable ref for display/emails)
        const { data: submission, error: submissionError } = await supabaseAdmin
            .from('tool_submissions')
            .insert({
                submission_ref: submissionRef,
                tool_name: formData.toolName,
                website_url: formData.toolUrl,
                category: formData.customCategory || null,
                pricing_model: formData.pricing || null,
                short_description: formData.shortDescription,
                full_description: formData.longDescription || null,
                logo_url: formData.logoUrl || null,
                submitter_name: formData.submitterName,
                submitter_email: formData.submitterEmail,
                plan_selected: formData.plan,
                payment_status: 'initiated',
                review_status: 'pending',
            })
            .select('*')
            .single();

        if (submissionError || !submission) {
            console.error('[Submit Tool API] Failed to insert tool_submissions', submissionError);
            return NextResponse.json(
                { error: 'Failed to save submission. Please try again.' },
                { status: 500 },
            );
        }

        // 2) Insert payment record (initiated)
        const { data: payment, error: paymentError } = await supabaseAdmin
            .from('payments')
            .insert({
                submission_id: submission.id,
                submitter_name: formData.submitterName,
                submitter_email: formData.submitterEmail,
                tool_name: formData.toolName,
                tool_url: formData.toolUrl,
                plan: formData.plan,
                product_id: productId,
                payment_provider: 'dodo',
                status: 'initiated',
            })
            .select('*')
            .single();

        if (paymentError || !payment) {
            console.error('[Submit Tool API] Failed to insert payments', paymentError);
            
            // Rollback: delete the submission that was just created
            const { error: deleteError } = await supabaseAdmin
                .from('tool_submissions')
                .delete()
                .eq('id', submission.id);
            
            if (deleteError) {
                console.error('[Submit Tool API] Failed to rollback submission', deleteError);
            }
            
            return NextResponse.json(
                { error: 'Failed to create payment record. Please try again.' },
                { status: 500 },
            );
        }

        // 3) Create Dodo checkout session
        const isDev = process.env.NODE_ENV === 'development';
        const baseUrl =
            clientBaseUrl ||
            (isDev ? request.nextUrl.origin : SITE_URL || request.nextUrl.origin);
        const returnUrl = `${baseUrl.replace(/\/$/, '')}/submit/result/${submission.id}`;

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
                    email: formData.submitterEmail,
                    name: formData.submitterName,
                },
                return_url: returnUrl,
                metadata: {
                    submission_id: submission.id,
                    payment_id: payment.id,
                    tool_name: formData.toolName,
                    email: formData.submitterEmail,
                    plan: formData.plan,
                },
            }),
        });

        if (!response.ok) {
            const text = await response.text().catch(() => '');
            console.error('[Submit Tool API] Failed to create Dodo checkout', response.status, text);
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
            console.error('[Submit Tool API] Missing checkout_url in Dodo response', session);
            return NextResponse.json(
                { error: 'Failed to start checkout. Please try again.' },
                { status: 502 },
            );
        }

        // Store the Dodo session_id for fallback status polling
        if (session.session_id) {
            const { error: updateError } = await supabaseAdmin
                .from('payments')
                .update({ payment_id: session.session_id })
                .eq('id', payment.id);
            
            if (updateError) {
                console.error('[Submit Tool API] Failed to update payment with session_id', updateError);
                // Log but don't fail - polling won't work but submission was created
            }
        }

        return NextResponse.json({
            success: true,
            submissionId: submission.id,
            paymentId: payment.id,
            checkoutUrl: session.checkout_url,
        });
    } catch (err) {
        console.error('[Submit Tool API] Error:', err);
        return NextResponse.json(
            { error: 'Failed to process submission' },
            { status: 500 },
        );
    }
}

