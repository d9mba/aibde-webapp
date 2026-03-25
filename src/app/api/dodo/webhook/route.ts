import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendSubmissionEmail } from '@/lib/emails/submission';

/**
 * Dodo Payments webhook handler
 *
 * Listens for:
 * - payment.succeeded
 * - payment.failed
 *
 * Uses metadata:
 * - submission_id
 * - payment_id
 * - tool_name
 * - email
 * - plan
 */

function getWebhookSecret(): string | undefined {
    return process.env.DODO_WEBHOOK_SECRET;
}

async function verifyWebhookSignature(
    rawBody: string,
    signature: string | null,
    secret: string
): Promise<boolean> {
    if (!signature) return false;
    const crypto = await import('crypto');
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(rawBody);
    const expected = hmac.digest('hex');
    
    // Timing-safe comparison
    let match = expected.length === signature.length ? 0 : 1;
    for (let i = 0; i < Math.min(expected.length, signature.length); i++) {
        match |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
    }
    return match === 0;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        // Verify webhook signature first
        const secret = getWebhookSecret();
        if (!secret) {
            console.error('[Dodo Webhook] DODO_WEBHOOK_SECRET not configured');
            return NextResponse.json({ received: false }, { status: 500 });
        }

        const rawBody = await request.text();
        const signature = request.headers.get('x-dodo-signature') || request.headers.get('x-signature');
        
        const isValid = await verifyWebhookSignature(rawBody, signature, secret);
        if (!isValid) {
            console.error('[Dodo Webhook] Invalid signature');
            return NextResponse.json({ received: false }, { status: 401 });
        }

        const payload = JSON.parse(rawBody).catch(() => null);
        if (!payload) {
            return NextResponse.json({ received: false }, { status: 400 });
        }

        const eventType: string | undefined =
            (payload.type as string | undefined) ||
            (payload.event as string | undefined) ||
            (payload.event_type as string | undefined);

        if (!eventType) {
            console.error('[Dodo Webhook] Missing event type', payload);
            return NextResponse.json({ received: false }, { status: 400 });
        }

        // Dodo's payment object is nested under data.* – be defensive
        const payment =
            payload.data?.payment ||
            payload.data?.object ||
            payload.payment ||
            payload.data ||
            payload;

        const metadata = payment?.metadata || {};

        // Some providers may wrap IDs in quotes; normalise by stripping any extra quotes/whitespace
        const rawSubmissionId = metadata.submission_id as string | undefined;
        const rawPaymentId = metadata.payment_id as string | undefined;
        const submissionId = rawSubmissionId?.toString().trim().replace(/^"+|"+$/g, '');
        const paymentIdFromMetadata = rawPaymentId?.toString().trim().replace(/^"+|"+$/g, '');

        if (!submissionId || !paymentIdFromMetadata) {
            console.error('[Dodo Webhook] Missing metadata identifiers', {
                eventType,
                metadata,
            });
            return NextResponse.json({ received: true }, { status: 200 });
        }

        const dodoPaymentId: string | undefined =
            payment.id || payment.payment_id || payment.paymentId;
        
        // Helper to determine decimal places per currency
        function getCurrencyMinorUnits(currency: string | undefined): number {
            if (!currency) return 2;
            const currencyUpper = currency.toUpperCase();
            // Common currencies with 0 decimal places (JPY, KRW, etc.)
            if (['JPY', 'KRW', 'VND', 'ISK', 'TWD'].includes(currencyUpper)) return 0;
            // Common currencies with 3 decimal places (KWD, BHD, JOD, OMR, TND)
            if (['KWD', 'BHD', 'JOD', 'OMR', 'TND'].includes(currencyUpper)) return 3;
            // Default to 2
            return 2;
        }
        
        const currency: string | undefined = payment.currency || payment.billing_currency;
        const decimals = getCurrencyMinorUnits(currency);
        const amount: number | null =
            typeof payment.amount === 'number'
                ? payment.amount / Math.pow(10, decimals)
                : typeof payment.amount === 'string'
                ? Number(payment.amount) / Math.pow(10, decimals) || null
                : null;

        const statusFromEvent =
            eventType === 'payment.succeeded'
                ? 'success'
                : eventType === 'payment.failed'
                ? 'failed'
                : null;

        if (!statusFromEvent) {
            // Ignore other events
            return NextResponse.json({ received: true }, { status: 200 });
        }

        // Extract failure reason from Dodo payload (check multiple possible field names)
        const failureReason: string | null =
            statusFromEvent === 'failed'
                ? (payment.failure_reason as string) ||
                  (payment.error_message as string) ||
                  (payment.status_reason as string) ||
                  (payment.decline_reason as string) ||
                  'Payment was declined by the payment provider.'
                : null;

        // Prevent duplicate processing: only update if not already in a terminal state
        const { data: existingPayment, error: fetchError } = await supabaseAdmin
            .from('payments')
            .select('*')
            .eq('id', paymentIdFromMetadata)
            .maybeSingle();

        if (fetchError) {
            console.error('[Dodo Webhook] Failed to load payment', fetchError);
            return NextResponse.json({ received: false }, { status: 500 });
        }

        if (!existingPayment) {
            console.error('[Dodo Webhook] Payment not found', paymentIdFromMetadata);
            return NextResponse.json({ received: true }, { status: 200 });
        }

        if (existingPayment.status === 'success' || existingPayment.status === 'failed') {
            // Already processed
            return NextResponse.json({ received: true }, { status: 200 });
        }

        // Optional: human-readable submission ref for emails (e.g. A250314093501)
        let submissionRef: string | null = null;
        const { data: submissionRow } = await supabaseAdmin
            .from('tool_submissions')
            .select('submission_ref')
            .eq('id', existingPayment.submission_id)
            .maybeSingle();
        if (submissionRow?.submission_ref) submissionRef = submissionRow.submission_ref;

        // Send email notifications based on status
        const emailType = statusFromEvent === 'success' ? 'success' : 'failed';
        const submitterName =
            existingPayment.submitter_name || metadata.submitter_name || 'there';
        const submitterEmail =
            existingPayment.submitter_email || metadata.email || metadata.submitter_email;
        const toolName =
            existingPayment.tool_name || metadata.tool_name || metadata.toolName || 'Your tool';
        const toolUrl = existingPayment.tool_url || metadata.tool_url || metadata.toolUrl || null;
        const plan = existingPayment.plan || metadata.plan || 'basic';

        // Track email delivery metadata
        let emailStatus: 'not_sent' | 'sent' | 'failed' = 'not_sent';
        let emailSentAt: string | null = null;
        let emailProviderId: string | null = null;

        if (submitterEmail) {
            const emailId = await sendSubmissionEmail(emailType, {
                submitter_name: submitterName,
                submitter_email: submitterEmail,
                tool_name: toolName,
                tool_url: toolUrl,
                plan,
                submission_ref: submissionRef,
            });

            if (emailId) {
                emailStatus = 'sent';
                emailSentAt = new Date().toISOString();
                emailProviderId = emailId;
            } else {
                emailStatus = 'failed';
            }
        }

        // Update payments with status + email metadata + failure reason
        const { error: updateError } = await supabaseAdmin
            .from('payments')
            .update({
                status: statusFromEvent,
                payment_id: dodoPaymentId || existingPayment.payment_id,
                amount: amount ?? existingPayment.amount,
                currency: currency || existingPayment.currency,
                failure_reason: failureReason,
                updated_at: new Date().toISOString(),
                email_status: emailStatus,
                email_sent_at: emailSentAt,
                email_provider_id: emailProviderId,
            })
            .eq('id', existingPayment.id);

        if (updateError) {
            console.error('[Dodo Webhook] Failed to update payment', updateError);
            return NextResponse.json({ received: false }, { status: 500 });
        }

        // Also mirror payment status on the related tool submission for easier admin filtering
        const { error: submissionUpdateError } = await supabaseAdmin
            .from('tool_submissions')
            .update({ payment_status: statusFromEvent })
            .eq('id', existingPayment.submission_id);

        if (submissionUpdateError) {
            console.error('[Dodo Webhook] Failed to update tool_submissions payment_status', submissionUpdateError);
        }

        return NextResponse.json({ received: true }, { status: 200 });
    } catch (error) {
        console.error('[Dodo Webhook] Unhandled error', error);
        return NextResponse.json({ received: false }, { status: 500 });
    }
}

