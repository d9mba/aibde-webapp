'use server';

/**
 * Server Actions for Search & Impressions
 * These run on the server and don't expose API endpoints in the Network tab
 */

import { searchTools, searchToolsCount } from '@/lib/data';
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
    // Over-fetch so server-side nameRelevance re-sort can surface exact matches
    const overFetch = Math.max(limit, 30);
    const results = await searchTools({ query, limit: overFetch });
    const q = query.toLowerCase();
    results.sort((a, b) => {
        const aName = (a.name || '').toLowerCase();
        const bName = (b.name || '').toLowerCase();
        // Score: exact=100, startsWith=80, includes=60, prefix-of-query=50
        const score = (n: string) => {
            if (n === q) return 100;
            if (n.startsWith(q)) return 80;
            if (n.includes(q)) return 60;
            if (q.startsWith(n)) return 50;
            return 0;
        };
        return score(bName) - score(aName);
    });
    return results.slice(0, limit);
}

const POSTHOG_API_HOST = 'https://app.posthog.com';

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
        const timeoutId = setTimeout(() => controller.abort(), 8000);

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

            if (!response.ok) return {};

            const data = await response.json();
            if (data.error) return {};

            const impressions: Record<string, number> = {};
            for (const row of data.results || []) {
                const slug = row[0] as string;
                if (slug) impressions[slug] = (row[1] as number) || 0;
            }
            return impressions;
        } finally {
            clearTimeout(timeoutId);
        }
    } catch {
        return {};
    }
}
