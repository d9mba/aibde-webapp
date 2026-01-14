'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useClerk } from '@clerk/nextjs';
import { use } from 'react';

/**
 * Secret login route - validates secret and redirects to Clerk hosted sign-in
 * 
 * Dev: https://choice-cougar-67.clerk.accounts.dev/sign-in
 * Prod: https://accounts.aibde.tech/sign-in
 */
export default function SecretLoginPage({ params }: { params: Promise<{ secret: string }> }) {
    const router = useRouter();
    const { isSignedIn, isLoaded } = useAuth();
    const clerk = useClerk();
    const [status, setStatus] = useState<'validating' | 'redirecting' | 'error' | 'success'>('validating');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Unwrap params using React.use()
    const { secret } = use(params);

    useEffect(() => {
        const validateAndRedirect = async () => {
            try {
                // Validate the secret
                const validSecret = process.env.NEXT_PUBLIC_ADMIN_LOGIN_SECRET || 'login-with-edsaibde';

                if (secret !== validSecret) {
                    setStatus('error');
                    setErrorMessage('Invalid access key. Access denied.');
                    setTimeout(() => router.push('/'), 3000);
                    return;
                }

                // If already signed in, go to dashboard
                if (isLoaded && isSignedIn) {
                    setStatus('success');
                    router.push('/dashboard');
                    return;
                }

                // Valid secret - redirect to Clerk hosted sign-in
                setStatus('redirecting');

                // Open Clerk's sign-in modal/redirect
                if (clerk.loaded) {
                    clerk.redirectToSignIn({
                        redirectUrl: '/dashboard',
                    });
                }

            } catch (err) {
                console.error('Login error:', err);
                setStatus('error');
                setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred');
            }
        };

        if (isLoaded && clerk.loaded) {
            validateAndRedirect();
        }
    }, [secret, router, isLoaded, isSignedIn, clerk]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-bg-primary">
            <div className="text-center p-8 max-w-md">
                {status === 'validating' && (
                    <>
                        <div className="animate-spin w-10 h-10 border-2 border-accent-blue border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-text-secondary">Validating access...</p>
                    </>
                )}

                {status === 'redirecting' && (
                    <>
                        <div className="animate-spin w-10 h-10 border-2 border-accent-green border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-text-primary font-medium mb-2">Access granted!</p>
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

                {status === 'error' && (
                    <>
                        <div className="w-10 h-10 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <p className="text-red-500 font-medium mb-2">Error</p>
                        <p className="text-text-secondary mb-4">{errorMessage}</p>
                        <p className="text-xs text-text-tertiary">Redirecting to home...</p>
                    </>
                )}
            </div>
        </div>
    );
}
