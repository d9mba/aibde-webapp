import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin, isAuthError } from '@/lib/auth-utils';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
    const authResult = await requireAdmin();
    if (isAuthError(authResult)) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { id } = await context.params;
    if (!id) {
        return NextResponse.json({ error: 'Missing submission ID' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
        .from('tool_submissions')
        .select('*')
        .eq('id', id)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('[Get Submission API] Database error:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!data) {
        return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    return NextResponse.json({ data });
}
