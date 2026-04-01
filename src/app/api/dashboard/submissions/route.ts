import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin, isAuthError } from '@/lib/auth-utils';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 25;

export async function GET(request: NextRequest): Promise<NextResponse> {
    const authResult = await requireAdmin();
    if (isAuthError(authResult)) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(request.url);

    // Pagination
    const rawPage = parseInt(searchParams.get('page') || '1', 10);
    const rawLimit = parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10);
    const page = Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1;
    const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(rawLimit, MAX_LIMIT)) : DEFAULT_LIMIT;
    const offset = (page - 1) * limit;

    // Server-side filters
    const search = searchParams.get('search')?.trim() || '';
    const paymentStatus = searchParams.get('payment_status') || '';
    const reviewStatus = searchParams.get('review_status') || '';

    // Build query — count first for pagination metadata
    let countQuery = supabaseAdmin
        .from('tool_submissions')
        .select('*', { count: 'exact', head: true });

    let dataQuery = supabaseAdmin
        .from('tool_submissions')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    // Apply filters to both queries
    if (paymentStatus && paymentStatus !== 'all') {
        countQuery = countQuery.eq('payment_status', paymentStatus);
        dataQuery = dataQuery.eq('payment_status', paymentStatus);
    }
    if (reviewStatus && reviewStatus !== 'all') {
        countQuery = countQuery.eq('review_status', reviewStatus);
        dataQuery = dataQuery.eq('review_status', reviewStatus);
    }
    if (search) {
        // Search across tool_name, submitter_name, submitter_email, submission_ref
        const searchFilter = `tool_name.ilike.%${search}%,submitter_name.ilike.%${search}%,submitter_email.ilike.%${search}%,submission_ref.ilike.%${search}%`;
        countQuery = countQuery.or(searchFilter);
        dataQuery = dataQuery.or(searchFilter);
    }

    const { count: totalCount, error: countError } = await countQuery;
    if (countError) {
        console.error('[Dashboard Submissions] Count query failed:', countError);
        return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
    }

    const { data, error } = await dataQuery;
    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
        data,
        pagination: {
            page,
            limit,
            total: totalCount || 0,
            totalPages: Math.ceil((totalCount || 0) / limit),
        },
    });
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

        const validStatuses = ['pending', 'draft', 'published', 'unpublished', 'scheduled'];
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
