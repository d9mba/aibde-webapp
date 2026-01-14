import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';
import { settingsSchema } from '@/lib/validations';

// GET /api/settings - Get settings (PROTECTED)
export async function GET() {
    try {
        // SECURITY: Require authentication
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data, error } = await supabaseAdmin
            .from('settings')
            .select('*')
            .eq('id', 1)
            .single();

        if (error) {
            // Return defaults if settings don't exist
            return NextResponse.json({
                spotlightCount: 8,
                showSpotlightOnHome: true,
                showCategoriesOnHome: true,
                showTasksOnHome: true,
                showTop10OnHome: false,
                showFeaturedAlternatives: true,
            });
        }

        // Convert snake_case to camelCase
        return NextResponse.json({
            spotlightCount: data.spotlight_count,
            showSpotlightOnHome: data.show_spotlight_on_home,
            showCategoriesOnHome: data.show_categories_on_home,
            showTasksOnHome: data.show_tasks_on_home,
            showTop10OnHome: data.show_top10_on_home,
            showFeaturedAlternatives: data.show_featured_alternatives ?? true,
        });
    } catch (err) {
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

// PUT /api/settings - Update settings (protected)
export async function PUT(request: NextRequest) {
    try {
        // Check authentication
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        // Validate input
        const parseResult = settingsSchema.safeParse(body);
        if (!parseResult.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: parseResult.error.flatten() },
                { status: 400 }
            );
        }

        // Convert camelCase to snake_case
        const dbSettings: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        };

        if (body.spotlightCount !== undefined) dbSettings.spotlight_count = body.spotlightCount;
        if (body.showSpotlightOnHome !== undefined) dbSettings.show_spotlight_on_home = body.showSpotlightOnHome;
        if (body.showCategoriesOnHome !== undefined) dbSettings.show_categories_on_home = body.showCategoriesOnHome;
        if (body.showTasksOnHome !== undefined) dbSettings.show_tasks_on_home = body.showTasksOnHome;
        if (body.showTop10OnHome !== undefined) dbSettings.show_top10_on_home = body.showTop10OnHome;
        if (body.showFeaturedAlternatives !== undefined) dbSettings.show_featured_alternatives = body.showFeaturedAlternatives;

        const { data, error } = await supabaseAdmin
            .from('settings')
            .upsert([{ id: 1, ...dbSettings }])
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            spotlightCount: data.spotlight_count,
            showSpotlightOnHome: data.show_spotlight_on_home,
            showCategoriesOnHome: data.show_categories_on_home,
            showTasksOnHome: data.show_tasks_on_home,
            showTop10OnHome: data.show_top10_on_home,
            showFeaturedAlternatives: data.show_featured_alternatives ?? true,
        });
    } catch (err) {
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
