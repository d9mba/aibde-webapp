import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin, dbToolToAdminTool, adminToolToDbTool, DbTool } from '@/lib/supabase';
import { toolSchema } from '@/lib/validations';
import { requireAdmin, isAuthError } from '@/lib/auth-utils';
import { escapeLike } from '@/lib/utils';
import { syncToolCounts } from '@/lib/sync-counts';

// All fields for tools - needed for edit form to work correctly
// WARNING: Contains sensitive fields - use only for single-tool detail view
const ALL_FIELDS = `
    id, name, app_username, summary, description,
    category_name, task_name, tags,
    pricing, pricing_label, logo_url,
    website_url, affiliate_url, affiliate_enabled,
    save_count, view_count, upvotes, downvotes, rating,
    is_featured, launched_on, listing_type,
    status, images, videos, spotlight_position, spotlight_enabled,
    created_at, updated_at,
    play_store_url, app_store_url, social_links,
    core_features, use_cases, pros, cons, faq,
    pricing_tiers, has_free_trial, free_trial_days, discount, billing_frequency,
    version_history, alternative_tools, tool_references,
    contact_name, contact_email, contact_company, contact_address, contact_mobile,
    internal_notes, scheduled_at, spotlight_start_date, spotlight_end_date,
    back_links, trending_position
`;

// Fields for dashboard table view - includes all data for preview modal
const TABLE_FIELDS = `
    id, name, app_username, logo_url, summary, description,
    category_name, task_name, tags,
    pricing, pricing_label, save_count, view_count, upvotes, downvotes, rating,
    is_featured, status, spotlight_enabled, spotlight_position, trending_position,
    website_url, affiliate_url, affiliate_enabled,
    core_features, use_cases, pros, cons, faq,
    images, videos, play_store_url, app_store_url, social_links,
    pricing_tiers, has_free_trial, free_trial_days, discount, billing_frequency,
    contact_name, contact_email, contact_company, contact_address, contact_mobile,
    back_links, created_at, updated_at, launched_on, listing_type
`;

// Complete fields for edit form (fetched via GET /api/tools/[id])
// Includes all fields needed for ToolForm to work
const LIST_FIELDS = `
    id, name, app_username, summary, description,
    category_name, task_name, tags,
    pricing, pricing_label, logo_url,
    website_url, affiliate_url, affiliate_enabled,
    save_count, view_count, upvotes, downvotes, rating,
    is_featured, launched_on, listing_type,
    status, images, videos, spotlight_position, spotlight_enabled,
    play_store_url, app_store_url, social_links,
    core_features, use_cases, pros, cons, faq,
    pricing_tiers, has_free_trial, free_trial_days, discount, billing_frequency,
    version_history, alternative_tools, tool_references,
    contact_name, contact_email, contact_company, contact_address, contact_mobile,
    internal_notes, scheduled_at,
    created_at, updated_at,
    spotlight_start_date, spotlight_end_date,
    back_links, trending_position
`;

// Helper function to apply missing data filters
// Using simple .is(null) checks since complex OR queries cause 500 errors
function applyMissingDataFilter(query: any, filter: string) {
    switch (filter) {
        case 'no-logo':
            return query.is('logo_url', null);
        case 'no-summary':
            return query.is('summary', null);
        case 'no-description':
            return query.is('description', null);
        case 'no-website':
            return query.is('website_url', null);
        case 'no-contact':
            return query.is('contact_email', null).is('contact_mobile', null).is('contact_name', null);
        case 'no-category':
            return query.is('category_name', null);
        case 'no-task':
            return query.is('task_name', null);
        case 'no-tags':
            return query.is('tags', null);
        case 'no-features':
            return query.is('core_features', null);
        case 'no-use-cases':
            return query.is('use_cases', null);
        case 'no-faq':
            return query.is('faq', null);
        case 'no-pricing-tiers':
            return query.is('pricing_tiers', null);
        case 'no-images':
            return query.is('images', null);
        case 'no-videos':
            return query.is('videos', null);
        case 'no-release-date':
            return query.is('launched_on', null);
        default:
            return query;
    }
}

// Helper to apply all common filters
function applyFilters(query: any, filters: { search?: string | null, category?: string | null, task?: string | null, tag?: string | null, missingData?: string | null, status?: string | null }) {
    if (filters.status) {
        query = query.eq('status', filters.status);
    }
    if (filters.search) {
        query = query.ilike('name', `%${escapeLike(filters.search)}%`);
    }
    if (filters.category && filters.category !== 'all') {
        query = query.contains('category_name', [filters.category]);
    }
    if (filters.task && filters.task !== 'all') {
        query = query.contains('task_name', [filters.task]);
    }
    if (filters.tag && filters.tag !== 'all') {
        query = query.contains('tags', [filters.tag]);
    }
    if (filters.missingData && filters.missingData !== 'all') {
        query = applyMissingDataFilter(query, filters.missingData);
    }
    return query;
}


// GET /api/tools - List tools (ADMIN ONLY)
// Requires admin role - use /api/public/tools for public access
// Supports pagination: ?page=1&limit=50 (default: 50 per page)
// Use ?all=true to fetch all tools (for export/backup)
export async function GET(request: NextRequest) {
    try {
        const authResult = await requireAdmin();
        if (isAuthError(authResult)) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const allData = searchParams.get('all') === 'true';
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '50', 10);

        // Validate pagination params
        const validPage = Math.max(1, page);
        const validLimit = Math.min(5000, Math.max(1, limit)); // Max 5000 for bulk operations
        const offset = (validPage - 1) * validLimit;

        const search = searchParams.get('search')?.trim();
        const category = searchParams.get('category');
        const task = searchParams.get('task');
        const tag = searchParams.get('tag');
        const missingData = searchParams.get('missing');

        // Get total count for pagination with ALL filters applied
        let countQuery = supabaseAdmin
            .from('tools')
            .select('*', { count: 'exact', head: true });

        // Apply all filters to count query (must match data query filters)
        countQuery = applyFilters(countQuery, { search, category, task, tag, missingData, status });

        const countResult = await countQuery;
        const totalCount = countResult.count || 0;

        // Fetch data with proper typing
        let data: DbTool[] | null = null;
        let error: any = null;


        if (allData) {
            // Fetch all tools using pagination (Supabase has max ~1000 per query)
            // OPTIMIZATION: Only select essential fields for dropdown/export
            const PAGE_SIZE = 1000;
            let allTools: any[] = [];
            let pageNum = 0;
            let hasMore = true;

            while (hasMore) {
                let query = supabaseAdmin
                    .from('tools')
                    .select(LIST_FIELDS) // Use LIST_FIELDS for complete data needed by edit form
                    .order('created_at', { ascending: false })
                    .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

                query = applyFilters(query, { search, category, task, tag, missingData, status });

                const { data: pageData, error: pageError } = await query;

                if (pageError) {
                    error = pageError;
                    break;
                }

                if (pageData && pageData.length > 0) {
                    allTools = [...allTools, ...pageData];
                    hasMore = pageData.length === PAGE_SIZE;
                    pageNum++;
                } else {
                    hasMore = false;
                }
            }

            data = allTools;
            error = error || null;
        } else {
            // Paginated query with all filters
            // OPTIMIZATION: Use TABLE_FIELDS for list view (no heavy HTML content)
            let query = supabaseAdmin
                .from('tools')
                .select(TABLE_FIELDS)
                .order('created_at', { ascending: false });

            query = applyFilters(query, { search, category, task, tag, missingData, status });

            const result = await query.range(offset, offset + validLimit - 1);
            data = result.data;
            error = result.error;
        }

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Map to frontend-friendly format
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tools = (data || []).map((tool: any) => dbToolToAdminTool(tool));

        // Return paginated response
        if (allData) {
            return NextResponse.json(tools);
        }

        return NextResponse.json({
            data: tools,
            pagination: {
                page: validPage,
                limit: validLimit,
                total: totalCount,
                totalPages: Math.ceil(totalCount / validLimit),
            }
        });
    } catch (err) {
        console.error('API Error:', err);
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to fetch tools' }, { status: 500 });
    }
}

// POST /api/tools - Create new tool (ADMIN ONLY)
export async function POST(request: NextRequest) {
    try {
        // Check admin role
        const authResult = await requireAdmin();
        if (isAuthError(authResult)) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const body = await request.json();

        // Validate input with Zod schema
        const parseResult = toolSchema.safeParse(body);
        if (!parseResult.success) {
            return NextResponse.json(
                {
                    error: 'Validation failed',
                    details: parseResult.error.flatten()
                },
                { status: 400 }
            );
        }

        const dbTool = adminToolToDbTool(body);

        // Set timestamps
        dbTool.created_at = new Date().toISOString();
        dbTool.updated_at = new Date().toISOString();

        const { data, error } = await supabaseAdmin
            .from('tools')
            .insert([dbTool])
            .select()
            .single();

        if (error) {
            // Check for unique constraint violation (duplicate)
            if (error.code === '23505') {
                return NextResponse.json({ error: 'Tool already exists with this username' }, { status: 409 });
            }
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Bust ISR cache so new tool appears instantly
        revalidatePath('/');
        revalidatePath('/new');
        revalidatePath('/trending');

        // Sync category/task counts in the background
        const categories = Array.isArray(body.categoryName) ? body.categoryName : [];
        const tasks = Array.isArray(body.taskName) ? body.taskName : [];
        void syncToolCounts(categories, tasks).catch(err => console.error('[Tools] syncToolCounts failed:', err));

        return NextResponse.json(dbToolToAdminTool(data), { status: 201 });
    } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to create tool' }, { status: 500 });
    }
}

