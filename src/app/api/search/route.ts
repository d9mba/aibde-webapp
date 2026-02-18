import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const MAX_SEARCH_LIMIT = 100;
const MAX_QUERY_LENGTH = 200;

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

        const { data, error } = await supabase.rpc('search_tools', {
            search_query: query || null,
            filter_category: category || null,
            filter_task: task || null,
            filter_pricing: pricing || null,
            result_limit: limit,
            result_offset: 0,
        });

        if (error) {
            console.error('Search error:', error);
            return NextResponse.json({ error: 'Search failed' }, { status: 500 });
        }

        const tools = (data || []).map((row: Record<string, unknown>) => toPublicTool(row));

        return NextResponse.json({ tools, count: tools.length });
    } catch (err) {
        console.error('Search API error:', err);
        return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }
}
