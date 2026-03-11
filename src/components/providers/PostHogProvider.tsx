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
        // Only enable analytics on the production hostname (set NEXT_PUBLIC_SITE_HOSTNAME in .env)
        const prodHostname = process.env.NEXT_PUBLIC_SITE_HOSTNAME;
        const isProduction = prodHostname && window.location.hostname === prodHostname;

        if (process.env.NEXT_PUBLIC_POSTHOG_KEY && isProduction) {
            posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
                api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
                ui_host: 'https://us.posthog.com',
                capture_pageview: true,
                capture_pageleave: true,
                // Reduce network requests via batching and rate limiting
                request_batching: true,
                advanced_disable_decide: true,
                advanced_disable_feature_flags: true,
                rate_limiting: {
                    events_per_second: 2,
                    events_burst_limit: 5,
                },
            });
        }
    }, []);

    // If no key, just render children without PostHog
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
        return <>{children}</>;
    }

    return <PHProvider client={posthog}>{children}</PHProvider>;
}
