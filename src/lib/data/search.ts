import { supabase, dbToolToAdminTool } from '../supabase';
import { AdminTool } from '@/types';

const MAX_SEARCH_LIMIT = 200;

const PRICING_KEYWORDS: Record<string, string> = {
    'free': 'Free',
    'freemium': 'Freemium',
    'paid': 'Paid',
    'open source': 'Open Source',
    'open-source': 'Open Source',
    'opensource': 'Open Source',
    'open_source': 'Open Source',
};

function detectPricing(query: string, explicitPricing?: string): string | undefined {
    if (explicitPricing) return explicitPricing;
    const queryLower = query?.toLowerCase() || '';
    for (const [keyword, pricingValue] of Object.entries(PRICING_KEYWORDS)) {
        if (queryLower.includes(keyword)) {
            return pricingValue;
        }
    }
    return undefined;
}

export interface SearchParams {
    query?: string;
    category?: string;
    task?: string;
    pricing?: string;
    limit?: number;
    offset?: number;
}

/**
 * Search tools using PostgreSQL Full Text Search (tsvector/tsquery)
 * via the `search_tools` RPC function.
 *
 * The DB handles:
 *   - Weighted search (name=A, summary/categories/tasks=B, tags=C, description=D)
 *   - ts_rank_cd relevance scoring
 *   - Prefix matching (:*) for type-ahead support
 *   - Category, task, and pricing filters
 */
export async function searchTools(params: SearchParams): Promise<AdminTool[]> {
    const { query, category, task, pricing, limit: rawLimit = 100 } = params;
    const limit = Math.min(Math.max(1, rawLimit ?? 100), MAX_SEARCH_LIMIT);

    const detectedPricing = detectPricing(query || '', pricing);
    const searchQuery = (query || '').trim() || null;

    const { data, error } = await supabase.rpc('search_tools', {
        search_query: searchQuery,
        filter_category: category || null,
        filter_task: task || null,
        filter_pricing: detectedPricing || null,
        result_limit: limit,
        result_offset: Math.max(0, params.offset ?? 0),
    });

    if (error) {
        console.error('Search error:', error);
        return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tools = (data || []).map((tool: any) => dbToolToAdminTool(tool));

    // Re-sort to prioritize exact and close name matches over fuzzy content matches.
    // PostgreSQL ts_rank_cd treats all text-match positions equally, so "ChatGPT Buddy"
    // can outrank "ChatGPT" when the query is "chatgpt". This re-sort fixes that.
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        tools.sort((a: AdminTool, b: AdminTool) => {
            // 1. Name accuracy
            const nameDiff = nameRelevance(b.name, q) - nameRelevance(a.name, q);
            if (nameDiff !== 0) return nameDiff;
            // 2. Spotlight
            const spotDiff = (b.spotlightEnabled ? 1 : 0) - (a.spotlightEnabled ? 1 : 0);
            if (spotDiff !== 0) return spotDiff;
            // 3. Featured
            const featDiff = (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
            if (featDiff !== 0) return featDiff;
            // 4. Listing type priority
            const listOrder: Record<string, number> = { spotlight: 0, featured: 1, verified: 2, fast: 3 };
            const aList = listOrder[a.listingType ?? ''] ?? 4;
            const bList = listOrder[b.listingType ?? ''] ?? 4;
            if (aList !== bList) return aList - bList;
            // 5. Popularity: impressions first, then saves
            const viewDiff = (b.viewCount ?? 0) - (a.viewCount ?? 0);
            if (viewDiff !== 0) return viewDiff;
            return (b.saveCount ?? 0) - (a.saveCount ?? 0);
        });
    }

    return tools;
}

/**
 * Score a tool name against the query for relevance sorting.
 * Handles both exact and fuzzy (typo) matches.
 */
function nameRelevance(name: string, query: string): number {
    const n = (name || '').toLowerCase();
    if (n === query) return 100;
    if (n.startsWith(query)) return 80;
    if (n.includes(query)) return 60;
    if (query.startsWith(n)) return 50;

    // Space-collapsed matching: "chat gpt" → "chatgpt" = exact match
    const nCompact = n.replace(/\s+/g, '');
    const qCompact = query.replace(/\s+/g, '');
    if (nCompact === qCompact) return 95;
    if (nCompact.startsWith(qCompact)) return 75;
    if (nCompact.includes(qCompact)) return 55;

    // Bigram overlap for fuzzy/typo matches (e.g. "chatgtp" → "chatgpt")
    const nBi = bigrams(nCompact);
    const qBi = bigrams(qCompact);
    if (nBi.size === 0 || qBi.size === 0) return 0;
    let overlap = 0;
    for (const b of qBi) {
        if (nBi.has(b)) overlap++;
    }
    const sim = (2 * overlap) / (nBi.size + qBi.size);
    return sim > 0.3 ? Math.round(sim * 40) : 0;
}

function bigrams(str: string): Set<string> {
    const s = new Set<string>();
    for (let i = 0; i < str.length - 1; i++) {
        s.add(str.slice(i, i + 2));
    }
    return s;
}

/**
 * Count matching tools using the `search_tools_count` RPC function.
 * Used for pagination totals.
 */
export async function searchToolsCount(params: Omit<SearchParams, 'limit'>): Promise<number> {
    const { query, category, task, pricing } = params;

    const detectedPricing = detectPricing(query || '', pricing);
    const searchQuery = (query || '').trim() || null;

    const { data, error } = await supabase.rpc('search_tools_count', {
        search_query: searchQuery,
        filter_category: category || null,
        filter_task: task || null,
        filter_pricing: detectedPricing || null,
    });

    if (error) {
        console.error('Count error:', error);
        return 0;
    }

    return data || 0;
}
