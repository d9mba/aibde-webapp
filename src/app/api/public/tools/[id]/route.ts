import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, dbToolToAdminTool } from '@/lib/supabase';

// Public fields for single tool detail - excludes sensitive internal data
const PUBLIC_DETAIL_FIELDS = `
    id, name, app_username, logo_url, summary, description,
    category_name, task_name, tags,
    pricing, pricing_label, save_count, is_featured,
    website_url, play_store_url, app_store_url, social_links,
    images, videos, core_features, use_cases, pros, cons, faq,
    pricing_tiers, has_free_trial, free_trial_days, discount, billing_frequency,
    released_at, status, created_at, updated_at
`;

// GET /api/public/tools/[id] - Get single published tool (NO AUTH REQUIRED)
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { data, error } = await supabaseAdmin
            .from('tools')
            .select(PUBLIC_DETAIL_FIELDS)
            .eq('id', id)
            .eq('status', 'published') // Only published tools
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
            }
            console.error('Public tool fetch error:', error);
            return NextResponse.json({ error: 'Failed to fetch tool' }, { status: 500 });
        }

        // PERFORMANCE: Cache public responses
        const response = NextResponse.json(dbToolToAdminTool(data));
        response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
        return response;
    } catch (err) {
        console.error('Public tool error:', err);
        return NextResponse.json({ error: 'Failed to fetch tool' }, { status: 500 });
    }
}

