import { supabaseAdmin } from '@/lib/supabase';
import { getMinorUnitDecimals } from '@/lib/currency';
import { sendSubmissionEmail } from '@/lib/emails/submission';
import Link from 'next/link';
import RetryPaymentButton from '../RetryPaymentButton';
import CleanUrlClient from '../CleanUrlClient';
import Confetti from '../Confetti';
import {
    XCircle, RefreshCw, Mail,
    Clock, ArrowRight, Home, Receipt, ExternalLink,
} from 'lucide-react';

const TIMEOUT_MINUTES = 15;

interface ResultPageProps {
    params: Promise<{ submission_id: string }>;
    searchParams: Promise<{ payment_id?: string; status?: string; email?: string }>;
}

function formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Kolkata',
    });
}

function formatAmount(amount: number, currency: string): string {
    const symbols: Record<string, string> = { USD: '$', INR: '₹', EUR: '€', GBP: '£' };
    const symbol = symbols[currency] || `${currency} `;

    // CodeRabbit: Handle NaN or invalid amount safely
    const numAmount = Number(amount);
    if (Number.isNaN(numAmount)) return `${symbol}0.00`;

    return `${symbol}${numAmount.toFixed(2)}`;
}

function sanitizeWebsiteUrl(urlString: string | null | undefined): string | null {
    if (!urlString) return null;
    try {
        const normalized = /^https?:/i.test(urlString) ? urlString : `https://${urlString}`;
        const parsed = new URL(normalized);
        if (!['http:', 'https:'].includes(parsed.protocol.toLowerCase())) return null;
        return parsed.href;
    } catch {
        return null;
    }
}

export default async function SubmitResultPage({ params, searchParams }: ResultPageProps) {
    const { submission_id } = await params;
    const resolvedSearchParams = await searchParams;
    const submissionId = submission_id;

    const uuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/i;
    let payment: any = null;
    let submission: any = null;
    let error: any = null;

    if (uuidPattern.test(submissionId)) {
        const [paymentResult, submissionResult] = await Promise.all([
            supabaseAdmin
                .from('payments')
                .select('*')
                .eq('submission_id', submissionId)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle(),
            supabaseAdmin
                .from('tool_submissions')
                .select('review_status, payment_status, submission_ref, website_url, tool_id, app_username')
                .eq('id', submissionId)
                .maybeSingle(),
        ]);

        payment = paymentResult.data;
        submission = submissionResult.data;
        error = paymentResult.error || submissionResult.error;

        if (error && (error as any).message && (error as any).code !== '22P02') {
            console.error('[Submit Result] Failed to load', error);
        }
    }

    // 15-minute timeout: treat stale "initiated" payments as failed
    let failureReason: string | null = payment?.failure_reason ?? null;

    // ─── Fallback: Poll Dodo API when webhook hasn't fired ───
    if (payment?.status === 'initiated') {
        const DODO_API_KEY = process.env.DODO_PAYMENTS_API_KEY;
        const DODO_BASE_URL = process.env.DODO_PAYMENTS_BASE_URL || (process.env.NODE_ENV === 'production' ? 'https://live.dodopayments.com' : 'https://test.dodopayments.com');

        // Use the payment_id from Dodo's return URL as priority, or fall back to our stored session ID
        const dodoPaymentId = resolvedSearchParams.payment_id || payment.payment_id;
        if (resolvedSearchParams.payment_id && payment.payment_id && resolvedSearchParams.payment_id !== payment.payment_id) {
            console.warn('[Submit Result] SearchParam payment_id differs from stored payment_id (using search param)');
        }

        if (DODO_API_KEY && dodoPaymentId) {
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 5000);
                let dodoRes: Response;
                try {
                    dodoRes = await fetch(`${DODO_BASE_URL}/payments/${dodoPaymentId}`, {
                        headers: { Authorization: `Bearer ${DODO_API_KEY}` },
                        cache: 'no-store',
                        signal: controller.signal,
                    });
                } finally {
                    clearTimeout(timeout);
                }

                if (dodoRes.ok) {
                    let dodoPayment: any;
                    try {
                        dodoPayment = await dodoRes.json();
                    } catch (parseErr) {
                        console.error('[Submit Result] Failed to parse Dodo API response', { status: dodoRes.status, error: parseErr });
                        dodoPayment = null;
                    }
                    const dodoStatus = dodoPayment?.status;

                    if (dodoStatus === 'succeeded' || dodoStatus === 'failed' || dodoStatus === 'cancelled') {
                        // CRITICAL SECURITY: Verify this Dodo payment actually belongs to this specific database transaction.
                        const metaPaymentId = dodoPayment.metadata?.payment_id || dodoPayment.metadata?.paymentId;
                        if (!metaPaymentId || metaPaymentId !== payment.id) {
                            console.error('[Submit Result] Unauthorized Access Detected! Dodo payment metadata ID missing or mismatch.', { local: payment.id, meta: metaPaymentId });
                            return (
                                <div className="flex flex-col items-center justify-center min-h-[60vh] py-20 px-4 text-center">
                                    <XCircle className="mx-auto h-16 w-16 text-[var(--accent-red)] mb-6" />
                                    <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Transaction Invalid</h1>
                                    <p className="mt-2 text-sm text-[var(--text-secondary)]">The payment reference could not be verified.</p>
                                    <Link href="/" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent-primary)] hover:underline"><Home className="w-4 h-4" /> Return Home</Link>
                                </div>
                            );
                        }

                        const dodoCurrency = dodoPayment.currency || payment.currency || 'USD';
                        const decimals = getMinorUnitDecimals(dodoCurrency);
                        const basePow = Math.pow(10, decimals);

                        const grossAmount = typeof dodoPayment.total_amount === 'number' ? dodoPayment.total_amount / basePow : payment.amount;
                        const taxAmount = typeof dodoPayment.tax === 'number' ? dodoPayment.tax / basePow : (typeof dodoPayment.tax_amount === 'number' ? dodoPayment.tax_amount / basePow : null);
                        let netAmount = typeof dodoPayment.net_amount === 'number' ? dodoPayment.net_amount / basePow : (typeof dodoPayment.amount_net === 'number' ? dodoPayment.amount_net / basePow : null);
                        if (netAmount === null && grossAmount !== null && taxAmount !== null) netAmount = grossAmount - taxAmount;

                        if (dodoStatus === 'succeeded') {
                            try {
                                // BUG-02 FIX: Sequential updates instead of Promise.all
                                // Payment update first (primary record of truth)
                                const { error: paymentErr } = await supabaseAdmin
                                    .from('payments')
                                    .update({
                                        status: 'success',
                                        payment_id: dodoPaymentId,
                                        amount: grossAmount,
                                        tax: taxAmount,
                                        net_amount: netAmount,
                                        currency: dodoCurrency,
                                        invoice_url: dodoPayment.invoice_url || dodoPayment.receipt_url || dodoPayment.receipt_link || null,
                                        updated_at: new Date().toISOString(),
                                    })
                                    .eq('id', payment.id);

                                if (paymentErr) {
                                    console.error('[Submit Result] Failed to update payment', paymentErr);
                                } else {
                                    // Only update submission if payment update succeeded
                                    const { error: subErr } = await supabaseAdmin
                                        .from('tool_submissions')
                                        .update({ payment_status: 'success' })
                                        .eq('id', payment.submission_id);

                                    if (subErr) {
                                        console.error('[Submit Result] Payment updated but submission sync failed', subErr);
                                    }
                                }
                            } catch (updateErr) {
                                console.error('[Submit Result] DB update for success failed', updateErr);
                            }

                            // Send confirmation email via atomic claim lock
                            if (payment.submitter_email && payment.email_status !== 'sent') {
                                try {
                                    const { data: emailClaim, error: claimError } = await supabaseAdmin
                                        .from('payments')
                                        .update({ email_provider_id: 'sending_lock' })
                                        .eq('id', payment.id)
                                        .is('email_provider_id', null)
                                        .select('id')
                                        .maybeSingle();

                                    if (emailClaim && !claimError) {
                                        const emailId = await sendSubmissionEmail('success', {
                                            submitter_name: payment.submitter_name || 'there',
                                            submitter_email: payment.submitter_email,
                                            tool_name: payment.tool_name || 'Your tool',
                                            tool_url: payment.tool_url || null,
                                            plan: payment.plan || 'basic',
                                            submission_ref: submission?.submission_ref || null,
                                        });

                                        await supabaseAdmin
                                            .from('payments')
                                            .update({
                                                email_status: 'sent',
                                                email_sent_at: new Date().toISOString(),
                                                email_provider_id: emailId || 'sent_no_id',
                                            })
                                            .eq('id', payment.id);
                                    }
                                } catch (emailErr) {
                                    console.error('[Submit Result] Email sending or tracking failed', emailErr);
                                    // BUG-03 FIX: Clear lock so retries aren't permanently blocked
                                    await supabaseAdmin
                                        .from('payments')
                                        .update({ email_provider_id: null, email_status: 'failed' })
                                        .eq('id', payment.id)
                                        .eq('email_provider_id', 'sending_lock');
                                }
                            }

                            payment.status = 'success';
                            payment.amount = grossAmount;
                            payment.tax = taxAmount;
                            payment.net_amount = netAmount;
                            payment.currency = dodoCurrency;

                            console.log('[Submit Result] Fallback: Payment confirmed via Dodo API', payment.payment_id);
                        } else if (dodoStatus === 'failed' || dodoStatus === 'cancelled') {
                            failureReason = dodoPayment.error_message || dodoPayment.failure_reason || 'Payment was declined or cancelled.';

                            try {
                                // BUG-02 FIX: Sequential updates for failure path too
                                const { error: paymentErr } = await supabaseAdmin
                                    .from('payments')
                                    .update({
                                        status: 'failed',
                                        payment_id: dodoPaymentId,
                                        amount: grossAmount,
                                        currency: dodoCurrency,
                                        failure_reason: failureReason,
                                        updated_at: new Date().toISOString(),
                                    })
                                    .eq('id', payment.id);

                                if (paymentErr) {
                                    console.error('[Submit Result] Failed to update payment as failed', paymentErr);
                                } else {
                                    const { error: subErr } = await supabaseAdmin
                                        .from('tool_submissions')
                                        .update({ payment_status: 'failed' })
                                        .eq('id', payment.submission_id);

                                    if (subErr) {
                                        console.error('[Submit Result] Payment updated but submission sync failed', subErr);
                                    }
                                }
                            } catch (updateErr) {
                                console.error('[Submit Result] DB update for failure failed', updateErr);
                            }

                            payment.status = 'failed';
                            payment.amount = grossAmount;
                            payment.currency = dodoCurrency;
                        }
                    }
                    // If still 'processing' or other status, leave as initiated
                }
            } catch (err) {
                if ((err as any)?.name === 'AbortError') {
                    console.warn('[Submit Result] Fallback Dodo API check timed out');
                } else {
                    console.error('[Submit Result] Fallback Dodo API check failed:', err);
                }
            }
        }
    }

    if (payment?.status === 'initiated' && payment.created_at) {
        const elapsedMinutes = (Date.now() - new Date(payment.created_at).getTime()) / 1000 / 60;

        if (elapsedMinutes >= TIMEOUT_MINUTES) {
            failureReason = 'Payment was not completed within 15 minutes. The session has expired.';

            try {
                // BUG-02 FIX: Sequential updates to prevent partial state on failure
                const { error: paymentUpdateErr } = await supabaseAdmin
                    .from('payments')
                    .update({
                        status: 'failed',
                        failure_reason: failureReason,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', payment.id);
                if (paymentUpdateErr) {
                    console.error('[Submit Result] Failed to update payment for timeout', paymentUpdateErr);
                }

                const { error: subUpdateErr } = await supabaseAdmin
                    .from('tool_submissions')
                    .update({ payment_status: 'failed' })
                    .eq('id', payment.submission_id);
                if (subUpdateErr) {
                    console.error('[Submit Result] Failed to update submission for timeout', subUpdateErr);
                }
            } catch (timeoutErr) {
                console.error('[Submit Result] DB update for timeout failed', timeoutErr);
            }

            payment.status = 'failed';
        }
    }

    const status = payment?.status as 'initiated' | 'success' | 'failed' | undefined;
    const hasPayment = !!payment;
    const reviewStatus = submission?.review_status ?? 'pending';
    const isLive = reviewStatus === 'published';
    const submitterName = payment?.submitter_name || 'there';
    const submitterEmail = payment?.submitter_email || null;
    const displayRef = submission?.submission_ref ?? submissionId;
    const paymentDate = payment?.created_at ? formatDateTime(payment.created_at) : null;
    const amount = payment?.amount;
    const taxAmount = payment?.tax ?? null;
    const netAmount = payment?.net_amount ?? null;
    const currency = (payment?.currency || 'USD').toUpperCase();
    const hasTaxBreakdown = status === 'success' && taxAmount != null && taxAmount > 0 && netAmount != null;
    const plan = payment?.plan || null;
    const toolName = payment?.tool_name || null;
    const websiteUrl = payment?.tool_url || submission?.website_url || null;
    const safeWebsiteUrl = sanitizeWebsiteUrl(websiteUrl);

    let liveListingHref: string | null = null;
    if (submission?.app_username) {
        liveListingHref = `/app/${submission.app_username}`;
    } else if (isLive && safeWebsiteUrl) {
        try {
            const { data: liveTool, error: toolErr } = await supabaseAdmin
                .from('tools')
                .select('app_username')
                .eq('status', 'published')
                .eq('website_url', safeWebsiteUrl)
                .maybeSingle();
            if (!toolErr && liveTool?.app_username) {
                liveListingHref = `/app/${liveTool.app_username}`;
            }
        } catch (err) {
            console.error('[Submit Result] Error resolving live tool username', err);
        }
    }

    // Receipt header class
    const headerClass =
        status === 'success'
            ? 'receipt-header-success'
            : status === 'failed'
                ? 'receipt-header-failed'
                : 'receipt-header-processing';

    // Receipt card shared across all states with payment
    const receiptCard = hasPayment ? (
        <div className="receipt-card mt-8 w-full">
            {/* Header */}
            <div className={`${headerClass} flex items-center justify-between px-5 py-3.5 sm:px-6`}>
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)]">
                    <Receipt className="h-4 w-4" />
                    {status === 'success' ? 'Payment Receipt' : 'Payment Details'}
                </div>
                {status === 'success' && (
                    <span className="status-badge status-badge-paid">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent-primary)]" />
                        Paid
                    </span>
                )}
                {status === 'failed' && (
                    <span className="status-badge status-badge-failed">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent-red)]" />
                        Failed
                    </span>
                )}
                {status !== 'success' && status !== 'failed' && (
                    <span className="status-badge status-badge-processing status-pulse">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent-yellow)]" />
                        Processing
                    </span>
                )}
            </div>

            {/* Amount */}
            {amount != null && (
                <div className="px-5 py-5 text-center sm:px-6">
                    {hasTaxBreakdown ? (
                        <>
                            <p className="text-xs font-medium uppercase tracking-widest text-[var(--text-tertiary)]">
                                {status === 'success' ? 'Amount Paid' : 'Amount Due'}
                            </p>
                            <p className="mt-1 text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
                                {formatAmount(amount, currency)}
                            </p>
                            <div className="mt-3 space-y-1">
                                <div className="flex items-center justify-between text-sm text-[var(--text-secondary)]">
                                    <span>Subtotal</span>
                                    <span>{formatAmount(netAmount!, currency)}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm text-[var(--text-secondary)]">
                                    <span>Tax</span>
                                    <span>{formatAmount(taxAmount!, currency)}</span>
                                </div>
                                <div className="receipt-divider my-1.5" />
                                <div className="flex items-center justify-between text-sm font-semibold text-[var(--text-primary)]">
                                    <span>Total</span>
                                    <span>{formatAmount(amount, currency)}</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <p className="text-xs font-medium uppercase tracking-widest text-[var(--text-tertiary)]">
                                {status === 'success' ? 'Amount Paid' : 'Amount Due'}
                            </p>
                            <p className="mt-1 text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
                                {formatAmount(amount, currency)}
                            </p>
                        </>
                    )}
                </div>
            )}

            {/* Dashed divider */}
            <div className="receipt-divider mx-5 sm:mx-6" />

            {/* Details rows */}
            <div className="px-5 py-1 sm:px-6">
                {toolName && (
                    <div className="receipt-row">
                        <span className="receipt-label">Tool</span>
                        <span className="receipt-value">{toolName}</span>
                    </div>
                )}
                {safeWebsiteUrl && (
                    <div className="receipt-row">
                        <span className="receipt-label">Website</span>
                        <a
                            href={safeWebsiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="receipt-value inline-flex items-center gap-1 text-[var(--accent-primary)] hover:underline"
                        >
                            {safeWebsiteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                            <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                    </div>
                )}
                <div className="receipt-row">
                    <span className="receipt-label">Submission Ref</span>
                    <span className="receipt-value font-mono text-xs tracking-wide">{displayRef}</span>
                </div>
                {plan && (
                    <div className="receipt-row">
                        <span className="receipt-label">Plan</span>
                        <span className="receipt-value">{plan.charAt(0).toUpperCase() + plan.slice(1)}</span>
                    </div>
                )}
                {paymentDate && (
                    <div className="receipt-row">
                        <span className="receipt-label">Date & Time</span>
                        <span className="receipt-value">{paymentDate}</span>
                    </div>
                )}

            </div>
        </div>
    ) : null;

    // Footer
    const supportFooter = (
        <div className="mt-10 space-y-3 text-center">
            {submitterEmail && (
                <p className="text-sm text-[var(--text-secondary)]">
                    All further communication will be mailed to{' '}
                    <span className="font-semibold text-[var(--text-primary)]">{submitterEmail}</span>
                </p>
            )}
            <p className="text-sm text-[var(--text-tertiary)]">
                Need help? Email us at{' '}
                <a href="mailto:support@aibde.tech" className="font-medium text-[var(--accent-primary)] hover:underline">
                    support@aibde.tech
                </a>
            </p>
            <p className="text-xs italic text-[var(--text-tertiary)]">
                Thanks for your patience 🙏
            </p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <CleanUrlClient />
            <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-10 md:py-16">

                {/* ─── Success ─── */}
                {hasPayment && status === 'success' && (
                    <>
                        <Confetti />
                        <svg className="google-check" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="80" height="80">
                            <circle className="google-check-circle" cx="40" cy="40" r="36" fill="none" stroke="var(--accent-primary)" strokeWidth="3" />
                            <polyline className="google-check-mark" points="18,42 32,56 62,26" fill="none" stroke="var(--accent-primary)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <h1 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-[var(--text-primary)] md:text-4xl">
                            Thank you, {submitterName}! <span id="confetti-origin">🎉</span>
                        </h1>
                        <p className="mt-3 text-center text-base leading-relaxed text-[var(--text-secondary)]">
                            Your AI tool has been submitted successfully. Our team will review it in 24-48 hrs and you&apos;ll receive an email once it&apos;s live.
                        </p>
                        <p className="mt-2 text-center text-sm text-[var(--text-tertiary)]">
                            Our team will reach out to you shortly if we need any further information.
                        </p>

                        {receiptCard}

                        {supportFooter}

                        <div className="mt-8 flex flex-wrap justify-center gap-3">
                            <Link href="/" className="submit-btn-secondary inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium">
                                <Home className="h-4 w-4" />
                                Back to Home
                            </Link>
                            {isLive && liveListingHref && (
                                <Link href={liveListingHref} className="submit-btn-primary inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium">
                                    <ArrowRight className="h-4 w-4" />
                                    View Listing
                                </Link>
                            )}
                        </div>
                    </>
                )}

                {/* ─── Failed ─── */}
                {hasPayment && status === 'failed' && (
                    <>
                        <svg className="google-check" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="80" height="80">
                            <circle className="google-fail-circle" cx="40" cy="40" r="36" fill="none" stroke="var(--accent-red)" strokeWidth="3" />
                            <line className="google-fail-x1" x1="22" y1="22" x2="58" y2="58" stroke="var(--accent-red)" strokeWidth="7" strokeLinecap="round" />
                            <line className="google-fail-x2" x1="58" y1="22" x2="22" y2="58" stroke="var(--accent-red)" strokeWidth="7" strokeLinecap="round" />
                        </svg>
                        <h1 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-[var(--text-primary)] md:text-4xl">
                            Payment Failed
                        </h1>

                        {/* Failure reason */}
                        <div className="mt-5 w-full rounded-xl bg-[var(--accent-red-bg)] px-5 py-4">
                            <p className="flex items-start gap-3 text-left text-sm text-[var(--accent-red)]">
                                <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
                                <span>
                                    {failureReason || 'Your payment was not completed. Please retry or contact support if the problem persists.'}
                                </span>
                            </p>
                        </div>

                        <p className="mt-3 text-center text-sm text-[var(--text-secondary)]">
                            If any amount was charged, it will be <span className="font-semibold text-[var(--text-primary)]">automatically refunded within 3–7 business days</span>.
                        </p>

                        {receiptCard}

                        {supportFooter}

                        <div className="mt-8 flex flex-wrap justify-center gap-3">
                            <div>
                                <RetryPaymentButton submissionId={submissionId} />
                            </div>
                            <a
                                href="mailto:support@aibde.tech?subject=Payment%20Failed%20-%20Submission"
                                className="submit-btn-secondary inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium"
                            >
                                <Mail className="h-4 w-4" />
                                Contact Support
                            </a>
                        </div>
                    </>
                )}

                {/* ─── Processing ─── */}
                {hasPayment && status !== 'success' && status !== 'failed' && (
                    <>
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]">
                            <RefreshCw className="h-8 w-8 animate-spin" />
                        </div>
                        <h1 className="mt-6 text-center text-2xl font-bold tracking-tight text-[var(--text-primary)] md:text-3xl">
                            Payment Processing
                        </h1>
                        <p className="mt-3 text-center text-sm text-[var(--text-secondary)]">
                            We are confirming your payment. Please wait a moment and refresh this page.
                        </p>

                        <div className="mt-3 flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
                            <Clock className="h-3.5 w-3.5" />
                            <span>If not confirmed within 15 minutes, it will be marked as failed.</span>
                        </div>

                        <p className="mt-3 text-center text-sm text-[var(--text-secondary)]">
                            If the payment fails, any amount charged will be <span className="font-semibold text-[var(--text-primary)]">automatically refunded within 3–7 business days</span>.
                        </p>

                        {receiptCard}

                        <Link
                            href={`/submit/result/${submissionId}`}
                            className="submit-btn-secondary mt-8 inline-flex items-center gap-2 px-6 py-3 text-sm font-medium"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Refresh Page
                        </Link>

                        {supportFooter}
                    </>
                )}

                {/* ─── Not found ─── */}
                {!hasPayment && (
                    <>
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                        </div>
                        <h1 className="mt-6 text-center text-2xl font-bold tracking-tight text-[var(--text-primary)] md:text-3xl">
                            Payment Not Found
                        </h1>
                        <p className="mt-3 text-center text-sm leading-relaxed text-[var(--text-secondary)]">
                            We could not find a payment record for this submission. If you recently completed checkout, wait a moment and try again.
                        </p>
                        <p className="mt-4 text-center text-xs text-[var(--text-tertiary)]">
                            If you believe this is an error, contact{' '}
                            <a href="mailto:support@aibde.tech" className="font-medium text-[var(--accent-primary)] hover:underline">
                                support@aibde.tech
                            </a>
                        </p>
                        <div className="mt-8 flex flex-wrap justify-center gap-3">
                            <Link href="/submit" className="submit-btn-primary inline-flex items-center gap-2 px-6 py-3 text-sm font-medium">
                                Submit Your Tool
                            </Link>
                            <Link href="/" className="submit-btn-secondary inline-flex items-center gap-2 px-6 py-3 text-sm font-medium">
                                Back to Home
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
