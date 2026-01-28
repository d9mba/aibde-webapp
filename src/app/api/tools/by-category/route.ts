import { NextRequest, NextResponse } from 'next/server';
import { supabase, dbToolToAdminTool } from '@/lib/supabase';

/**
 * GET /api/tools/by-category - Paginated tools by category
 * Query params: category (required), offset, limit
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const offset = parseInt(searchParams.get('offset') || '0');
        const limit = parseInt(searchParams.get('limit') || '50');

        if (!category) {
            return NextResponse.json({ error: 'Category is required' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('tools')
            .select('*')
            .in('status', ['published', 'approved'])
            .contains('category_name', [category])
            .order('save_count', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Error fetching tools by category:', error);
            return NextResponse.json({ error: 'Failed to fetch tools' }, { status: 500 });
        }

        const tools = (data || []).map(tool => dbToolToAdminTool(tool));

        return NextResponse.json({ tools, count: tools.length });
    } catch (err) {
        console.error('API error:', err);
        return NextResponse.json({ error: 'Failed to fetch tools' }, { status: 500 });
    }
}
