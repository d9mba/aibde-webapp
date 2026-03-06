'use client';

import { useEffect } from 'react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Global error:', error);
    }, [error]);

    return (
        <html>
            <body style={{ background: '#0a0a0a', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
                <div style={{ padding: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '60px', marginBottom: '20px' }}>⚠️</div>
                        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>Something went wrong</h2>
                        <p style={{ color: '#888', marginBottom: '20px', maxWidth: '400px' }}>
                            An unexpected error occurred. Please try again later.
                        </p>
                        <button
                            onClick={() => reset()}
                            style={{
                                padding: '10px 20px',
                                background: '#3b82f6',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                marginRight: '10px',
                            }}
                        >
                            Try Again
                        </button>
                        <button
                            onClick={() => window.location.href = '/'}
                            style={{
                                padding: '10px 20px',
                                background: '#222',
                                color: '#fff',
                                border: '1px solid #333',
                                borderRadius: '8px',
                                cursor: 'pointer',
                            }}
                        >
                            Go Home
                        </button>
                    </div>
                </div>
            </body>
        </html>
    );
}
