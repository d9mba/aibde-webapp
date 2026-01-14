import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';
import { noteSchema } from '@/lib/validations';

// GET /api/notes - List all notes (PROTECTED - admin/internal only)
export async function GET() {
    try {
        // SECURITY: Notes are internal - require authentication
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data, error } = await supabaseAdmin
            .from('notes')
            .select('*')
            .order('updated_at', { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Convert snake_case to camelCase
        const notes = (data || []).map(note => ({
            id: note.id,
            title: note.title,
            content: note.content,
            toolId: note.tool_id,
            createdAt: note.created_at,
            updatedAt: note.updated_at,
        }));

        return NextResponse.json(notes);
    } catch (err) {
        return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
    }
}

// POST /api/notes - Create new note (protected)
export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        // Validate input
        const parseResult = noteSchema.safeParse(body);
        if (!parseResult.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: parseResult.error.flatten() },
                { status: 400 }
            );
        }

        const { data, error } = await supabaseAdmin
            .from('notes')
            .insert([{
                title: body.title,
                content: body.content || '',
                tool_id: body.toolId || null,
            }])
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Convert to camelCase
        const note = {
            id: data.id,
            title: data.title,
            content: data.content,
            toolId: data.tool_id,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
        };

        return NextResponse.json(note, { status: 201 });
    } catch (err) {
        return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
    }
}

// PUT /api/notes - Update note (protected)
export async function PUT(request: NextRequest) {
    try {
        // Check authentication
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { id, ...updates } = body;

        // Validate input
        const parseResult = noteSchema.partial().safeParse(updates);
        if (!parseResult.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: parseResult.error.flatten() },
                { status: 400 }
            );
        }

        // Convert camelCase to snake_case
        const dbUpdates: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        };
        if (updates.title !== undefined) dbUpdates.title = updates.title;
        if (updates.content !== undefined) dbUpdates.content = updates.content;
        if (updates.toolId !== undefined) dbUpdates.tool_id = updates.toolId || null;

        const { data, error } = await supabaseAdmin
            .from('notes')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Convert to camelCase
        const note = {
            id: data.id,
            title: data.title,
            content: data.content,
            toolId: data.tool_id,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
        };

        return NextResponse.json(note);
    } catch (err) {
        return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
    }
}

// DELETE /api/notes - Delete note (protected)
export async function DELETE(request: NextRequest) {
    try {
        // Check authentication
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID required' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('notes')
            .delete()
            .eq('id', id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
    }
}
