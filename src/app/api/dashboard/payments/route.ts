import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin, isAuthError } from '@/lib/auth-utils';

const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 50;
const BATCH_SIZE = 500;

export async function GET(request: NextRequest): Promise<NextResponse> {
    const authResult = await requireAdmin();
    if (isAuthError(authResult)) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    // PERF-02: Add pagination with safe defaults and caps
    const { searchParams } = new URL(request.url);
    const rawPage = parseInt(searchParams.get('page') || '1', 10);
    const rawLimit = parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10);
    const page = Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1;
    const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(rawLimit, MAX_LIMIT)) : DEFAULT_LIMIT;
    const offset = (page - 1) * limit;

    // Get total count for pagination metadata
    const { count: totalCount, error: countError } = await supabaseAdmin
        .from('payments')
        .select('*', { count: 'exact', head: true });

    if (countError) {
        console.error('[Dashboard Payments] Failed to count payments', countError);
        return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
    }

    const { data: payments, error: paymentsError } = await supabaseAdmin
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (paymentsError) {
        console.error('[Dashboard Payments] Failed to fetch payments', paymentsError);
        return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
    }

    // Get unique submission IDs to fetch submission_refs
    const submissionIds = [...new Set((payments || []).map(p => p.submission_id).filter(Boolean))];

    let refMap: Record<string, string> = {};

    // PERF-03: Chunk .in() queries to avoid PostgREST parameter limits
    if (submissionIds.length > 0) {
        const submissions: Array<{ id: string; submission_ref: string }> = [];

        for (let i = 0; i < submissionIds.length; i += BATCH_SIZE) {
            const batch = submissionIds.slice(i, i + BATCH_SIZE);
            const { data, error: submissionError } = await supabaseAdmin
                .from('tool_submissions')
                .select('id, submission_ref')
                .in('id', batch);

            if (submissionError) {
                console.error('[Dashboard Payments] Failed to fetch submission refs (batch)', submissionError);
                continue;
            }
            if (data) submissions.push(...data);
        }

        for (const s of submissions) {
            if (s.submission_ref) refMap[s.id] = s.submission_ref;
        }
    }

    // Attach submission_ref to each payment row
    const enriched = (payments || []).map(p => ({
        ...p,
        submission_ref: refMap[p.submission_id] || null,
    }));

    return NextResponse.json({
        data: enriched,
        pagination: {
            page,
            limit,
            total: totalCount || 0,
            totalPages: Math.ceil((totalCount || 0) / limit),
        },
    });
}
