import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { dbToolToAdminTool, adminToolToDbTool } from '@/lib/supabase';
import { toolUpdateSchema } from '@/lib/validations';

// Admin auth check helper
async function requireAdmin() {
    const { userId } = await auth();
    if (!userId) {
        return { error: 'Unauthorized', status: 401, userId: null };
    }
    return { error: null, status: 200, userId };
}

// GET /api/admin/tools/[id] - Get single tool (admin)
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await requireAdmin();
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { id } = await params;

        const { data, error } = await supabaseAdmin
            .from('tools')
            .select('*')
            .eq('id', id)
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

// PUT /api/admin/tools/[id] - Update tool (admin)
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await requireAdmin();
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { id } = await params;
        const body = await request.json();

        // Validate input
        const parseResult = toolUpdateSchema.safeParse(body);
        if (!parseResult.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: parseResult.error.flatten() },
                { status: 400 }
            );
        }

        const dbTool = adminToolToDbTool(body);
        dbTool.updated_at = new Date().toISOString();

        const { data, error } = await supabaseAdmin
            .from('tools')
            .update(dbTool)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(dbToolToAdminTool(data));
    } catch (err) {
        return NextResponse.json({ error: 'Failed to update tool' }, { status: 500 });
    }
}

// DELETE /api/admin/tools/[id] - Delete tool (admin)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await requireAdmin();
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { id } = await params;

        const { error } = await supabaseAdmin
            .from('tools')
            .delete()
            .eq('id', id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: 'Failed to delete tool' }, { status: 500 });
    }
}
