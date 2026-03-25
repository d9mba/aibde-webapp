import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin, isAuthError } from '@/lib/auth-utils';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(): Promise<NextResponse> {
    const authResult = await requireAdmin();
    if (isAuthError(authResult)) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    // Get pagination parameters
    const limit = Math.min(parseInt(new URL('http://t').searchParams.get('limit') || '20', 10), 100);
    const offset = Math.max(parseInt(new URL('http://t').searchParams.get('offset') || '0', 10), 0);

    const { data, error, count } = await supabaseAdmin
        .from('tool_submissions')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, total: count, limit, offset });
}

export async function PATCH(request: Request): Promise<NextResponse> {
    try {
        const authResult = await requireAdmin();
        if (isAuthError(authResult)) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const body = await request.json();
        const { id, review_status } = body;

        if (!id || !review_status) {
            return NextResponse.json({ error: 'Missing id or review_status' }, { status: 400 });
        }

        // Validate UUID format
        if (!UUID_REGEX.test(id)) {
            return NextResponse.json({ error: 'Invalid id format. Must be a valid UUID.' }, { status: 400 });
        }

        const validStatuses = ['pending', 'approved', 'rejected', 'published'];
        if (!validStatuses.includes(review_status)) {
            return NextResponse.json({ error: 'Invalid review status' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('tool_submissions')
            .update({ review_status })
            .eq('id', id)
            .select()
            .maybeSingle();

        if (error) {
            console.error('[Update Submission] Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!data) {
            return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
        }

        return NextResponse.json({ data });
    } catch (err: any) {
        console.error('[Update Submission] Error:', err);
        return NextResponse.json({ error: err.message || 'Failed to update status' }, { status: 500 });
    }
}
