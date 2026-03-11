'use server';

/**
 * Server Actions for Search & Impressions
 * These run on the server and don't expose API endpoints in the Network tab
 */

import { searchTools, searchToolsCount } from '@/lib/data';
import { supabase } from '@/lib/supabase';
import { toFullUrl } from '@/lib/url';
import { AdminTool } from '@/types';

export interface SearchParams {
    query?: string;
    category?: string;
    task?: string;
    pricing?: string;
    limit?: number;
    offset?: number;
}

export interface SearchWithCountResult {
    tools: AdminTool[];
    totalCount: number;
}

/**
 * Server Action: Search tools
 * Replaces client-side fetch to /api/search
 * Hidden from browser Network tab
 */
export async function searchToolsAction(params: SearchParams): Promise<AdminTool[]> {
    return searchTools(params);
}

/**
 * Server Action: Search tools with count
 * Returns both results and total count for pagination
 */
export async function searchWithCountAction(params: SearchParams): Promise<SearchWithCountResult> {
    const [tools, totalCount] = await Promise.all([
        searchTools(params),
        searchToolsCount(params),
    ]);
    return { tools, totalCount };
}

/**
 * Server Action: Get search count only
 * For showing total before loading all results
 */
export async function searchCountAction(params: SearchParams): Promise<number> {
    return searchToolsCount(params);
}

/**
 * Server Action: Get search suggestions
 * For real-time search suggestions in header/hero
 */
export async function getSearchSuggestionsAction(query: string, limit: number = 6): Promise<AdminTool[]> {
    if (!query || query.length < 2) {
        return [];
    }

    const q = query.trim();

    // Lightweight query — only fetch the fields needed for the suggestion dropdown
    const { data, error } = await supabase
        .from('tools')
        .select('id, name, app_username, logo_url, summary, listing_type, is_featured, spotlight_enabled, pricing, view_count')
        .eq('status', 'published')
        .ilike('name', `%${q}%`)
        .order('spotlight_enabled', { ascending: false, nullsFirst: false })
        .order('is_featured', { ascending: false, nullsFirst: false })
        .order('view_count', { ascending: false, nullsFirst: false })
        .limit(limit);

    if (error) {
        console.error('Suggestion query error:', error);
        return [];
    }

    const qLower = q.toLowerCase();
    // Map to the minimal AdminTool shape the dropdown expects
    return (data || [])
        .map(t => ({
            id: t.id,
            name: t.name,
            appUsername: t.app_username,
            logoUrl: toFullUrl(t.logo_url),
            summary: t.summary || '',
            listingType: t.listing_type,
            isFeatured: t.is_featured,
            spotlightEnabled: t.spotlight_enabled,
            pricing: t.pricing || 'freemium',
        } as AdminTool))
        .sort((a, b) => {
            // Prioritize exact/prefix name matches
            const aName = a.name.toLowerCase();
            const bName = b.name.toLowerCase();
            const aExact = aName === qLower ? 2 : aName.startsWith(qLower) ? 1 : 0;
            const bExact = bName === qLower ? 2 : bName.startsWith(qLower) ? 1 : 0;
            return bExact - aExact;
        });
}

const POSTHOG_API_HOST = process.env.POSTHOG_API_HOST || 'https://app.posthog.com';

/**
 * Server Action: Get tool impression counts from PostHog
 * Hidden from browser Network tab
 */
export async function getImpressionsAction(): Promise<Record<string, number>> {
    const apiKey = process.env.POSTHOG_PERSONAL_API_KEY;
    const projectId = process.env.POSTHOG_PROJECT_ID;

    if (!apiKey || !projectId) return {};

    const hogqlQuery = `
        SELECT
            properties.tool_slug as tool_slug,
            countIf(event = 'tool_impression') as impressions
        FROM events
        WHERE
            timestamp >= now() - interval 365 day
            AND event = 'tool_impression'
            AND properties.tool_slug IS NOT NULL
        GROUP BY properties.tool_slug
        ORDER BY impressions DESC
        LIMIT 500
    `;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        try {
            const response = await fetch(`${POSTHOG_API_HOST}/api/projects/${projectId}/query/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: { kind: 'HogQLQuery', query: hogqlQuery },
                }),
                signal: controller.signal,
            });

            if (!response.ok) {
                console.error(`[getImpressionsAction] PostHog API error: HTTP ${response.status} ${response.url}`);
                return {};
            }

            const data = await response.json();
            if (data.error) {
                console.error('[getImpressionsAction] PostHog query error:', data.error);
                return {};
            }

            const impressions: Record<string, number> = {};
            for (const row of data.results || []) {
                const slug = row[0] as string;
                if (slug) impressions[slug] = (row[1] as number) || 0;
            }
            return impressions;
        } finally {
            clearTimeout(timeoutId);
        }
    } catch (err) {
        console.error('[getImpressionsAction] PostHog fetch failed:', err instanceof Error ? err.message : err);
        return {};
    }
}
