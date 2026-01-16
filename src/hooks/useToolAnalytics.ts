'use client';

import { useCallback, useEffect, useRef } from 'react';
import posthog from 'posthog-js';

/**
 * Custom hook for tracking tool analytics in PostHog
 * 
 * Tracks:
 * - Tool impressions (when card scrolls into view)
 * - Tool clicks (when user clicks on a tool)
 * - Tool page views (with time spent tracking)
 */

interface ToolData {
    id: string;
    name: string;
    slug: string;
    category?: string;
    pricing?: string;
}

/**
 * Track when a tool card is clicked
 */
export function trackToolClick(tool: ToolData, source: 'card' | 'search' | 'featured' | 'related' = 'card') {
    if (typeof window !== 'undefined' && posthog) {
        posthog.capture('tool_clicked', {
            tool_id: tool.id,
            tool_name: tool.name,
            tool_slug: tool.slug,
            tool_category: tool.category,
            tool_pricing: tool.pricing,
            click_source: source,
        });
    }
}

/**
 * Track when a tool's "Visit Website" button is clicked
 */
export function trackToolVisit(tool: ToolData, url: string) {
    if (typeof window !== 'undefined' && posthog) {
        posthog.capture('tool_website_visited', {
            tool_id: tool.id,
            tool_name: tool.name,
            tool_slug: tool.slug,
            tool_category: tool.category,
            tool_pricing: tool.pricing,
            destination_url: url,
        });
    }
}

/**
 * Track when a tool is saved/bookmarked
 */
export function trackToolSave(tool: ToolData, saved: boolean) {
    if (typeof window !== 'undefined' && posthog) {
        posthog.capture(saved ? 'tool_saved' : 'tool_unsaved', {
            tool_id: tool.id,
            tool_name: tool.name,
            tool_slug: tool.slug,
        });
    }
}

/**
 * Hook to track tool card impressions using Intersection Observer
 */
export function useToolImpression(tool: ToolData | null, source: 'list' | 'search' | 'featured' | 'spotlight' = 'list') {
    const hasTracked = useRef(false);
    const elementRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
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
                                tool_slug: tool.slug,
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
 * Hook to track time spent on tool detail page
 */
export function useToolPageView(tool: ToolData | null) {
    const startTime = useRef<number>(0);

    useEffect(() => {
        if (!tool) return;

        startTime.current = Date.now();

        // Track page view
        if (typeof window !== 'undefined' && posthog) {
            posthog.capture('tool_page_viewed', {
                tool_id: tool.id,
                tool_name: tool.name,
                tool_slug: tool.slug,
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
                    tool_slug: tool.slug,
                    time_spent_seconds: timeSpent,
                });
            }
        };
    }, [tool]);
}

/**
 * Track search queries
 */
export function trackSearch(query: string, resultCount: number) {
    if (typeof window !== 'undefined' && posthog) {
        posthog.capture('search_performed', {
            search_query: query,
            result_count: resultCount,
        });
    }
}

/**
 * Track category/task filter usage
 */
export function trackFilterUsed(filterType: 'category' | 'task' | 'pricing', filterValue: string) {
    if (typeof window !== 'undefined' && posthog) {
        posthog.capture('filter_used', {
            filter_type: filterType,
            filter_value: filterValue,
        });
    }
}
