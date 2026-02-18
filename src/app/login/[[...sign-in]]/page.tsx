'use client';

import { SignIn } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

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

const CLERK_LIGHT = {
    colorBackground: '#f5f5f5',
    colorInputBackground: '#ffffff',
    colorText: '#1a1a1a',
    colorTextSecondary: '#525252',
    colorPrimary: '#34b27b',
    colorInputText: '#1a1a1a',
    colorNeutral: '#1a1a1a',
};

const CLERK_DARK = {
    colorBackground: '#202222',
    colorInputBackground: '#2a2b2b',
    colorText: '#ececec',
    colorTextSecondary: '#a3a3a3',
    colorPrimary: '#34b27b',
    colorInputText: '#ececec',
    colorNeutral: '#ececec',
};

function useResolvedTheme() {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        function check() {
            setIsDark(document.documentElement.getAttribute('data-theme') === 'dark');
        }
        check();

        const observer = new MutationObserver(check);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        return () => observer.disconnect();
    }, []);

    return isDark;
}

export default function LoginPage() {
    const isDark = useResolvedTheme();

    return (
        <div className="min-h-screen flex items-center justify-center bg-bg-primary">
            <SignIn
                appearance={{
                    variables: isDark ? CLERK_DARK : CLERK_LIGHT,
                    elements: {
                        rootBox: 'mx-auto',
                        card: 'border border-border-primary shadow-xl',
                        formButtonPrimary: 'bg-accent-primary hover:bg-accent-primary/90',
                        footerActionLink: 'text-accent-primary hover:text-accent-primary/80',
                        socialButtonsBlockButton: 'border-border-primary',
                        identityPreviewEditButton: 'text-accent-primary',
                        formFieldAction: 'text-accent-primary',
                    },
                }}
                forceRedirectUrl="/dashboard"
                fallbackRedirectUrl="/dashboard"
            />
        </div>
    );
}
