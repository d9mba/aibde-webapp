import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin, dbToolToAdminTool, adminToolToDbTool } from '@/lib/supabase';
import { toolSchema } from '@/lib/validations';

// All fields for tools - needed for edit form to work correctly
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

// GET /api/tools - List tools (PROTECTED)
// Requires authentication - use /api/public/tools for public access
export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();

        // SECURITY: Require authentication
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        let query = supabaseAdmin
            .from('tools')
            .select(ALL_FIELDS)
            .order('created_at', { ascending: false });

        // Authenticated users can filter by status
        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Map to frontend-friendly format using the central mapping function
        const tools = (data || []).map((tool) => dbToolToAdminTool(tool));

        return NextResponse.json(tools);
    } catch (err) {
        return NextResponse.json({ error: 'Failed to fetch tools' }, { status: 500 });
    }
}

// POST /api/tools - Create new tool (protected)
export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

