'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useClerk } from '@clerk/nextjs';

/**
 * Secret login route - Secret is validated server-side in middleware.ts
 * This page only handles the redirect to Clerk sign-in.
 * 
 * SECURITY: The secret is never exposed to the client.
 * If user reaches this page, middleware has already validated the secret.
 */
export default function SecretLoginPage() {
    const router = useRouter();
    const { isSignedIn, isLoaded } = useAuth();
    const clerk = useClerk();
    const [status, setStatus] = useState<'checking' | 'redirecting' | 'success'>('checking');

    useEffect(() => {
        const handleRedirect = async () => {
            // If middleware let us through, the secret is valid
            // If already signed in, go to dashboard
            if (isLoaded && isSignedIn) {
                setStatus('success');
                router.push('/dashboard');
                return;
            }

            // Redirect to Clerk sign-in
            setStatus('redirecting');
            if (clerk.loaded) {
                clerk.redirectToSignIn({
                    redirectUrl: '/dashboard',
                });
            }
        };

        if (isLoaded && clerk.loaded) {
            handleRedirect();
        }
    }, [router, isLoaded, isSignedIn, clerk]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-bg-primary">
            <div className="text-center p-8 max-w-md">
                {status === 'checking' && (
                    <>
                        <div className="animate-spin w-10 h-10 border-2 border-accent-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-text-secondary">Validating access...</p>
                    </>
                )}

                {status === 'redirecting' && (
                    <>
                        <div className="animate-spin w-10 h-10 border-2 border-accent-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-text-primary font-medium mb-2">Access granted</p>
                        <p className="text-text-secondary">Redirecting to sign-in...</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-10 h-10 bg-accent-green/20 text-accent-green rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <p className="text-text-primary font-medium mb-2">Already signed in!</p>
                        <p className="text-text-secondary">Redirecting to dashboard...</p>
                    </>
                )}
            </div>
        </div>
    );
}
