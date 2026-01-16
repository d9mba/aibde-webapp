import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { dbToolToAdminTool, adminToolToDbTool } from '@/lib/supabase';
import { toolUpdateSchema } from '@/lib/validations';
import { requireAdmin, isAuthError } from '@/lib/auth-utils';

// GET /api/admin/tools/[id] - Get single tool (admin)
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await requireAdmin();
        if (isAuthError(authResult)) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { id } = await params;
        const supabase = await createAdminClient();

        const { data, error } = await supabase
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
        if (isAuthError(authResult)) {
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

        const supabase = await createAdminClient();
        const { data, error } = await supabase
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
        if (isAuthError(authResult)) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { id } = await params;
        const supabase = await createAdminClient();

        const { error } = await supabase
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
