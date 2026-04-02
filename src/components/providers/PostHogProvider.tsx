'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect, useState } from 'react';

/**
 * PostHog Analytics Provider
 * 
 * Initializes PostHog for client-side analytics tracking.
 * Requires NEXT_PUBLIC_POSTHOG_KEY and NEXT_PUBLIC_POSTHOG_HOST env vars.
 */

export function PostHogProvider({ children }: { children: React.ReactNode }) {
    const [shouldRender, setShouldRender] = useState(false);

    useEffect(() => {
        // Only enable analytics on the production hostname (set NEXT_PUBLIC_SITE_HOSTNAME in .env)
        const prodHostname = process.env.NEXT_PUBLIC_SITE_HOSTNAME;
        const isProduction = prodHostname && (window.location.hostname === prodHostname || window.location.hostname === `www.${prodHostname}`);

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
            setShouldRender(true);
        }
    }, []);

    // If no key or not initialized on correct hostname, just render children without PostHog wrapper
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY || !shouldRender) {
        return <>{children}</>;
    }

    return <PHProvider client={posthog}>{children}</PHProvider>;
}
