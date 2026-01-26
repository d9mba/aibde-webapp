import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, dbToolToAdminTool, adminToolToDbTool } from '@/lib/supabase';
import { toolUpdateSchema } from '@/lib/validations';
import { requireAdmin, isAuthError } from '@/lib/auth-utils';
import { deleteFile, getPathFromUrl } from '@/services/storage.service';

// GET /api/tools/:id - Get single tool
// SECURITY: Only admins can view non-published (draft/pending) tools
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Check if user is Admin (but don't block request yet)
        const authResult = await requireAdmin();
        const isAdmin = !isAuthError(authResult);

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

        // SECURITY: If tool is NOT published, ONLY admin can view it
        // Return 404 to hide existence of draft tools from non-admins
        if (data?.status !== 'published' && !isAdmin) {
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
            console.error('[PUT API] Supabase update error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(dbToolToAdminTool(data));
    } catch (err) {
        console.error('[PUT API] Unexpected error:', err);
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

        // First, fetch the tool to get file URLs for R2 cleanup
        const { data: tool, error: fetchError } = await supabaseAdmin
            .from('tools')
            .select('logo_url, images')
            .eq('id', id)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('[DELETE] Error fetching tool for cleanup:', fetchError);
        }

        // Clean up R2 files if tool exists
        if (tool) {
            const filesToDelete: string[] = [];

            // Add logo URL
            if (tool.logo_url) {
                const path = getPathFromUrl(tool.logo_url);
                if (path) filesToDelete.push(path);
            }

            // Add image URLs (stored as JSON string or array)
            if (tool.images) {
                const images = typeof tool.images === 'string'
                    ? JSON.parse(tool.images)
                    : tool.images;
                if (Array.isArray(images)) {
                    for (const imageUrl of images) {
                        const path = getPathFromUrl(imageUrl);
                        if (path) filesToDelete.push(path);
                    }
                }
            }

            // Delete files from R2 (don't block on errors)
            for (const path of filesToDelete) {
                try {
                    await deleteFile(path);
                } catch (r2Error) {
                    console.error(`[DELETE] Failed to delete R2 file ${path}:`, r2Error);
                    // Continue with deletion even if R2 cleanup fails
                }
            }
        }

        // Delete from database
        const { error } = await supabaseAdmin
            .from('tools')
            .delete()
            .eq('id', id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('[DELETE] Unexpected error:', err);
        return NextResponse.json({ error: 'Failed to delete tool' }, { status: 500 });
    }
}
