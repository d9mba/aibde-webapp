import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(): Promise<NextResponse> {
    const { data: payments, error: paymentsError } = await supabaseAdmin
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

    if (paymentsError) {
        return NextResponse.json({ error: paymentsError.message }, { status: 500 });
    }

    // Get unique submission IDs to fetch submission_refs
    const submissionIds = [...new Set((payments || []).map(p => p.submission_id).filter(Boolean))];

    let refMap: Record<string, string> = {};
    if (submissionIds.length > 0) {
        const { data: submissions } = await supabaseAdmin
            .from('tool_submissions')
            .select('id, submission_ref')
            .in('id', submissionIds);

        if (submissions) {
            for (const s of submissions) {
                if (s.submission_ref) refMap[s.id] = s.submission_ref;
            }
        }
    }

    // Attach submission_ref to each payment row
    const enriched = (payments || []).map(p => ({
        ...p,
        submission_ref: refMap[p.submission_id] || null,
    }));

    return NextResponse.json({ data: enriched });
}
