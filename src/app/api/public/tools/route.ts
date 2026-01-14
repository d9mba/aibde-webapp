import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin, dbToolToAdminTool } from '@/lib/supabase';

// GET /api/public/tools - Tool listing (PROTECTED)
// Requires authentication - returns only published tools
export async function GET(request: NextRequest) {
    try {
        // SECURITY: Require authentication
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const task = searchParams.get('task');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        let query = supabaseAdmin
            .from('tools')
            .select('*')
            .eq('status', 'published') // Only published tools
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
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const tools = (data || []).map((tool) => dbToolToAdminTool(tool));

        return NextResponse.json(tools);
    } catch (err) {
        return NextResponse.json({ error: 'Failed to fetch tools' }, { status: 500 });
    }
}
