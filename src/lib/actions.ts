'use server';

/**
 * Server Actions for Search
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
    return searchTools({ query, limit });
}
