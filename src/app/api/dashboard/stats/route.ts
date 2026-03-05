import { NextResponse } from 'next/server';
import { supabaseAdmin, dbToolToAdminTool } from '@/lib/supabase';
import { requireAdmin, isAuthError } from '@/lib/auth-utils';

// Lightweight fields for the "recently updated" and "recently published" lists
const RECENT_FIELDS = `id, name, app_username, logo_url, summary, category_name, status, save_count, is_featured, created_at, updated_at, launched_on`;

// GET /api/dashboard/stats — returns counts + recent tools in a single request
export async function GET() {
    try {
        const authResult = await requireAdmin();
        if (isAuthError(authResult)) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        // Run all queries in parallel for speed
        const [
            totalResult,
            publishedResult,
            draftResult,
            pendingResult,
            unpublishedResult,
            scheduledResult,
            spotlightResult,
            featuredResult,
            categoryResult,
            taskResult,
            tagResult,
            recentUpdatedResult,
            recentPublishedResult,
        ] = await Promise.all([
            // Tool counts by status
            supabaseAdmin.from('tools').select('*', { count: 'exact', head: true }),
            supabaseAdmin.from('tools').select('*', { count: 'exact', head: true }).eq('status', 'published'),
            supabaseAdmin.from('tools').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
            supabaseAdmin.from('tools').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            supabaseAdmin.from('tools').select('*', { count: 'exact', head: true }).eq('status', 'unpublished'),
            supabaseAdmin.from('tools').select('*', { count: 'exact', head: true }).eq('status', 'scheduled'),
            supabaseAdmin.from('tools').select('*', { count: 'exact', head: true }).eq('spotlight_enabled', true),
            supabaseAdmin.from('tools').select('*', { count: 'exact', head: true }).eq('is_featured', true),

            // Taxonomy counts
            supabaseAdmin.from('categories').select('*', { count: 'exact', head: true }),
            supabaseAdmin.from('tasks').select('*', { count: 'exact', head: true }),
            supabaseAdmin.from('tags').select('*', { count: 'exact', head: true }),

            // Recent tools (lightweight fields for dashboard lists)
            supabaseAdmin
                .from('tools')
                .select(RECENT_FIELDS)
                .order('updated_at', { ascending: false })
                .limit(8),
            supabaseAdmin
                .from('tools')
                .select(RECENT_FIELDS)
                .eq('status', 'published')
                .order('launched_on', { ascending: false })
                .limit(5),
        ]);

        // Log any Supabase query errors (counts fall back to 0 via ?? operator)
        const queryResults = [
            { name: 'total', result: totalResult },
            { name: 'published', result: publishedResult },
            { name: 'draft', result: draftResult },
            { name: 'pending', result: pendingResult },
            { name: 'unpublished', result: unpublishedResult },
            { name: 'scheduled', result: scheduledResult },
            { name: 'spotlight', result: spotlightResult },
            { name: 'featured', result: featuredResult },
            { name: 'categories', result: categoryResult },
            { name: 'tasks', result: taskResult },
            { name: 'tags', result: tagResult },
            { name: 'recentUpdated', result: recentUpdatedResult },
            { name: 'recentPublished', result: recentPublishedResult },
        ];
        for (const { name, result } of queryResults) {
            if (result.error) {
                console.error(`[Stats API] Query "${name}" failed:`, result.error.message);
            }
        }

        const recentUpdated = (recentUpdatedResult.data || []).map(dbToolToAdminTool);
        const recentPublished = (recentPublishedResult.data || []).map(dbToolToAdminTool);

        return NextResponse.json({
            counts: {
                total: totalResult.count ?? 0,
                published: publishedResult.count ?? 0,
                draft: draftResult.count ?? 0,
                pending: pendingResult.count ?? 0,
                unpublished: unpublishedResult.count ?? 0,
                scheduled: scheduledResult.count ?? 0,
                spotlight: spotlightResult.count ?? 0,
                featured: featuredResult.count ?? 0,
                categories: categoryResult.count ?? 0,
                tasks: taskResult.count ?? 0,
                tags: tagResult.count ?? 0,
            },
            recentUpdated,
            recentPublished,
        });
    } catch (err) {
        console.error('[Stats API] Error:', err);
        return NextResponse.json(
            { error: 'Failed to fetch dashboard stats' },
            { status: 500 }
        );
    }
}
