'use client';

import { useState, useEffect } from 'react';
import UpvoteIcon from '@/assets/svg/actions/upvote.svg';

interface VoteButtonsProps {
    toolId: string;
    initialUpvotes: number;
    initialDownvotes: number;
}

// Local storage key for tracking user votes
const VOTE_STORAGE_KEY = 'aibde_votes';

interface VoteRecord {
    [toolId: string]: 'up' | 'down';
}

export default function VoteButtons({ toolId, initialUpvotes, initialDownvotes }: VoteButtonsProps) {
    const [upvotes, setUpvotes] = useState(initialUpvotes);
    const [downvotes, setDownvotes] = useState(initialDownvotes);
    const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
    const [isVoting, setIsVoting] = useState(false);

    // Load user's previous vote from localStorage
    useEffect(() => {
        try {
            const stored = localStorage.getItem(VOTE_STORAGE_KEY);
            if (stored) {
                const votes: VoteRecord = JSON.parse(stored);
                if (votes[toolId]) {
                    setUserVote(votes[toolId]);
                }
            }
        } catch {
            // Ignore localStorage errors
        }
    }, [toolId]);

    const handleVote = async (voteType: 'up' | 'down') => {
        if (isVoting) return;

        setIsVoting(true);

        // Determine the action: toggle off, change vote, or new vote
        let action: 'add' | 'remove' | 'change' = 'add';
        let previousVote = userVote;

        if (userVote === voteType) {
            // Clicking same vote = remove vote
            action = 'remove';
        } else if (userVote !== null) {
            // Clicking different vote = change vote
            action = 'change';
        }

        try {
            const res = await fetch('/api/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ toolId, voteType, action, previousVote }),
            });

            if (res.ok) {
                const data = await res.json();
                setUpvotes(data.upvotes);
                setDownvotes(data.downvotes);

                // Update user vote state
                const newVote = action === 'remove' ? null : voteType;
                setUserVote(newVote);

                // Save to localStorage
                try {
                    const stored = localStorage.getItem(VOTE_STORAGE_KEY);
                    const votes: VoteRecord = stored ? JSON.parse(stored) : {};
                    if (newVote) {
                        votes[toolId] = newVote;
                    } else {
                        delete votes[toolId];
                    }
                    localStorage.setItem(VOTE_STORAGE_KEY, JSON.stringify(votes));
                } catch {
                    // Ignore localStorage errors
                }
            }
        } catch (error) {
            console.error('Vote failed:', error);
        } finally {
            setIsVoting(false);
        }
    };

    const netVotes = upvotes - downvotes;

    return (
        <div className="flex items-center gap-0 bg-bg-tertiary rounded-full overflow-hidden">
            {/* Upvote button */}
            <button
                onClick={() => handleVote('up')}
                disabled={isVoting}
                className={`flex items-center justify-center w-8 h-8 transition-colors ${userVote === 'up'
                    ? 'text-green-500 bg-green-500/10'
                    : 'text-text-secondary hover:text-green-500 hover:bg-green-500/5'
                    }`}
                title={userVote === 'up' ? 'Remove upvote' : 'Upvote'}
            >
                <UpvoteIcon className="w-3.5 h-3.5" />
            </button>

            {/* Vote count */}
            <span className={`min-w-[40px] text-center text-sm font-medium ${netVotes > 0 ? 'text-green-500' : 'text-text-secondary'
                }`}>
                {Math.max(0, netVotes) >= 1000 ? `${(Math.max(0, netVotes) / 1000).toFixed(1)}k` : Math.max(0, netVotes)}
            </span>

            {/* Downvote button */}
            <button
                onClick={() => handleVote('down')}
                disabled={isVoting}
                className={`flex items-center justify-center w-8 h-8 transition-colors ${userVote === 'down'
                    ? 'text-red-500 bg-red-500/10'
                    : 'text-text-secondary hover:text-red-500 hover:bg-red-500/5'
                    }`}
                title={userVote === 'down' ? 'Remove downvote' : 'Downvote'}
            >
                <UpvoteIcon className="w-3.5 h-3.5 rotate-180" />
            </button>
        </div>
    );
}

