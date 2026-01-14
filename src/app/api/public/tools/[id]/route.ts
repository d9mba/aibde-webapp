import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin, dbToolToAdminTool } from '@/lib/supabase';

// GET /api/public/tools/[id] - Get single published tool (PROTECTED)
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // SECURITY: Require authentication
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const { data, error } = await supabaseAdmin
            .from('tools')
            .select('*')
            .eq('id', id)
            .eq('status', 'published') // Only published tools
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
            }
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(dbToolToAdminTool(data));
    } catch (err) {
        return NextResponse.json({ error: 'Failed to fetch tool' }, { status: 500 });
    }
}

