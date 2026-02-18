import { supabase, dbToolToAdminTool } from '../supabase';
import { AdminTool } from '@/types';

const MAX_SEARCH_LIMIT = 200;

const PRICING_KEYWORDS: Record<string, string> = {
    'free': 'Free',
    'freemium': 'Freemium',
    'paid': 'Paid',
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
        tools.sort((a, b) => nameRelevance(b.name, q) - nameRelevance(a.name, q));
    }

    return tools;
}

/**
 * Score a tool name against the query for relevance sorting.
 * Higher = better match. Only used as a tiebreaker after DB retrieval.
 */
function nameRelevance(name: string, query: string): number {
    const n = (name || '').toLowerCase();
    if (n === query) return 100;           // Exact match
    if (n.startsWith(query)) return 80;    // Name starts with query
    if (n.includes(query)) return 60;      // Name contains query
    // Query starts with tool name (e.g. query="chatgpt pro", name="ChatGPT")
    if (query.startsWith(n)) return 50;
    return 0;
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
