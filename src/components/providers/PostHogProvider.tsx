'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect } from 'react';

/**
 * PostHog Analytics Provider
 * 
 * Initializes PostHog for client-side analytics tracking.
 * Requires NEXT_PUBLIC_POSTHOG_KEY and NEXT_PUBLIC_POSTHOG_HOST env vars.
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // Only initialize if the key is provided AND in production
        if (process.env.NEXT_PUBLIC_POSTHOG_KEY && process.env.NODE_ENV === 'production') {
            posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
                api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
                ui_host: 'https://us.posthog.com',
                capture_pageview: true,
                capture_pageleave: true,
            });
        }
    }, []);

    // If no key, just render children without PostHog
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
        return <>{children}</>;
    }

    return <PHProvider client={posthog}>{children}</PHProvider>;
}
