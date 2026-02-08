import { supabase, dbToolToAdminTool } from '../supabase';
import { escapeLike } from '../utils';
import { AdminTool } from '@/types';

const MAX_SEARCH_LIMIT = 200;

const PRICING_KEYWORDS: Record<string, string> = {
    'free': 'Free',
    'freemium': 'Freemium',
    'paid': 'Paid',
};

const STOP_WORDS = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'for', 'with', 'to', 'of', 'in', 'on', 'at',
    'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'tool', 'tools', 'app', 'apps', 'software', 'best', 'top', 'ai',
    'i', 'me', 'my', 'we', 'our', 'you', 'your', 'it', 'its',
    'what', 'which', 'how', 'can', 'find', 'get', 'use', 'using'
]);

function extractKeywords(q: string): string[] {
    if (!q) return [];
    return q.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length >= 2 && !STOP_WORDS.has(word) && !PRICING_KEYWORDS[word]);
}

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

export async function searchTools(params: SearchParams): Promise<AdminTool[]> {
    const { query, category, task, pricing, limit: rawLimit = 100 } = params;
    const limit = Math.min(Math.max(1, rawLimit ?? 100), MAX_SEARCH_LIMIT);

    const detectedPricing = detectPricing(query || '', pricing);
    const keywords = query ? extractKeywords(query) : [];
    const fullQuery = keywords.join(' ').trim();
    const safeFullQuery = escapeLike(fullQuery);

    let dbQuery = supabase
        .from('tools')
        .select('*')
        .in('status', ['published', 'approved']);

    if (keywords.length > 0) {
        const conditions: string[] = [];

        if (fullQuery.length >= 3) {
            conditions.push(`name.ilike.%${safeFullQuery}%`);
            conditions.push(`summary.ilike.%${safeFullQuery}%`);
        }

        for (const keyword of keywords.slice(0, 5)) {
            const safeKeyword = escapeLike(keyword);
            conditions.push(`name.ilike.%${safeKeyword}%`);
            conditions.push(`summary.ilike.%${safeKeyword}%`);
            conditions.push(`description.ilike.%${safeKeyword}%`);
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

    const dbLimit = Math.min(limit * 3, 1000);
    dbQuery = dbQuery.limit(dbLimit);

    const { data, error } = await dbQuery;

    if (error) {
        console.error('Search error:', error);
        return [];
    }

    let tools = (data || []).map((tool) => dbToolToAdminTool(tool));

    if (keywords.length > 0 || fullQuery) {
        const scored = tools.map((tool) => {
            let score = 0;
            const nameL = tool.name.toLowerCase();
            const summaryL = (tool.summary || '').toLowerCase();
            const descL = (tool.description || '').toLowerCase();
            const categories = (tool.categoryName || []).map((c) => c.toLowerCase());
            const tasks = (tool.taskName || []).map((t) => t.toLowerCase());
            const tags = (tool.tags || []).map((t) => t.toLowerCase());

            if (nameL === fullQuery) score += 200;
            if (fullQuery && nameL.startsWith(fullQuery)) score += 100;
            if (fullQuery && nameL.includes(fullQuery)) {
                score += 80;
                score += Math.max(0, 30 - (nameL.length - fullQuery.length));
            }
            if (fullQuery && summaryL.includes(fullQuery)) score += 30;

            for (const keyword of keywords) {
                if (nameL.includes(keyword)) score += 25;
                if (summaryL.includes(keyword)) score += 15;
                if (descL.includes(keyword)) score += 5;
                if (categories.some((c) => c.includes(keyword))) score += 20;
                if (tasks.some((t) => t.includes(keyword))) score += 20;
                if (tags.some((t) => t.includes(keyword))) score += 10;
            }

            score += Math.min((tool.saveCount || 0) / 10, 20);

            return { ...tool, _score: score };
        });

        tools = scored
            .filter((t) => t._score > 0)
            .sort((a, b) => {
                if (b._score !== a._score) return b._score - a._score;
                return (b.saveCount ?? 0) - (a.saveCount ?? 0);
            })
            .map(({ _score, ...tool }) => tool);
    }

    return tools.slice(0, limit);
}

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
            const safeKeyword = escapeLike(keyword);
            conditions.push(`name.ilike.%${safeKeyword}%`);
            conditions.push(`summary.ilike.%${safeKeyword}%`);
            conditions.push(`description.ilike.%${safeKeyword}%`);
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
