import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { tagSchema } from '@/lib/validations';
import { requireAdmin, isAuthError } from '@/lib/auth-utils';

// GET /api/tags - List all tags (ADMIN ONLY)
export async function GET() {
    try {
        const authResult = await requireAdmin();
        if (isAuthError(authResult)) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { data, error } = await supabaseAdmin
            .from('tags')
            .select('*')
            .order('tag_name', { ascending: true });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Map database column names to frontend field names
        const mappedData = (data || []).map(row => ({
            id: row.id,
            tagName: row.tag_name,
            count: row.count,
        }));

        return NextResponse.json(mappedData);
    } catch (err) {
        return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
    }
}

// POST /api/tags - Create new tag (ADMIN ONLY)
export async function POST(request: NextRequest) {
    try {
        const authResult = await requireAdmin();
        if (isAuthError(authResult)) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const body = await request.json();

        // Validate input
        const parseResult = tagSchema.safeParse(body);
        if (!parseResult.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: parseResult.error.flatten() },
                { status: 400 }
            );
        }

        const { data, error } = await supabaseAdmin
            .from('tags')
            .insert([{
                tag_name: body.tagName,
                count: body.count || 0,
            }])
            .select()
            .single();

        if (error) {
            // Check for unique constraint violation (duplicate)
            if (error.code === '23505') {
                return NextResponse.json({ error: 'Tag already exists' }, { status: 409 });
            }
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data, { status: 201 });
    } catch (err) {
        return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 });
    }
}

// PUT /api/tags - Update tag (ADMIN ONLY)
export async function PUT(request: NextRequest) {
    try {
        const authResult = await requireAdmin();
        if (isAuthError(authResult)) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const body = await request.json();
        const { id, ...updates } = body;

        // Validate input
        const parseResult = tagSchema.partial().safeParse(updates);
        if (!parseResult.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: parseResult.error.flatten() },
                { status: 400 }
            );
        }

        // Map frontend field names to database column names
        const dbUpdates: Record<string, unknown> = {};
        if (updates.tagName !== undefined) dbUpdates.tag_name = updates.tagName;
        if (updates.count !== undefined) dbUpdates.count = updates.count;

        const { data, error } = await supabaseAdmin
            .from('tags')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (err) {
        return NextResponse.json({ error: 'Failed to update tag' }, { status: 500 });
    }
}

// DELETE /api/tags - Delete tag (ADMIN ONLY)
export async function DELETE(request: NextRequest) {
    try {
        const authResult = await requireAdmin();
        if (isAuthError(authResult)) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID required' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('tags')
            .delete()
            .eq('id', id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: 'Failed to delete tag' }, { status: 500 });
    }
}
