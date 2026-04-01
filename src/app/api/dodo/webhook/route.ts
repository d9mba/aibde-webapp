import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { sendSubmissionEmail } from '@/lib/emails/submission';
import { getMinorUnitDecimals } from '@/lib/currency';

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

function verifyWebhookSignature(
    rawBody: string,
    signature: string | null,
    secret: string
): boolean {
    if (!signature) return false;
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(rawBody);
    const expected = hmac.digest('hex');

    const normalizedSignature = signature.trim().replace(/^sha256=/i, '');
    if (expected.length !== normalizedSignature.length) {
        return false;
    }

    try {
        const expectedBuffer = Buffer.from(expected, 'hex');
        const signatureBuffer = Buffer.from(normalizedSignature, 'hex');
        if (expectedBuffer.length !== signatureBuffer.length) return false;
        return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
    } catch {
        return false;
    }
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

        const isValid = verifyWebhookSignature(rawBody, signature, secret);
        if (!isValid) {
            console.error('[Dodo Webhook] Invalid signature');
            return NextResponse.json({ received: false }, { status: 401 });
        }

        let payload: any = null;
        try {
            payload = JSON.parse(rawBody);
        } catch {
            payload = null;
        }
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
                submissionId,
                paymentIdFromMetadata,
                // Redact full metadata to prevent PII leakage
            });
            return NextResponse.json({ received: true }, { status: 200 });
        }

        const dodoPaymentId: string | undefined =
            payment.id || payment.payment_id || payment.paymentId;

        const currency: string | undefined = payment.currency || payment.billing_currency;
        const decimals = getMinorUnitDecimals(currency || 'USD');

        const parsedAmount = typeof payment.amount === 'number'
            ? payment.amount
            : typeof payment.amount === 'string'
                ? Number(payment.amount)
                : typeof payment.total_amount === 'number'
                    ? payment.total_amount
                    : typeof payment.total_amount === 'string'
                        ? Number(payment.total_amount)
                        : null;

        const amount: number | null = parsedAmount !== null && !Number.isNaN(parsedAmount)
            ? parsedAmount / Math.pow(10, decimals)
            : null;
        // Extract Tax
        const parsedTax = typeof payment.tax === 'number'
            ? payment.tax
            : typeof payment.tax === 'string'
                ? Number(payment.tax)
                : typeof payment.tax_amount === 'number'
                    ? payment.tax_amount
                    : typeof payment.tax_amount === 'string'
                        ? Number(payment.tax_amount)
                        : null;

        const tax: number | null = parsedTax !== null && !Number.isNaN(parsedTax)
            ? parsedTax / Math.pow(10, decimals)
            : null;

        // Extract Net Amount
        const parsedNet = typeof payment.net_amount === 'number'
            ? payment.net_amount
            : typeof payment.net_amount === 'string'
                ? Number(payment.net_amount)
                : typeof payment.amount_net === 'number'
                    ? payment.amount_net
                    : typeof payment.amount_net === 'string'
                        ? Number(payment.amount_net)
                        : null;

        const net_amount: number | null = parsedNet !== null && !Number.isNaN(parsedNet)
            ? parsedNet / Math.pow(10, decimals)
            : (amount !== null && tax !== null) ? amount - tax : null;

        const invoice_url: string | null = payment.invoice_url || payment.receipt_url || payment.receipt_link || null;

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

        // BUG-04 FIX: Update submission BEFORE claiming the payment to prevent
        // a state where payment is terminal but submission status is stale
        // (if this fails, the webhook returns 500 and Dodo retries safely)
        const { error: submissionUpdateError } = await supabaseAdmin
            .from('tool_submissions')
            .update({ payment_status: statusFromEvent })
            .eq('id', existingPayment.submission_id);

        if (submissionUpdateError) {
            console.error('[Dodo Webhook] Failed to update tool_submissions payment_status', submissionUpdateError);
            return NextResponse.json({ received: false }, { status: 500 });
        }

        // First claim/update record before email send for idempotency.
        const provisionalEmailStatus = submitterEmail
            ? ((existingPayment.email_status === 'sent' ? 'sent' : 'pending') as 'sent' | 'pending')
            : 'not_sent';

        const { data: claimedPayment, error: updateError } = await supabaseAdmin
            .from('payments')
            .update({
                status: statusFromEvent,
                payment_id: dodoPaymentId || existingPayment.payment_id,
                amount: amount ?? existingPayment.amount,
                currency: currency || existingPayment.currency,
                tax: tax ?? existingPayment.tax ?? null,
                net_amount: net_amount ?? existingPayment.net_amount ?? null,
                invoice_url: invoice_url || existingPayment.invoice_url,
                failure_reason: failureReason,
                updated_at: new Date().toISOString(),
                email_status: provisionalEmailStatus,
            })
            .eq('id', existingPayment.id)
            .eq('status', existingPayment.status)
            .select('id')
            .maybeSingle();

        if (updateError) {
            console.error('[Dodo Webhook] Failed to update payment', updateError);
            return NextResponse.json({ received: false }, { status: 500 });
        }

        // Concurrent event already claimed this transition.
        if (!claimedPayment) {
            return NextResponse.json({ received: true }, { status: 200 });
        }

        let emailStatus: 'pending' | 'not_sent' | 'sent' | 'failed' = provisionalEmailStatus;
        let emailSentAt: string | null = null;
        let emailProviderId: string | null = null;

        if (submitterEmail && provisionalEmailStatus !== 'sent') {
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

            const { error: emailUpdateError } = await supabaseAdmin
                .from('payments')
                .update({
                    email_status: emailStatus,
                    email_sent_at: emailSentAt,
                    email_provider_id: emailProviderId,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', existingPayment.id);

            if (emailUpdateError) {
                console.error('[Dodo Webhook] Failed to update email metadata', emailUpdateError);
            }
        }

        return NextResponse.json({ received: true }, { status: 200 });
    } catch (error) {
        console.error('[Dodo Webhook] Unhandled error', error);
        return NextResponse.json({ received: false }, { status: 500 });
    }
}

