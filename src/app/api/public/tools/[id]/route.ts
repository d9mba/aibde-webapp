import { NextRequest, NextResponse } from 'next/server';
// SECURITY: Use anonymous client (not admin) to let RLS act as safety net
import { supabase, dbToolToAdminTool } from '@/lib/supabase';

// Public fields for single tool detail - excludes sensitive internal data
const PUBLIC_DETAIL_FIELDS = `
    id, name, app_username, logo_url, summary, description,
    category_name, task_name, tags,
    pricing, pricing_label, save_count, is_featured,
    website_url, play_store_url, app_store_url, social_links,
    images, videos, core_features, use_cases, pros, cons, faq,
    pricing_tiers, has_free_trial, free_trial_days, discount, billing_frequency,
    launched_on, status, created_at, updated_at
`;

// Strip response to only public-safe detail fields
function toPublicDetailTool(tool: ReturnType<typeof dbToolToAdminTool>) {
    return {
        id: tool.id,
        name: tool.name,
        appUsername: tool.appUsername,
        logoUrl: tool.logoUrl,
        summary: tool.summary,
        description: tool.description,
        categoryName: tool.categoryName,
        taskName: tool.taskName,
        tags: tool.tags,
        pricing: tool.pricing,
        pricingLabel: tool.pricingLabel,
        saveCount: tool.saveCount,
        isFeatured: tool.isFeatured,
        websiteUrl: tool.websiteUrl,
        playStoreUrl: tool.playStoreUrl,
        appStoreUrl: tool.appStoreUrl,
        socialLinks: tool.socialLinks,
        images: tool.images,
        videos: tool.videos,
        coreFeatures: tool.coreFeatures,
        useCases: tool.useCases,
        pros: tool.pros,
        cons: tool.cons,
        faq: tool.faq,
        pricingTiers: tool.pricingTiers,
        hasFreeTrial: tool.hasFreeTrial,
        freeTrialDays: tool.freeTrialDays,
        discount: tool.discount,
        billingFrequency: tool.billingFrequency,
        launchedOn: tool.launchedOn,
        status: tool.status,
        createdAt: tool.createdAt,
        updatedAt: tool.updatedAt,
    };
}

// GET /api/public/tools/[id] - Get single published tool (NO AUTH REQUIRED)
export async function GET(
    request: NextRequest,
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
        const response = NextResponse.json(toPublicDetailTool(dbToolToAdminTool(data)));
        response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
        return response;
    } catch (err) {
        console.error('Public tool error:', err);
        return NextResponse.json({ error: 'Failed to fetch tool' }, { status: 500 });
    }
}

