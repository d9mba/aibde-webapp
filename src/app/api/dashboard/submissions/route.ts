import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(): Promise<NextResponse> {
    const { data, error } = await supabaseAdmin
        .from('tool_submissions')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
}

export async function PATCH(request: Request): Promise<NextResponse> {
    try {
        const body = await request.json();
        const { id, review_status } = body;

        if (!id || !review_status) {
            return NextResponse.json({ error: 'Missing id or review_status' }, { status: 400 });
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
            .single();

        if (error) throw error;

        return NextResponse.json({ data });
    } catch (err: any) {
        console.error('[Update Submission Status] Error:', err);
        return NextResponse.json({ error: err.message || 'Failed to update status' }, { status: 500 });
    }
}
