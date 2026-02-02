/**
 * Search Functions
 * Server-side search with relevance scoring
 */

import { supabase, dbToolToAdminTool } from '../supabase';
import { AdminTool } from '@/types';

// Pricing keywords to detect in query
const PRICING_KEYWORDS: Record<string, string> = {
    'free': 'Free',
    'freemium': 'Freemium',
    'paid': 'Paid',
};

// Stop words to filter out from search
const STOP_WORDS = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'for', 'with', 'to', 'of', 'in', 'on', 'at',
    'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'tool', 'tools', 'app', 'apps', 'software', 'best', 'top', 'ai',
    'i', 'me', 'my', 'we', 'our', 'you', 'your', 'it', 'its',
    'what', 'which', 'how', 'can', 'find', 'get', 'use', 'using'
]);

/**
 * Extract meaningful keywords from query
 */
function extractKeywords(q: string): string[] {
    if (!q) return [];
    return q.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length >= 2 && !STOP_WORDS.has(word) && !PRICING_KEYWORDS[word]);
}

/**
 * Detect pricing from query string
 */
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
 * Server-side search function
 * Tokenizes query, removes stop words, matches categories/tasks
 * Returns sorted by relevance
 */
export async function searchTools(params: SearchParams): Promise<AdminTool[]> {
    const { query, category, task, pricing, limit = 100 } = params;

    const detectedPricing = detectPricing(query || '', pricing);
    const keywords = query ? extractKeywords(query) : [];
    const fullQuery = keywords.join(' ').trim();

    // Build the query
    let dbQuery = supabase
        .from('tools')
        .select('*')
        .in('status', ['published', 'approved']);

    if (keywords.length > 0) {
        const conditions: string[] = [];

        if (fullQuery.length >= 3) {
            conditions.push(`name.ilike.%${fullQuery}%`);
            conditions.push(`summary.ilike.%${fullQuery}%`);
        }

        for (const keyword of keywords.slice(0, 5)) {
            conditions.push(`name.ilike.%${keyword}%`);
            conditions.push(`summary.ilike.%${keyword}%`);
            conditions.push(`description.ilike.%${keyword}%`);
            conditions.push(`category_name.cs.{${keyword}}`);
            conditions.push(`task_name.cs.{${keyword}}`);
            conditions.push(`tags.cs.{${keyword}}`);
        }

        if (conditions.length > 0) {
            dbQuery = dbQuery.or(conditions.join(','));
        }
    }

    if (category) {
        dbQuery = dbQuery.contains('category_name', [category]);
    }

    if (task) {
        dbQuery = dbQuery.contains('task_name', [task]);
    }

    if (detectedPricing) {
        dbQuery = dbQuery.eq('pricing', detectedPricing);
    }

    dbQuery = dbQuery.limit(limit * 3);

    const { data, error } = await dbQuery;

    if (error) {
        console.error('Search error:', error);
        return [];
    }

    let tools = (data || []).map(tool => dbToolToAdminTool(tool));

    // Score and sort results by relevance
    if (keywords.length > 0 || fullQuery) {
        tools = tools.map(tool => {
            let score = 0;
            const nameL = tool.name.toLowerCase();
            const summaryL = (tool.summary || '').toLowerCase();
            const descL = (tool.description || '').toLowerCase();
            const categories = (tool.categoryName || []).map(c => c.toLowerCase());
            const tasks = (tool.taskName || []).map(t => t.toLowerCase());
            const tags = (tool.tags || []).map(t => t.toLowerCase());

            // Exact name match gets highest priority
            if (nameL === fullQuery) score += 200;
            // Name starts with query gets high priority
            if (fullQuery && nameL.startsWith(fullQuery)) score += 100;
            // Shorter names that contain the query rank higher (prefer "ChatGPT" over "ChatGPT Atlas")
            if (fullQuery && nameL.includes(fullQuery)) {
                score += 80;
                score += Math.max(0, 30 - (nameL.length - fullQuery.length)); // Bonus for shorter names
            }
            if (fullQuery && summaryL.includes(fullQuery)) score += 30;

            for (const keyword of keywords) {
                if (nameL.includes(keyword)) score += 25;
                if (summaryL.includes(keyword)) score += 15;
                if (descL.includes(keyword)) score += 5;
                if (categories.some(c => c.includes(keyword))) score += 20;
                if (tasks.some(t => t.includes(keyword))) score += 20;
                if (tags.some(t => t.includes(keyword))) score += 10;
            }

            score += Math.min((tool.saveCount || 0) / 10, 20);

            return { ...tool, _score: score };
        });

        tools = tools
            .filter((t: any) => t._score > 0)
            .sort((a: any, b: any) => {
                if (b._score !== a._score) return b._score - a._score;
                return b.saveCount - a.saveCount;
            })
            .map((t: any) => {
                const { _score, ...tool } = t;
                return tool;
            });
    }

    return tools.slice(0, limit);
}

/**
 * Server-side search count function
 * Returns total count of matching tools (for pagination)
 */
export async function searchToolsCount(params: Omit<SearchParams, 'limit'>): Promise<number> {
    const { query, category, task, pricing } = params;

    const detectedPricing = detectPricing(query || '', pricing);
    const keywords = query ? extractKeywords(query) : [];

    let dbQuery = supabase
        .from('tools')
        .select('*', { count: 'exact', head: true })
        .in('status', ['published', 'approved']);

    if (keywords.length > 0) {
        const conditions: string[] = [];
        for (const keyword of keywords.slice(0, 5)) {
            conditions.push(`name.ilike.%${keyword}%`);
            conditions.push(`summary.ilike.%${keyword}%`);
            conditions.push(`description.ilike.%${keyword}%`);
        }
        if (conditions.length > 0) {
            dbQuery = dbQuery.or(conditions.join(','));
        }
    }

    if (category) {
        dbQuery = dbQuery.contains('category_name', [category]);
    }

    if (task) {
        dbQuery = dbQuery.contains('task_name', [task]);
    }

    if (detectedPricing) {
        dbQuery = dbQuery.eq('pricing', detectedPricing);
    }

    const { count, error } = await dbQuery;

    if (error) {
        console.error('Count error:', error);
        return 0;
    }

    return count || 0;
}
