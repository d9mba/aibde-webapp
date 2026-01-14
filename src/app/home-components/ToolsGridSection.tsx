'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import AIToolCard from '@/components/features/tools/ToolCard';
import { AdminTool } from '@/types';

const INITIAL_LOAD = 12;
const LOAD_MORE = 12;
const MAX_ITEMS = 100;

interface ToolsGridSectionProps {
    tools: AdminTool[];
}

export default function ToolsGridSection({ tools }: ToolsGridSectionProps) {
    const [activeTab, setActiveTab] = useState<'latest' | 'trending'>('latest');
    const [visibleCount, setVisibleCount] = useState(INITIAL_LOAD);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    const newTools = useMemo(() => {
        return [...tools].sort((a, b) =>
            new Date(b.releasedAt).getTime() - new Date(a.releasedAt).getTime()
        );
    }, [tools]);

    const trendingTools = useMemo(() => {
        return [...tools].sort((a, b) => b.saveCount - a.saveCount);
    }, [tools]);

    const displayTools = activeTab === 'latest' ? newTools : trendingTools;
    const hasMore = visibleCount < Math.min(displayTools.length, MAX_ITEMS);

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
            setVisibleCount(prev => Math.min(prev + LOAD_MORE, MAX_ITEMS));
        }
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(handleObserver, {
            root: null,
            rootMargin: '100px',
            threshold: 0.1,
        });

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => observer.disconnect();
    }, [handleObserver]);

    return (
        <section className="flex flex-col gap-4">
            <div className="flex justify-center mb-2 sticky top-14 sm:top-16 z-[50] py-4 -mx-4 sm:-mx-6 px-4 sm:px-6">
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
                {displayTools.slice(0, visibleCount).map((tool) => (
                    <AIToolCard key={tool.id} tool={tool} />
                ))}
            </div>

            {hasMore && (
                <div ref={loadMoreRef} className="flex items-center justify-center gap-2.5 py-6 text-text-tertiary text-sm">
                    <span className="w-[18px] h-[18px] border-2 border-border border-t-accent-blue rounded-full animate-spin"></span>
                    <span>Loading more tools...</span>
                </div>
            )}

            <div className="flex justify-center mt-4">
                <Link
                    href={activeTab === 'latest' ? '/new' : '/trending'}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 text-[0.8125rem] font-medium text-text-secondary bg-bg-tertiary rounded-full transition-all duration-fast hover:bg-accent-blue hover:text-white"
                >
                    View all {activeTab === 'latest' ? 'latest' : 'trending'} tools
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                </Link>
            </div>
        </section>
    );
}
