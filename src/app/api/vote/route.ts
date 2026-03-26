import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { checkRateLimit, rateLimits, getClientIp } from '@/lib/rate-limit';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest): Promise<NextResponse> {
    // Apply rate limiting
    const ip = getClientIp(request);
    const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    const cfIp = request.headers.get('cf-connecting-ip')?.trim();
    const identifier = ip && ip !== 'anonymous'
        ? ip
        : (forwarded || cfIp || `anon:${createHash('sha256')
            .update(`${request.headers.get('user-agent') || ''}|${request.headers.get('accept-language') || ''}`)
            .digest('hex')
            .slice(0, 16)}`);
    const rateLimit = await checkRateLimit(`vote:${identifier}`, rateLimits.standard);
    if (!rateLimit.success) {
        return NextResponse.json(
            { error: 'Too many votes. Please try again later.' },
            { status: 429 }
        );
    }

    let body;
    try {
        body = await request.json();
    } catch (err) {
        console.error('[Vote] Invalid JSON body:', err);
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const { toolId, voteType, action = 'add', previousVote } = body;

    if (!toolId || typeof toolId !== 'string' || !UUID_REGEX.test(toolId)) {
        return NextResponse.json(
            { error: 'Invalid request. toolId must be a valid UUID.' },
            { status: 400 }
        );
    }
    if (!['up', 'down'].includes(voteType)) {
        return NextResponse.json(
            { error: 'Invalid request. voteType (up/down) is required.' },
            { status: 400 }
        );
    }
    if (!['add', 'remove', 'change'].includes(action)) {
        return NextResponse.json(
            { error: 'Invalid action. Must be add, remove, or change.' },
            { status: 400 }
        );
    }
    if (action === 'change' && !['up', 'down'].includes(previousVote)) {
        return NextResponse.json(
            { error: 'previousVote (up/down) is required for change action.' },
            { status: 400 }
        );
    }

    const { data, error: rpcError } = await supabase.rpc('update_votes', {
        p_tool_id: toolId,
        p_action: action,
        p_vote_type: voteType,
        p_previous_vote: action === 'change' ? (previousVote || null) : null,
    });

    if (rpcError) {
        console.error('Vote update error:', rpcError);
        return NextResponse.json(
            { error: 'Failed to update vote' },
            { status: 500 }
        );
    }

    const result = Array.isArray(data) ? data[0] : data;
    if (!result) {
        return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
    }

    // Bust the ISR cache for this tool's detail page so the next visit
    // gets fresh vote counts from the database instead of the stale cached render.
    const { data: toolSlug, error: slugError } = await supabase
        .from('tools')
        .select('app_username')
        .eq('id', toolId)
        .maybeSingle();

    if (slugError) {
        console.error('[Vote] Error fetching tool slug:', slugError);
    }
    
    if (toolSlug?.app_username) {
        revalidatePath(`/app/${toolSlug.app_username}`);
    }
    revalidatePath('/');

    return NextResponse.json({
        success: true,
        upvotes: result.upvotes ?? 0,
        downvotes: result.downvotes ?? 0,
    });
}
