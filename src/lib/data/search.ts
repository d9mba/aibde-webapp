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
        result_offset: 0,
    });

    if (error) {
        console.error('Search error:', error);
        return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data || []).map((tool: any) => dbToolToAdminTool(tool));
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
