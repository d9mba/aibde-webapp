import { NextRequest, NextResponse } from 'next/server';
// SECURITY: Use anonymous client (not admin) to let RLS act as safety net
import { supabase, dbToolToAdminTool } from '@/lib/supabase';

// PERFORMANCE: Edge runtime for faster cold starts
export const runtime = 'edge';

// Light fields for public list views - excludes sensitive/heavy data
const PUBLIC_LIST_FIELDS = `
    id, name, app_username, logo_url, summary,
    category_name, task_name, tags,
    pricing, pricing_label, save_count, is_featured, listing_type,
    status, created_at, updated_at
`;

// Strip response to only public-safe fields (dbToolToAdminTool maps ALL fields)
function toPublicTool(tool: ReturnType<typeof dbToolToAdminTool>) {
    return {
        id: tool.id,
        name: tool.name,
        app_username: tool.app_username,
        logoUrl: tool.logoUrl,
        summary: tool.summary,
        categoryName: tool.categoryName,
        taskName: tool.taskName,
        tags: tool.tags,
        pricing: tool.pricing,
        pricingLabel: tool.pricingLabel,
        saveCount: tool.saveCount,
        isFeatured: tool.isFeatured,
        listingType: tool.listingType,
        status: tool.status,
        createdAt: tool.createdAt,
        updatedAt: tool.updatedAt,
    };
}

// GET /api/public/tools - Public tool listing (NO AUTH REQUIRED)
// Returns only published tools with limited fields for public consumption
// Supports pagination: ?page=1&limit=20 (default: 20 per page, max 50)
export async function GET(request: NextRequest) {
    try {
        // NOTE: This is intentionally public - no auth required
        // For protected tool management, use /api/tools instead

        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const task = searchParams.get('task');
        const allData = searchParams.get('all') === 'true';

        // SECURITY: Enforce max limit to prevent abuse
        const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
        const offset = (page - 1) * limit;

        // Get total count for pagination
        let countQuery = supabase
            .from('tools')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'published');

        if (category) {
            countQuery = countQuery.contains('category_name', [category]);
        }
        if (task) {
            countQuery = countQuery.contains('task_name', [task]);
        }

        const { count: totalCount } = await countQuery;

        // Build main query
        let query = supabase
            .from('tools')
            .select(PUBLIC_LIST_FIELDS)
            .eq('status', 'published') // Only published tools
            .order('is_featured', { ascending: false }) // Featured first
            .order('created_at', { ascending: false });

        // Optional filters
        if (category) {
            query = query.contains('category_name', [category]);
        }
        if (task) {
            query = query.contains('task_name', [task]);
        }

        const PUBLIC_ALL_DATA_CAP = 2000;
        if (allData) {
            query = query.range(0, PUBLIC_ALL_DATA_CAP - 1);
        } else {
            query = query.range(offset, offset + limit - 1);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Public tools fetch error:', error);
            return NextResponse.json({ error: 'Failed to fetch tools' }, { status: 500 });
        }

        const tools = (data || []).map((tool) => toPublicTool(dbToolToAdminTool(tool)));

        // PERFORMANCE: Cache public responses to reduce DB hits
        // 5 min cache, allow stale for 1 hour while revalidating
        const response = allData
            ? NextResponse.json(tools)
            : NextResponse.json({
                data: tools,
                pagination: {
                    page,
                    limit,
                    total: totalCount || 0,
                    totalPages: Math.ceil((totalCount || 0) / limit),
                }
            });
        response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
        return response;
    } catch (err) {
        console.error('Public tools error:', err);
        return NextResponse.json({ error: 'Failed to fetch tools' }, { status: 500 });
    }
}
