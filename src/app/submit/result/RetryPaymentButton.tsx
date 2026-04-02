'use client';

import { useState } from 'react';

interface RetryPaymentButtonProps {
    submissionId: string;
}

export default function RetryPaymentButton({ submissionId }: RetryPaymentButtonProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRetry = async () => {
        if (loading) return;
        setLoading(true);
        setError(null);

        try {
            const baseUrl = window.location.origin;

            const res = await fetch('/api/payments/retry', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ submissionId, baseUrl }),
            });

            const json = await res.json().catch(() => ({}));

            if (!res.ok) {
                throw new Error(json.error || 'Failed to start checkout. Please try again.');
            }

            if (json.checkoutUrl) {
                try {
                    const parsedUrl = new URL(json.checkoutUrl as string);
                    if (parsedUrl.protocol === 'https:' || parsedUrl.protocol === 'http:') {
                        window.location.href = parsedUrl.href;
                        return;
                    }
                } catch {
                    // Invalid URL format, fall through to throw error
                }
            }

            throw new Error('Missing checkout URL from payment provider. Please try again.');
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Something went wrong. Please try again.',
            );
            setLoading(false);
        }
    };

    return (
        <div>
            <button
                type="button"
                onClick={handleRetry}
                disabled={loading}
                className="submit-btn-primary inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
                {loading ? 'Redirecting to payment...' : 'Retry Payment'}
            </button>
            {error && (
                <p role="alert" className="mt-2 text-center text-xs text-[var(--accent-red)]">
                    {error}
                </p>
            )}
        </div>
    );
}

