import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin, isAuthError } from '@/lib/auth-utils';

export async function GET(): Promise<NextResponse> {
    const authResult = await requireAdmin();
    if (isAuthError(authResult)) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { data: payments, error: paymentsError } = await supabaseAdmin
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

    if (paymentsError) {
        console.error('[Dashboard Payments] Failed to fetch payments', paymentsError);
        return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
    }

    // Get unique submission IDs to fetch submission_refs
    const submissionIds = [...new Set((payments || []).map(p => p.submission_id).filter(Boolean))];

    let refMap: Record<string, string> = {};
    if (submissionIds.length > 0) {
        const { data: submissions, error: submissionError } = await supabaseAdmin
            .from('tool_submissions')
            .select('id, submission_ref')
            .in('id', submissionIds);

        if (submissionError) {
            console.error('[Dashboard Payments] Failed to fetch submission refs', submissionError);
            return NextResponse.json({ error: 'Failed to fetch submission details' }, { status: 500 });
        }

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
