import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, dbToolToAdminTool, adminToolToDbTool } from '@/lib/supabase';
import { toolSchema } from '@/lib/validations';
import { requireAdmin, isAuthError } from '@/lib/auth-utils';

// All fields for tools - needed for edit form to work correctly
// WARNING: Contains sensitive fields - use only for single-tool detail view
const ALL_FIELDS = `
    id, name, app_username, summary, description,
    category_name, task_name, tags,
    pricing, pricing_label, logo_url,
    website_url, affiliate_url, affiliate_enabled,
    save_count, is_featured, released_at,
    status, images, videos, spotlight_position, spotlight_enabled,
    created_at, updated_at,
    play_store_url, app_store_url, social_links,
    core_features, use_cases, pros, cons, faq,
    pricing_tiers, has_free_trial, free_trial_days, discount, billing_frequency,
    version_history, alternative_tools, tool_references,
    contact_name, contact_email, contact_company, contact_address, contact_mobile,
    internal_notes, scheduled_at, spotlight_start_date, spotlight_end_date
`;

// Complete fields for admin tool list and edit form
// Includes all fields needed for ToolForm to work
const LIST_FIELDS = `
    id, name, app_username, summary, description,
    category_name, task_name, tags,
    pricing, pricing_label, logo_url,
    website_url, affiliate_url, affiliate_enabled,
    save_count, is_featured, released_at,
    status, images, videos, spotlight_position, spotlight_enabled,
    play_store_url, app_store_url, social_links,
    core_features, use_cases, pros, cons, faq,
    pricing_tiers, has_free_trial, free_trial_days, discount, billing_frequency,
    version_history, alternative_tools, tool_references,
    contact_name, contact_email, contact_company, contact_address, contact_mobile,
    internal_notes, scheduled_at,
    created_at, updated_at,
    spotlight_start_date, spotlight_end_date
`;

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
        const validLimit = Math.min(100, Math.max(1, limit)); // Max 100 per page
        const offset = (validPage - 1) * validLimit;

        const search = searchParams.get('search')?.trim();

        // Get total count for pagination (respecting status and search filters)
        let countQuery = supabaseAdmin
            .from('tools')
            .select('id', { count: 'exact', head: true });

        if (status) {
            countQuery = countQuery.eq('status', status);
        }
        if (search) {
            countQuery = countQuery.ilike('name', `%${search}%`);
        }

        const countResult = await countQuery;
        const totalCount = countResult.count || 0;

        // Fetch data - use separate queries to avoid TypeScript type issues
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let data: any[] | null = null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let error: any = null;


        if (allData) {
            // Fetch all tools using pagination (Supabase has max ~1000 per query)
            const PAGE_SIZE = 1000;
            let allTools: any[] = [];
            let pageNum = 0;
            let hasMore = true;

            while (hasMore) {
                let query = supabaseAdmin
                    .from('tools')
                    .select(ALL_FIELDS)
                    .order('created_at', { ascending: false })
                    .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

                if (search) {
                    query = query.ilike('name', `%${search}%`);
                }

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
        } else if (status) {
            // Paginated with status filter
            let query = supabaseAdmin
                .from('tools')
                .select(LIST_FIELDS)
                .eq('status', status)
                .order('created_at', { ascending: false });

            if (search) {
                query = query.ilike('name', `%${search}%`);
            }

            const result = await query.range(offset, offset + validLimit - 1);
            data = result.data;
            error = result.error;
        } else {
            // Paginated without filter
            let query = supabaseAdmin
                .from('tools')
                .select(LIST_FIELDS)
                .order('created_at', { ascending: false });

            if (search) {
                query = query.ilike('name', `%${search}%`);
            }

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
        return NextResponse.json({ error: 'Failed to fetch tools' }, { status: 500 });
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

        return NextResponse.json(dbToolToAdminTool(data), { status: 201 });
    } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to create tool' }, { status: 500 });
    }
}

