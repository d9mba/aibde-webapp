import { supabaseAdmin } from '@/lib/supabase';
import Link from 'next/link';
import RetryPaymentButton from '../RetryPaymentButton';
import CleanUrlClient from '../CleanUrlClient';

interface ResultPageProps {
    params: Promise<{ submission_id: string }>;
}

export default async function SubmitResultPage({ params }: ResultPageProps) {
    const { submission_id } = await params;
    const submissionId = submission_id;

    // If submissionId is not a valid UUID, skip querying and treat as "not found"
    const uuidPattern = /^[0-9a-fA-F-]{36}$/;
    let payment: any = null;
    let error: any = null;

    if (uuidPattern.test(submissionId)) {
        const result = await supabaseAdmin
            .from('payments')
            .select('*')
            .eq('submission_id', submissionId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        payment = result.data;
        error = result.error;

        // Only log real DB errors (skip invalid-id and empty cases)
        if (error && (error as any).message && (error as any).code !== '22P02') {
            console.error('[Submit Result] Failed to load payment', error);
        }
    }

    const status = payment?.status as 'initiated' | 'success' | 'failed' | undefined;
    const hasPayment = !!payment;

    const title = !hasPayment
        ? 'Payment Not Found'
        : status === 'success'
        ? 'Payment Successful'
        : status === 'failed'
        ? 'Payment Failed'
        : 'Payment Processing';

    const description = !hasPayment
        ? 'We could not find a payment record for this submission. If you recently completed checkout, please wait a moment and try again.'
        : status === 'success'
        ? 'Thank you for submitting your AI tool. Our team will review your submission shortly. If approved, it will be published on AiBDE.tech.'
        : status === 'failed'
        ? 'Your payment was not completed.'
        : 'We are confirming your payment. Please wait a moment and refresh this page.';

    const planLabel = payment?.plan
        ? payment.plan.charAt(0).toUpperCase() + payment.plan.slice(1)
        : undefined;

    return (
        <div className="max-w-xl mx-auto px-4 py-12">
            {/* Strip query params from URL in the browser (hides long Dodo redirect URL) */}
            <CleanUrlClient />
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-text-primary mb-2">{title}</h1>
                <p className="text-text-secondary">{description}</p>
                <p className="mt-2 text-sm text-text-tertiary">
                    If you believe this status is incorrect or have any issues, please contact{' '}
                    <a
                        href="mailto:support@aibde.tech"
                        className="text-accent-primary hover:underline"
                    >
                        support@aibde.tech
                    </a>
                    .
                </p>
            </div>

            {payment && (
                <div className="bg-bg-card border border-border rounded-xl p-6 space-y-3 mb-6">
                    {payment.tool_name && (
                        <div className="flex justify-between text-sm">
                            <span className="text-text-secondary">Tool Name</span>
                            <span className="font-medium text-text-primary">
                                {payment.tool_name}
                            </span>
                        </div>
                    )}
                    {payment.tool_url && (
                        <div className="flex justify-between text-sm">
                            <span className="text-text-secondary">Website URL</span>
                            <a
                                href={payment.tool_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-accent-primary underline-offset-2 hover:underline"
                            >
                                {payment.tool_url}
                            </a>
                        </div>
                    )}
                    {planLabel && (
                        <div className="flex justify-between text-sm">
                            <span className="text-text-secondary">Selected Plan</span>
                            <span className="font-medium text-text-primary">{planLabel}</span>
                        </div>
                    )}
                    {payment.submitter_email && (
                        <div className="flex justify-between text-sm">
                            <span className="text-text-secondary">Submitter Email</span>
                            <span className="font-medium text-text-primary">
                                {payment.submitter_email}
                            </span>
                        </div>
                    )}
                </div>
            )}

            {status === 'failed' && hasPayment && (
                <RetryPaymentButton submissionId={submissionId} />
            )}

            <div className="text-center text-sm text-text-tertiary mt-6">
                <Link href="/submit" className="text-accent-primary hover:underline">
                    Back to submission form
                </Link>
            </div>
        </div>
    );
}

