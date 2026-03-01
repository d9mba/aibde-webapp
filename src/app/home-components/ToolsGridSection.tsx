'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import AIToolCard from '@/components/features/tools/ToolCard';
import { AdminTool } from '@/types';

const INITIAL_LOAD = 30;
const LOAD_MORE = 12;
const MAX_LATEST = 90;
const MAX_TRENDING = 50;

interface ToolsGridSectionProps {
    tools: AdminTool[];
    trendingTools: AdminTool[];
}

export default function ToolsGridSection({ tools, trendingTools }: ToolsGridSectionProps) {
    const [activeTab, setActiveTab] = useState<'latest' | 'trending'>('latest');
    const [visibleCount, setVisibleCount] = useState(INITIAL_LOAD);
    const loadMoreRef = useRef<HTMLDivElement>(null);
    const sectionRef = useRef<HTMLElement>(null);

    const newTools = useMemo(() => {
        const toTimestamp = (t: AdminTool) => {
            const raw = t.launchedOn ?? t.createdAt;
            if (raw == null) return 0;
            const ts = new Date(raw).getTime();
            return Number.isNaN(ts) ? 0 : ts;
        };
        return [...tools].sort((a, b) => toTimestamp(b) - toTimestamp(a));
    }, [tools]);

    const displayTools = activeTab === 'latest' ? newTools : trendingTools;
    const maxItems = activeTab === 'latest' ? MAX_LATEST : MAX_TRENDING;
    const hasMore = visibleCount < Math.min(displayTools.length, maxItems);
    const reachedMax = visibleCount >= maxItems;

    useEffect(() => {
        setVisibleCount(INITIAL_LOAD);
    }, [activeTab]);

    // Scroll-based lazy loading via IntersectionObserver
    useEffect(() => {
        if (!hasMore) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisibleCount(prev => Math.min(prev + LOAD_MORE, maxItems));
                }
            },
            { root: null, rootMargin: '200px', threshold: 0.1 }
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => observer.disconnect();
    }, [hasMore, maxItems]);

    function handleLoadMore(): void {
        setVisibleCount(prev => Math.min(prev + LOAD_MORE, maxItems));
    }

    return (
        <section ref={sectionRef} className="flex flex-col gap-4 scroll-mt-14 sm:scroll-mt-16">
            <div className="flex justify-center mb-2 sticky top-14 sm:top-16 z-10 py-4 -mx-4 sm:-mx-6 px-4 sm:px-6">
                <div className="inline-flex gap-1 p-1 bg-bg-tertiary rounded-full">
                    <button
                        className={`inline-flex items-center gap-2 px-6 py-2.5 text-[0.9375rem] font-semibold border-none rounded-full cursor-pointer transition-all duration-fast ${activeTab === 'latest'
                            ? 'bg-bg-card text-text-primary shadow-sm'
                            : 'bg-transparent text-text-tertiary hover:text-text-secondary'
                            }`}
                        onClick={() => { setActiveTab('latest'); sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
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
                        onClick={() => { setActiveTab('trending'); sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
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

            {/* Auto-loading sentinel */}
            {hasMore && (
                <div ref={loadMoreRef} className="flex items-center justify-center gap-2.5 py-6 text-text-tertiary text-sm">
                    <span className="w-[18px] h-[18px] border-2 border-border border-t-accent-primary rounded-full animate-spin"></span>
                    <span>Loading more tools...</span>
                </div>
            )}

            {/* Manual fallback button */}
            {hasMore && !reachedMax && (
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

            {/* Reached max — show Browse All */}
            {reachedMax && displayTools.length > maxItems && (
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

            {/* View all link */}
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
