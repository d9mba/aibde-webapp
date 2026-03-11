import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {

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

        return NextResponse.json({
            success: true,
            upvotes: result.upvotes ?? 0,
            downvotes: result.downvotes ?? 0,
        });

    } catch (error) {
        console.error('Vote API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
