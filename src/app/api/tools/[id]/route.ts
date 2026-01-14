import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin, dbToolToAdminTool, adminToolToDbTool } from '@/lib/supabase';
import { toolUpdateSchema } from '@/lib/validations';
import { requireAdmin, isAuthError } from '@/lib/auth-utils';

// GET /api/tools/:id - Get single tool
// SECURITY: Unauthenticated users can only view published tools
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();
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

        // SECURITY: Non-authenticated users can only view published tools
        if (!userId && data?.status !== 'published') {
            return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
        }

        return NextResponse.json(dbToolToAdminTool(data));
    } catch (err) {
        return NextResponse.json({ error: 'Failed to fetch tool' }, { status: 500 });
    }
}

// PUT /api/tools/:id - Update tool (ADMIN ONLY)
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // RBAC: Require admin role
        const authResult = await requireAdmin();
        if (isAuthError(authResult)) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { id } = await params;
        const body = await request.json();

        // Validate input with Zod schema (partial for updates)
        const parseResult = toolUpdateSchema.safeParse(body);
        if (!parseResult.success) {
            console.error('[API] Validation failed:', parseResult.error.flatten());
            return NextResponse.json(
                {
                    error: 'Validation failed',
                    details: parseResult.error.flatten()
                },
                { status: 400 }
            );
        }

        const dbTool = adminToolToDbTool(body);

        // Update timestamp
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

// DELETE /api/tools/:id - Delete tool (ADMIN ONLY)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // RBAC: Require admin role
        const authResult = await requireAdmin();
        if (isAuthError(authResult)) {
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
