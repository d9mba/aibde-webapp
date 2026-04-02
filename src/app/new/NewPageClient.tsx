'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import AIToolCard from '@/components/features/tools/ToolCard';
import { AdminTool } from '@/types';
import { useSearch } from '@/context/SearchContext';

const INITIAL_LOAD = 30;
const LOAD_MORE = 12;

interface NewPageClientProps {
    tools: AdminTool[];
}

export default function NewPageClient({ tools }: NewPageClientProps) {
    const { setSharedTools } = useSearch();
    const [visibleCount, setVisibleCount] = useState(INITIAL_LOAD);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (tools.length > 0) {
            setSharedTools(tools);
        }
        setVisibleCount(INITIAL_LOAD);
    }, [tools, setSharedTools]);

    const newTools = useMemo(() =>
        [...tools].sort((a, b) => {
            const dateA = new Date(a.createdAt ?? 0).getTime() || 0;
            const dateB = new Date(b.createdAt ?? 0).getTime() || 0;
            return dateB - dateA;
        }),
        [tools]
    );

    const hasMore = visibleCount < newTools.length;

    // Scroll-based lazy loading via IntersectionObserver
    useEffect(() => {
        if (!hasMore) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisibleCount(prev => Math.min(prev + LOAD_MORE, newTools.length));
                }
            },
            { root: null, rootMargin: '200px', threshold: 0.1 }
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => observer.disconnect();
    }, [hasMore, newTools.length]);

    return (
        <div className="max-w-[1200px] mx-auto px-4 py-6 sm:px-6 sm:py-10">
            <section className="text-center py-8 mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">Just Released</h1>
                <p className="text-text-secondary">Discover the latest AI tools added to our directory</p>
            </section>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {newTools.slice(0, visibleCount).map((tool) => (
                    <AIToolCard key={tool.id} tool={tool} />
                ))}
            </div>

            {/* Auto-loading sentinel */}
            {hasMore && (
                <div ref={loadMoreRef} role="status" aria-live="polite" className="flex items-center justify-center gap-2.5 py-6 text-text-tertiary text-sm">
                    <span className="w-[18px] h-[18px] border-2 border-border border-t-accent-primary rounded-full animate-spin"></span>
                    <span>Loading more tools...</span>
                </div>
            )}
        </div>
    );
}
