import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { escapeLike } from '@/lib/utils';

const MAX_SEARCH_LIMIT = 100;
const MAX_QUERY_LENGTH = 200;
const DB_FETCH_CAP = 500;

interface PublicTool {
    id: string;
    name: string;
    app_username: string;
    logoUrl: string | null;
    summary: string;
    categoryName: string[];
    taskName: string[];
    tags: string[];
    pricing: string;
    saveCount: number;
    isFeatured: boolean;
}

function toPublicTool(tool: Record<string, unknown>): PublicTool {
    return {
        id: tool.id as string,
        name: tool.name as string,
        app_username: tool.app_username as string,
        logoUrl: tool.logo_url as string | null,
        summary: tool.summary as string,
        categoryName: tool.category_name as string[],
        taskName: tool.task_name as string[],
        tags: tool.tags as string[],
        pricing: tool.pricing as string,
        saveCount: (tool.save_count as number) || 0,
        isFeatured: tool.is_featured as boolean,
    };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(request.url);
        const rawQuery = searchParams.get('q') || '';
        const query = rawQuery.slice(0, MAX_QUERY_LENGTH).trim();
        const category = searchParams.get('category');
        const task = searchParams.get('task');
        const pricing = searchParams.get('pricing');
        const rawLimit = parseInt(searchParams.get('limit') || '100', 10);
        const limit = Math.min(Math.max(1, Number.isNaN(rawLimit) ? 100 : rawLimit), MAX_SEARCH_LIMIT);

        const PUBLIC_SEARCH_FIELDS = `
            id, name, app_username, logo_url, summary, description,
            category_name, task_name, tags,
            pricing, pricing_label, save_count, is_featured,
            status, created_at, updated_at
        `;

        let dbQuery = supabase
            .from('tools')
            .select(PUBLIC_SEARCH_FIELDS)
            .in('status', ['published', 'approved']);

        if (query) {
            const safeQuery = escapeLike(query);
            dbQuery = dbQuery.or(`name.ilike.${safeQuery}%,summary.ilike.${safeQuery}%`);
        }

        if (category) dbQuery = dbQuery.contains('category_name', [category]);
        if (task) dbQuery = dbQuery.contains('task_name', [task]);
        if (pricing) dbQuery = dbQuery.eq('pricing', pricing);

        dbQuery = dbQuery.limit(Math.min(limit * 2, DB_FETCH_CAP));

        const { data, error } = await dbQuery;

        if (error) {
            console.error('Search error:', error);
            return NextResponse.json({ error: 'Search failed' }, { status: 500 });
        }

        let tools = (data || []).map((row) => toPublicTool(row));

        if (query) {
            const lowerQuery = query.toLowerCase();
            tools = tools.sort((a, b) => {
                const aNameMatch = a.name.toLowerCase().includes(lowerQuery);
                const bNameMatch = b.name.toLowerCase().includes(lowerQuery);
                const aNameStarts = a.name.toLowerCase().startsWith(lowerQuery);
                const bNameStarts = b.name.toLowerCase().startsWith(lowerQuery);

                if (aNameStarts && !bNameStarts) return -1;
                if (!aNameStarts && bNameStarts) return 1;
                if (aNameMatch && !bNameMatch) return -1;
                if (!aNameMatch && bNameMatch) return 1;

                return b.saveCount - a.saveCount;
            });
        }

        tools = tools.slice(0, limit);

        return NextResponse.json({ tools, count: tools.length });
    } catch (err) {
        console.error('Search API error:', err);
        return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }
}
