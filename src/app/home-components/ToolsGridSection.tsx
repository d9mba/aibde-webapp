'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import AIToolCard from '@/components/features/tools/ToolCard';
import { AdminTool } from '@/types';

const INITIAL_LOAD = 30;           // Initial load: 30 tools
const LOAD_MORE = 6;               // Load 6 more each time
const MAX_LATEST = 90;             // Maximum 90 for "Just Released"
const MAX_TRENDING = 50;           // Maximum 50 for "Trending"

interface ToolsGridSectionProps {
    tools: AdminTool[];
    trendingTools: AdminTool[];
}

export default function ToolsGridSection({ tools, trendingTools }: ToolsGridSectionProps) {
    const [activeTab, setActiveTab] = useState<'latest' | 'trending'>('latest');
    const [visibleCount, setVisibleCount] = useState(INITIAL_LOAD);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    const newTools = useMemo(() => {
        return [...tools].sort((a, b) =>
            new Date(b.released_on).getTime() - new Date(a.released_on).getTime()
        );
    }, [tools]);

    // Use trendingTools directly from server - already filtered and sorted
    const displayTools = activeTab === 'latest' ? newTools : trendingTools;
    const maxItems = activeTab === 'latest' ? MAX_LATEST : MAX_TRENDING;
    const hasMore = visibleCount < Math.min(displayTools.length, maxItems);
    const reachedMax = visibleCount >= maxItems;
    const showLoadMore = activeTab === 'latest'; // Only show load more for latest

    // Reset visible count when tab changes
    useEffect(() => {
        setVisibleCount(INITIAL_LOAD);
    }, [activeTab]);

    const hasMoreRef = useRef(hasMore);
    useEffect(() => {
        hasMoreRef.current = hasMore;
    }, [hasMore]);

    const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMoreRef.current) {
            setVisibleCount(prev => Math.min(prev + LOAD_MORE, maxItems));
        }
    }, [maxItems]);

    useEffect(() => {
        const observer = new IntersectionObserver(handleObserver, {
            root: null,
            rootMargin: '100px',
            threshold: 0.1,
        });

        if (loadMoreRef.current && showLoadMore) {
            observer.observe(loadMoreRef.current);
        }

        return () => observer.disconnect();
    }, [handleObserver, showLoadMore]);

    const handleLoadMore = () => {
        setVisibleCount(prev => Math.min(prev + LOAD_MORE, maxItems));
    };

    return (
        <section className="flex flex-col gap-4">
            <div className="flex justify-center mb-2 sticky top-14 sm:top-16 z-10 py-4 -mx-4 sm:-mx-6 px-4 sm:px-6">
                <div className="inline-flex gap-1 p-1 bg-bg-tertiary rounded-full">
                    <button
                        className={`inline-flex items-center gap-2 px-6 py-2.5 text-[0.9375rem] font-semibold border-none rounded-full cursor-pointer transition-all duration-fast ${activeTab === 'latest'
                            ? 'bg-bg-card text-text-primary shadow-sm'
                            : 'bg-transparent text-text-tertiary hover:text-text-secondary'
                            }`}
                        onClick={() => setActiveTab('latest')}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                        </svg>
                        Just Released
                    </button>
                    <button
                        className={`inline-flex items-center gap-2 px-6 py-2.5 text-[0.9375rem] font-semibold border-none rounded-full cursor-pointer transition-all duration-fast ${activeTab === 'trending'
                            ? 'bg-bg-card text-text-primary shadow-sm'
                            : 'bg-transparent text-text-tertiary hover:text-text-secondary'
                            }`}
                        onClick={() => setActiveTab('trending')}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 2L11 13" />
                            <path d="M22 2l-7 20-4-9-9-4 20-7z" />
                        </svg>
                        Trending
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {displayTools.slice(0, visibleCount).map((tool, index) => (
                    <AIToolCard
                        key={tool.id}
                        tool={tool}
                        ranking={activeTab === 'trending' ? index + 1 : undefined}
                    />
                ))}
            </div>

            {/* Auto-loading indicator (only for Just Released) */}
            {hasMore && showLoadMore && (
                <div ref={loadMoreRef} className="flex items-center justify-center gap-2.5 py-6 text-text-tertiary text-sm">
                    <span className="w-[18px] h-[18px] border-2 border-border border-t-accent-primary rounded-full animate-spin"></span>
                    <span>Loading more tools...</span>
                </div>
            )}

            {/* Manual Load More button (only for Just Released before max) */}
            {hasMore && showLoadMore && !reachedMax && (
                <div className="flex justify-center">
                    <button
                        onClick={handleLoadMore}
                        className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-text-primary bg-bg-card border border-border rounded-full transition-all duration-fast hover:border-accent-primary hover:bg-accent-primary/5"
                    >
                        Load More Tools
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 5v14M5 12l7 7 7-7" />
                        </svg>
                    </button>
                </div>
            )}

            {/* Reached max - show Browse All (only for Just Released) */}
            {reachedMax && showLoadMore && displayTools.length > maxItems && (
                <div className="flex flex-col items-center gap-2 py-4 text-center">
                    <p className="text-sm text-text-secondary">
                        Showing {maxItems} of {displayTools.length} tools
                    </p>
                    <Link
                        href="/search"
                        prefetch={false}
                        className="inline-flex items-center gap-1.5 px-6 py-3 text-sm font-medium text-white bg-accent-primary rounded-full transition-all duration-fast hover:bg-accent-primary/90 hover:shadow-lg"
                    >
                        Browse All Tools
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </Link>
                </div>
            )}

            {/* View all link at bottom (always show) */}
            <div className="flex justify-center mt-4">
                <Link
                    href={activeTab === 'latest' ? '/search' : '/trending'}
                    prefetch={false}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 text-[0.8125rem] font-medium text-text-secondary bg-bg-tertiary rounded-full transition-all duration-fast hover:bg-accent-primary hover:text-white"
                >
                    View all {activeTab === 'latest' ? 'tools' : 'trending tools'}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                </Link>
            </div>
        </section>
    );
}
