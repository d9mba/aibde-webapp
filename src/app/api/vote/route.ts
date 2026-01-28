import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Vote API - Handles upvotes and downvotes for tools with toggle support
 * POST /api/vote
 * Body: { toolId: string, voteType: 'up' | 'down', action: 'add' | 'remove' | 'change', previousVote?: 'up' | 'down' }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { toolId, voteType, action = 'add', previousVote } = body;

        if (!toolId || !['up', 'down'].includes(voteType)) {
            return NextResponse.json(
                { error: 'Invalid request. toolId and voteType (up/down) are required.' },
                { status: 400 }
            );
        }

        // Get current tool data
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

        // Calculate new vote counts based on action
        let currentUpvotes = tool.upvotes || 0;
        let currentDownvotes = tool.downvotes || 0;

        if (action === 'remove') {
            // Remove existing vote
            if (voteType === 'up') {
                currentUpvotes = Math.max(0, currentUpvotes - 1);
            } else {
                currentDownvotes = Math.max(0, currentDownvotes - 1);
            }
        } else if (action === 'change') {
            // Change vote from one to another
            if (previousVote === 'up') {
                currentUpvotes = Math.max(0, currentUpvotes - 1);
                currentDownvotes += 1;
            } else if (previousVote === 'down') {
                currentDownvotes = Math.max(0, currentDownvotes - 1);
                currentUpvotes += 1;
            }
        } else {
            // Add new vote
            if (voteType === 'up') {
                currentUpvotes += 1;
            } else {
                currentDownvotes += 1;
            }
        }

        // Update the tool
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
