'use client';

import { useEffect } from 'react';

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Dashboard error:', error);
    }, [error]);

    return (
        <div className="p-6 flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
                <div className="text-5xl mb-4">⚠️</div>
                <h2 className="text-xl font-bold text-text-primary mb-2">Something went wrong</h2>
                <p className="text-text-secondary mb-4 max-w-md">
                    {error.message || 'An unexpected error occurred. Please try again.'}
                </p>
                <div className="flex gap-3 justify-center">
                    <button
                        onClick={() => reset()}
                        className="px-4 py-2 bg-accent-primary text-white rounded-xl text-sm font-medium hover:bg-accent-primary/90"
                    >
                        Try Again
                    </button>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-bg-secondary border border-border text-text-primary rounded-xl text-sm font-medium hover:bg-bg-tertiary"
                    >
                        Reload Page
                    </button>
                </div>
            </div>
        </div>
    );
}
