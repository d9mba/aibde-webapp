'use client';

import { useCallback, useEffect, useRef } from 'react';
import posthog from 'posthog-js';

// Skip analytics in development
const isDevelopment = process.env.NODE_ENV !== 'production';

/**
 * Custom hook for tracking tool analytics in PostHog
 * 
 * Tracks:
 * - Tool impressions (when card scrolls into view)
 * - Tool clicks (when user clicks on a tool)
 * - Tool page views (with time spent tracking)
 * 
 * NOTE: Analytics are disabled in development mode
 */

interface ToolData {
    id: string;
    name: string;
    app_username: string;
    category?: string;
    pricing?: string;
}

/**
 * Record an analytics event when a tool is clicked.
 *
 * Sends a 'tool_clicked' event containing the tool's id, name, app username, category, pricing, and the click source.
 *
 * @param tool - The tool metadata to include in the event
 * @param source - Origin of the click; one of `'card'`, `'search'`, `'featured'`, or `'related'` (default: `'card'`)
 */
export function trackToolClick(tool: ToolData, source: 'card' | 'search' | 'featured' | 'related' = 'card') {
    if (isDevelopment) return;
    if (typeof window !== 'undefined' && posthog) {
        posthog.capture('tool_clicked', {
            tool_id: tool.id,
            tool_name: tool.name,
            tool_slug: tool.app_username,
            tool_category: tool.category,
            tool_pricing: tool.pricing,
            click_source: source,
        });
    }
}

/**
 * Records that a tool's website was visited for analytics.
 *
 * @param tool - The tool metadata to include in the event
 * @param url - Destination URL that was visited
 */
export function trackToolVisit(tool: ToolData, url: string) {
    if (isDevelopment) return;
    if (typeof window !== 'undefined' && posthog) {
        posthog.capture('tool_website_visited', {
            tool_id: tool.id,
            tool_name: tool.name,
            tool_slug: tool.app_username,
            tool_category: tool.category,
            tool_pricing: tool.pricing,
            destination_url: url,
        });
    }
}

/**
 * Record a tool's bookmark/save state change to analytics.
 *
 * Sends a `tool_saved` event when `saved` is `true` and `tool_unsaved` when `saved` is `false`.
 *
 * @param tool - Metadata for the tool being saved or unsaved
 * @param saved - `true` if the tool was saved/bookmarked, `false` if it was removed from bookmarks
 */
export function trackToolSave(tool: ToolData, saved: boolean) {
    if (isDevelopment) return;
    if (typeof window !== 'undefined' && posthog) {
        posthog.capture(saved ? 'tool_saved' : 'tool_unsaved', {
            tool_id: tool.id,
            tool_name: tool.name,
            tool_slug: tool.app_username,
        });
    }
}

/**
 * Track a tool card impression and send a single analytics event when the card becomes at least 50% visible in the viewport.
 *
 * If `tool` is null or the hook is running in a development environment, no analytics event will be emitted.
 *
 * @param tool - The tool to track; pass `null` to disable tracking.
 * @param source - Where the impression occurred (defaults to `'list'`).
 * @returns A ref to attach to the tool's container element; `ref.current` will be an `HTMLDivElement` or `null`.
 */
export function useToolImpression(tool: ToolData | null, source: 'list' | 'search' | 'featured' | 'spotlight' = 'list') {
    const hasTracked = useRef(false);
    const elementRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isDevelopment) return;
        if (!tool || hasTracked.current || !elementRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !hasTracked.current) {
                        hasTracked.current = true;
                        if (typeof window !== 'undefined' && posthog) {
                            posthog.capture('tool_impression', {
                                tool_id: tool.id,
                                tool_name: tool.name,
                                tool_slug: tool.app_username,
                                tool_category: tool.category,
                                impression_source: source,
                            });
                        }
                        observer.disconnect();
                    }
                });
            },
            { threshold: 0.5 } // 50% visible
        );

        observer.observe(elementRef.current);

        return () => observer.disconnect();
    }, [tool, source]);

    return elementRef;
}

/**
 * Track and report page views and time spent on a tool's detail page.
 *
 * When a non-null `tool` is provided and analytics are enabled, records an immediate
 * `tool_page_viewed` event with the tool's metadata, and on unmount or when `tool`
 * changes records a `tool_page_left` event including `time_spent_seconds`.
 *
 * @param tool - The tool being viewed; if `null`, no tracking is performed
 */
export function useToolPageView(tool: ToolData | null) {
    const startTime = useRef<number>(0);

    useEffect(() => {
        if (isDevelopment) return;
        if (!tool) return;

        startTime.current = Date.now();

        // Track page view
        if (typeof window !== 'undefined' && posthog) {
            posthog.capture('tool_page_viewed', {
                tool_id: tool.id,
                tool_name: tool.name,
                tool_slug: tool.app_username,
                tool_category: tool.category,
                tool_pricing: tool.pricing,
            });
        }

        // Track time spent when leaving
        return () => {
            if (startTime.current && typeof window !== 'undefined' && posthog) {
                const timeSpent = Math.round((Date.now() - startTime.current) / 1000);
                posthog.capture('tool_page_left', {
                    tool_id: tool.id,
                    tool_name: tool.name,
                    tool_slug: tool.app_username,
                    time_spent_seconds: timeSpent,
                });
            }
        };
    }, [tool]);
}

/**
 * Record a user search event for analytics.
 *
 * @param query - The search query string entered by the user
 * @param resultCount - The number of results returned for the query
 */
export function trackSearch(query: string, resultCount: number) {
    if (isDevelopment) return;
    if (typeof window !== 'undefined' && posthog) {
        posthog.capture('search_performed', {
            search_query: query,
            result_count: resultCount,
        });
    }
}

/**
 * Record a filter usage event for analytics.
 *
 * @param filterType - The type of filter used: `'category'`, `'task'`, or `'pricing'`
 * @param filterValue - The selected filter value (e.g., category name, task name, or pricing tier)
 */
export function trackFilterUsed(filterType: 'category' | 'task' | 'pricing', filterValue: string) {
    if (isDevelopment) return;
    if (typeof window !== 'undefined' && posthog) {
        posthog.capture('filter_used', {
            filter_type: filterType,
            filter_value: filterValue,
        });
    }
}