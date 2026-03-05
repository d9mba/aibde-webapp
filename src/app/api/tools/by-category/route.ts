import { NextRequest, NextResponse } from 'next/server';
import { supabase, dbToolToCardTool } from '@/lib/supabase';

// Only fetch columns needed for ToolCard display
const CARD_COLUMNS = 'id,name,app_username,summary,category_name,task_name,pricing,pricing_label,logo_url,website_url,back_links,save_count,view_count,upvotes,rating,launched_on,created_at,updated_at,is_featured,listing_type,spotlight_enabled';

/**
 * GET /api/tools/by-category - Paginated tools by category
 * Query params: category (required), offset, limit
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const rawOffset = parseInt(searchParams.get('offset') || '0', 10);
        const rawLimit = parseInt(searchParams.get('limit') || '48', 10);
        const offset = Number.isNaN(rawOffset) || rawOffset < 0 ? 0 : rawOffset;
        const limit = Number.isNaN(rawLimit) || rawLimit < 1 ? 48 : Math.min(rawLimit, 100);

        if (!category) {
            return NextResponse.json({ error: 'Category is required' }, { status: 400 });
        }

        const { data, error, count } = await supabase
            .from('tools')
            .select(CARD_COLUMNS, { count: 'exact' })
            .in('status', ['published', 'approved'])
            .contains('category_name', [category])
            .order('save_count', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Error fetching tools by category:', error);
            return NextResponse.json({ error: 'Failed to fetch tools' }, { status: 500 });
        }

        // Supabase returns partial rows matching CARD_COLUMNS; cast is safe
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tools = (data || []).map((tool: any) => dbToolToCardTool(tool));

        return NextResponse.json({ tools, count: count ?? tools.length });
    } catch (err) {
        console.error('API error:', err);
        return NextResponse.json({ error: 'Failed to fetch tools' }, { status: 500 });
    }
}
