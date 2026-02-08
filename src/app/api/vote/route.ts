import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { checkRateLimit, rateLimits } from '@/lib/rate-limit';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const forwarded = request.headers.get('x-forwarded-for');
        const clientIp = forwarded
            ? forwarded.split(',').map((s) => s.trim()).find(Boolean)
            : null;
        const identifier = clientIp ?? request.headers.get('x-real-ip') ?? 'anonymous';
        const rateLimit = await checkRateLimit(`vote:${identifier}`, rateLimits.sensitive);
        if (!rateLimit.success) {
            return NextResponse.json(
                { error: 'Too many requests. Try again later.' },
                { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)) } }
            );
        }

        const body = await request.json();
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

        const { data: tool, error: fetchError } = await supabaseAdmin
            .from('tools')
            .select('upvotes, downvotes')
            .eq('id', toolId)
            .single();

        if (fetchError || !tool) {
            return NextResponse.json(
                { error: 'Tool not found' },
                { status: 404 }
            );
        }

        let currentUpvotes = tool.upvotes || 0;
        let currentDownvotes = tool.downvotes || 0;

        if (action === 'remove') {
            if (voteType === 'up') {
                currentUpvotes = Math.max(0, currentUpvotes - 1);
            } else {
                currentDownvotes = Math.max(0, currentDownvotes - 1);
            }
        } else if (action === 'change') {
            if (previousVote === 'up') {
                currentUpvotes = Math.max(0, currentUpvotes - 1);
                currentDownvotes += 1;
            } else if (previousVote === 'down') {
                currentDownvotes = Math.max(0, currentDownvotes - 1);
                currentUpvotes += 1;
            }
        } else {
            if (voteType === 'up') {
                currentUpvotes += 1;
            } else {
                currentDownvotes += 1;
            }
        }

        const { error: updateError } = await supabaseAdmin
            .from('tools')
            .update({ upvotes: currentUpvotes, downvotes: currentDownvotes })
            .eq('id', toolId);

        if (updateError) {
            console.error('Vote update error:', updateError);
            return NextResponse.json(
                { error: 'Failed to update vote' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            upvotes: currentUpvotes,
            downvotes: currentDownvotes,
        });

    } catch (error) {
        console.error('Vote API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
