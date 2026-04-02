import { NextRequest, NextResponse } from 'next/server';
// SECURITY: Use anonymous client (not admin) to let RLS act as safety net
import { supabase } from '@/lib/supabase';
import { toFullUrl, toArray } from '@/lib/url';

// Public fields for single tool detail - excludes sensitive internal data
const PUBLIC_DETAIL_FIELDS = `
    id, name, app_username, logo_url, summary, description,
    category_name, task_name, tags,
    pricing, pricing_label, save_count, is_featured,
    website_url, play_store_url, app_store_url, social_links,
    images, videos, core_features, use_cases, pros, cons, faq,
    pricing_tiers, has_free_trial, free_trial_days, discount, billing_frequency,
    launched_on, created_at, updated_at
`;

// Map DB row directly to public detail fields (skips full dbToolToAdminTool)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toPublicDetailTool(row: any) {
    return {
        id: row.id,
        name: row.name,
        appUsername: row.app_username,
        logoUrl: toFullUrl(row.logo_url) ?? null,
        summary: row.summary,
        description: row.description,
        categoryName: toArray(row.category_name),
        taskName: toArray(row.task_name),
        tags: toArray(row.tags),
        pricing: row.pricing,
        pricingLabel: row.pricing_label,
        saveCount: row.save_count ?? 0,
        isFeatured: row.is_featured ?? false,
        websiteUrl: row.website_url,
        playStoreUrl: row.play_store_url,
        appStoreUrl: row.app_store_url,
        socialLinks: row.social_links,
        images: row.images,
        videos: row.videos,
        coreFeatures: row.core_features,
        useCases: row.use_cases,
        pros: row.pros,
        cons: row.cons,
        faq: row.faq,
        pricingTiers: row.pricing_tiers,
        hasFreeTrial: !!row.has_free_trial,
        freeTrialDays: row.free_trial_days,
        discount: row.discount,
        billingFrequency: row.billing_frequency,
        launchedOn: row.launched_on,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

// GET /api/public/tools/[id] - Get single published tool (NO AUTH REQUIRED)
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { data, error } = await supabase
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
        const response = NextResponse.json(toPublicDetailTool(data));
        response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
        return response;
    } catch (err) {
        console.error('Public tool error:', err);
        return NextResponse.json({ error: 'Failed to fetch tool' }, { status: 500 });
    }
}

