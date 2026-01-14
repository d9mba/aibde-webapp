import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, dbToolToAdminTool } from '@/lib/supabase';

// Light fields for public list views - excludes sensitive/heavy data
const PUBLIC_LIST_FIELDS = `
    id, name, app_username, logo_url, summary,
    category_name, task_name, tags,
    pricing, pricing_label, save_count, is_featured,
    status, created_at, updated_at
`;

// GET /api/public/tools - Public tool listing (NO AUTH REQUIRED)
// Returns only published tools with limited fields for public consumption
export async function GET(request: NextRequest) {
    try {
        // NOTE: This is intentionally public - no auth required
        // For protected tool management, use /api/tools instead

        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const task = searchParams.get('task');
        // SECURITY: Enforce max limit to prevent abuse
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
        const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);

        let query = supabaseAdmin
            .from('tools')
            .select(PUBLIC_LIST_FIELDS)
            .eq('status', 'published') // Only published tools
            .order('is_featured', { ascending: false }) // Featured first
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        // Optional filters
        if (category) {
            query = query.contains('category_name', [category]);
        }
        if (task) {
            query = query.contains('task_name', [task]);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Public tools fetch error:', error);
            return NextResponse.json({ error: 'Failed to fetch tools' }, { status: 500 });
        }

        const tools = (data || []).map((tool) => dbToolToAdminTool(tool));

        // PERFORMANCE: Cache public responses to reduce DB hits
        // 5 min cache, allow stale for 1 hour while revalidating
        const response = NextResponse.json(tools);
        response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
        return response;
    } catch (err) {
        console.error('Public tools error:', err);
        return NextResponse.json({ error: 'Failed to fetch tools' }, { status: 500 });
    }
}
