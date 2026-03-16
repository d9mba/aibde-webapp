import { supabaseAdmin } from '@/lib/supabase';
import Link from 'next/link';
import RetryPaymentButton from '../RetryPaymentButton';
import CleanUrlClient from '../CleanUrlClient';
import { CheckCircle, XCircle, ArrowRight, Home, PlusCircle, RefreshCw, Mail } from 'lucide-react';

interface ResultPageProps {
    params: Promise<{ submission_id: string }>;
}

export default async function SubmitResultPage({ params }: ResultPageProps) {
    const { submission_id } = await params;
    const submissionId = submission_id;

    const uuidPattern = /^[0-9a-fA-F-]{36}$/;
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
                .select('review_status, payment_status, submission_ref')
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

    const status = payment?.status as 'initiated' | 'success' | 'failed' | undefined;
    const hasPayment = !!payment;
    const reviewStatus = submission?.review_status ?? 'pending';
    const reviewLabel = reviewStatus.charAt(0).toUpperCase() + reviewStatus.slice(1);
    const displaySubmissionId = submission?.submission_ref ?? submissionId.slice(0, 8) + '…';
    const paymentStatusLabel =
        status === 'success' ? 'Paid' : status === 'failed' ? 'Failed' : 'Processing';

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <CleanUrlClient />
            <div className="mx-auto max-w-lg px-4 py-20 md:py-28">
                {/* Success state */}
                {hasPayment && status === 'success' && (
                    <div className="text-center">
                        <div className="result-success-icon mx-auto">
                            <CheckCircle className="h-10 w-10" />
                        </div>
                        <h1 className="mt-8 text-3xl font-extrabold tracking-tight text-[var(--text-primary)] md:text-4xl">
                            Your AI tool has been submitted successfully
                        </h1>
                        <p className="mt-4 text-lg leading-relaxed text-[var(--text-secondary)]">
                            Our team will review your submission. You will receive an email once your tool is live.
                        </p>

                        <div className="result-card mt-10 p-6 text-left md:p-8">
                            <div className="space-y-5">
                                {payment.tool_name && (
                                    <div className="flex justify-between gap-4 border-b border-[var(--border-color)] pb-4">
                                        <span className="text-sm font-medium text-[var(--text-tertiary)]">Tool Name</span>
                                        <span className="text-right font-semibold text-[var(--text-primary)]">{payment.tool_name}</span>
                                    </div>
                                )}
                                <div className="flex justify-between gap-4 border-b border-[var(--border-color)] pb-4">
                                    <span className="text-sm font-medium text-[var(--text-tertiary)]">Submission ID</span>
                                    <span className="font-mono text-sm font-semibold text-[var(--text-primary)]">{displaySubmissionId}</span>
                                </div>
                                <div className="flex justify-between gap-4 border-b border-[var(--border-color)] pb-4">
                                    <span className="text-sm font-medium text-[var(--text-tertiary)]">Payment Status</span>
                                    <span className="font-semibold text-[var(--accent-primary)]">{paymentStatusLabel}</span>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <span className="text-sm font-medium text-[var(--text-tertiary)]">Review Status</span>
                                    <span className="font-semibold text-[var(--text-primary)]">{reviewLabel}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
                            <Link href="/" className="submit-btn-secondary inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base">
                                <Home className="h-5 w-5" />
                                Back to Home
                            </Link>
                            <Link href="/submit" className="submit-btn-primary inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base">
                                <PlusCircle className="h-5 w-5" />
                                Submit Another Tool
                            </Link>
                            <Link href="/search" className="submit-btn-secondary inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base">
                                <ArrowRight className="h-5 w-5" />
                                View Listing
                            </Link>
                        </div>
                    </div>
                )}

                {/* Failed state */}
                {hasPayment && status === 'failed' && (
                    <div className="text-center">
                        <div className="result-fail-icon mx-auto">
                            <XCircle className="h-10 w-10" />
                        </div>
                        <h1 className="mt-8 text-3xl font-extrabold tracking-tight text-[var(--text-primary)] md:text-4xl">
                            Payment failed
                        </h1>
                        <p className="mt-4 text-lg leading-relaxed text-[var(--text-secondary)]">
                            Your payment was not completed. You can retry below or contact support if the problem persists.
                        </p>

                        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
                            <div className="flex-1 sm:max-w-[200px]">
                                <RetryPaymentButton submissionId={submissionId} />
                            </div>
                            <a
                                href="mailto:support@aibde.tech?subject=Payment%20Failed%20-%20Submission"
                                className="submit-btn-secondary inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base"
                            >
                                <Mail className="h-5 w-5" />
                                Contact Support
                            </a>
                        </div>

                        <p className="mt-8 text-[15px] text-[var(--text-tertiary)]">
                            Need help? Email us at{' '}
                            <a href="mailto:support@aibde.tech" className="font-medium text-[var(--accent-primary)] hover:underline">
                                support@aibde.tech
                            </a>
                        </p>
                    </div>
                )}

                {/* Processing state */}
                {hasPayment && status !== 'success' && status !== 'failed' && (
                    <div className="text-center">
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]">
                            <RefreshCw className="h-10 w-10 animate-spin" />
                        </div>
                        <h1 className="mt-8 text-2xl font-bold tracking-tight text-[var(--text-primary)] md:text-3xl">
                            Payment processing
                        </h1>
                        <p className="mt-4 text-[15px] text-[var(--text-secondary)]">
                            We are confirming your payment. Please wait a moment and refresh this page.
                        </p>
                        <Link
                            href={`/submit/result/${submissionId}`}
                            className="submit-btn-secondary mt-10 inline-flex items-center gap-2 px-6 py-3.5 text-base"
                        >
                            <RefreshCw className="h-5 w-5" />
                            Refresh page
                        </Link>
                    </div>
                )}

                {/* Not found */}
                {!hasPayment && (
                    <div className="text-center">
                        <div className="result-fail-icon mx-auto !bg-[var(--bg-tertiary)] !text-[var(--text-tertiary)] !shadow-none">
                            <XCircle className="h-10 w-10" />
                        </div>
                        <h1 className="mt-8 text-2xl font-bold tracking-tight text-[var(--text-primary)] md:text-3xl">
                            Payment not found
                        </h1>
                        <p className="mt-4 text-[15px] leading-relaxed text-[var(--text-secondary)]">
                            We could not find a payment record for this submission. If you recently completed checkout, wait a moment and try again.
                        </p>
                        <p className="mt-6 text-sm text-[var(--text-tertiary)]">
                            If you believe this is an error, contact{' '}
                            <a href="mailto:support@aibde.tech" className="font-medium text-[var(--accent-primary)] hover:underline">
                                support@aibde.tech
                            </a>
                        </p>
                        <div className="mt-10 flex flex-wrap justify-center gap-4">
                            <Link href="/submit" className="submit-btn-primary inline-flex items-center gap-2 px-6 py-3.5 text-base">
                                Submit Your Tool
                            </Link>
                            <Link href="/" className="submit-btn-secondary inline-flex items-center gap-2 px-6 py-3.5 text-base">
                                Back to Home
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
