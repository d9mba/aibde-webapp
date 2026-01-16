import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, dbToolToAdminTool } from '@/lib/supabase';

// Fields for search results - minimal for fast response
const SEARCH_FIELDS = `
    id, name, app_username, logo_url, summary,
    category_name, task_name, pricing, status
`;

// GET /api/tools/search - Search tools (public endpoint for header search)
// Supports: ?q=query&limit=10&status=published
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q') || '';
        const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
        const status = searchParams.get('status') || 'published'; // Default to published for public search

        if (!query || query.length < 2) {
            return NextResponse.json([]);
        }

        // Use Supabase text search with ilike for flexibility
        const { data, error } = await supabaseAdmin
            .from('tools')
            .select(SEARCH_FIELDS)
            .eq('status', status)
            .or(`name.ilike.%${query}%,summary.ilike.%${query}%,app_username.ilike.%${query}%`)
            .order('save_count', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Search error:', error);
            return NextResponse.json({ error: 'Search failed' }, { status: 500 });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tools = (data || []).map((tool: any) => dbToolToAdminTool(tool));

        // Cache search results briefly (30 seconds)
        const response = NextResponse.json(tools);
        response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
        return response;
    } catch (err) {
        console.error('Search error:', err);
        return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }
}
