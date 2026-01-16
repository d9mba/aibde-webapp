'use client';

import { SignIn } from '@clerk/nextjs';

/**
 * /login page - Clerk Sign-In
 * 
 * SECURITY: This page is protected by middleware.
 * Direct access to /login is blocked unless:
 * 1. User has admin_access cookie (set by /login/SECRET)
 * 2. User is already signed in
 * 
 * After successful sign-in, redirects to /dashboard
 */
export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-bg-primary">
            <SignIn
                appearance={{
                    elements: {
                        rootBox: 'mx-auto',
                        card: 'bg-bg-secondary border border-border-primary shadow-xl',
                        headerTitle: 'text-text-primary',
                        headerSubtitle: 'text-text-secondary',
                        formFieldLabel: 'text-text-secondary',
                        formFieldInput: 'bg-bg-tertiary border-border-primary text-text-primary',
                        formButtonPrimary: 'bg-accent-primary hover:bg-accent-primary/90',
                        footerActionLink: 'text-accent-primary hover:text-accent-primary/80',
                    },
                }}
                forceRedirectUrl="/dashboard"
                fallbackRedirectUrl="/dashboard"
            />
        </div>
    );
}
