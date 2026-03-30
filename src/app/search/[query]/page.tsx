'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AIToolCard from '@/components/features/tools/ToolCard';
import { AdminTool } from '@/types';
import { ToolGridSkeleton } from '@/components/ui/Skeleton';

export default function SearchResultsPage() {
    const params = useParams();
    const router = useRouter();
    const rawQuery = params.query;
    const queryStr = Array.isArray(rawQuery) ? rawQuery[0] || '' : (rawQuery ?? '');
    const initialQuery = (() => {
        if (!queryStr) return '';
        try { return decodeURIComponent(queryStr); } catch { return queryStr; }
    })();
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [results, setResults] = useState<AdminTool[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch search results from API instead of loading all tools in memory
    useEffect(() => {
        if (!initialQuery) {
            router.replace('/search');
            return;
        }

        let cancelled = false;
        setIsLoading(true);
        setError(null);
        const controller = new AbortController();
        fetch(`/api/tools?search=${encodeURIComponent(initialQuery)}&status=published&limit=100`, { signal: controller.signal })
            .then(r => {
                if (!r.ok) throw new Error(`Search failed: ${r.status}`);
                return r.json();
            })
            .then(json => { if (!cancelled) setResults(json.data || []); })
            .catch((err) => {
                if (err.name !== 'AbortError' && !cancelled) {
                    console.error('[Search] Fetch failed:', err);
                    setResults([]);
                    setError('Failed to load search results');
                }
            })
            .finally(() => { if (!cancelled) setIsLoading(false); });
        return () => { cancelled = true; controller.abort(); };
    }, [initialQuery, router]);

    // Keep searchQuery in sync when the route/initialQuery changes
    useEffect(() => {
        setSearchQuery(initialQuery);
    }, [initialQuery]);

    const suggestions = useMemo(() => {
        if (searchQuery === initialQuery || searchQuery.length === 0) return [];
        const q = searchQuery.toLowerCase();
        return results.filter((t: AdminTool) =>
            t.appUsername &&
            ((t.name || '').toLowerCase().includes(q) ||
                (t.description || '').toLowerCase().includes(q))
        ).slice(0, 6);
    }, [searchQuery, initialQuery, results]);

    const handleSearch = () => {
        if (searchQuery.trim() && searchQuery.trim() !== initialQuery) {
            window.location.href = `/search/${encodeURIComponent(searchQuery.trim())}`;
        }
    };

    if (isLoading) {
        return (
            <div className="max-w-[1200px] mx-auto px-4 py-6 sm:px-6 sm:py-10">
                <div className="mb-8">
                    <div className="h-5 w-24 bg-bg-tertiary rounded animate-pulse mb-4" />
                    <div className="h-12 max-w-[500px] bg-bg-tertiary rounded-full animate-pulse mb-6" />
                    <div className="h-7 w-48 bg-bg-tertiary rounded animate-pulse mb-1" />
                    <div className="h-4 w-32 bg-bg-tertiary rounded animate-pulse" />
                </div>
                <ToolGridSkeleton count={12} />
            </div>
        );
    }

    return (
        <div className="max-w-[1200px] mx-auto px-4 py-6 sm:px-6 sm:py-10">
            <div className="mb-8">
                <Link href="/" prefetch={false} className="inline-flex items-center gap-2 text-sm text-text-secondary mb-4 hover:text-accent-primary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    Back to Home
                </Link>

                <div className="relative max-w-[500px] mb-6">
                    <div className="flex items-center gap-3 px-5 py-3.5 bg-bg-card border-2 border-border rounded-full transition-all duration-fast focus-within:border-accent-primary">
                        <svg className="text-text-tertiary" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <path d="M21 21l-4.35-4.35" />
                        </svg>
                        <input
                            type="text"
                            className="flex-1 border-none outline-none bg-transparent text-base text-text-primary placeholder:text-text-tertiary focus:shadow-none"
                            placeholder="Search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                        />
                        {searchQuery && (
                            <button className="p-1 text-text-tertiary hover:text-text-primary" onClick={() => setSearchQuery('')}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>

                    {suggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50">
                            {suggestions.map((tool: AdminTool) => (
                                <div
                                    key={tool.id}
                                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-bg-tertiary"
                                    onClick={() => { if (tool.appUsername) window.location.href = `/app/${tool.appUsername}`; }}
                                >
                                    <div
                                        className="w-9 h-9 rounded-md flex items-center justify-center text-white font-bold text-sm"
                                        style={{ backgroundColor: ['#ec4899', '#22c55e', '#3b82f6', '#f97316', '#8b5cf6', '#ef4444', '#06b6d4', '#eab308', '#14b8a6', '#6366f1'][tool.name.charCodeAt(0) % 10] }}
                                    >
                                        {tool.name.charAt(0)}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-text-primary">{tool.name}</span>
                                        <span className="text-xs text-text-tertiary">{tool.category}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <h1 className="text-xl font-bold text-text-primary mb-1">
                    Search results for &quot;<span className="text-accent-primary">{initialQuery}</span>&quot;
                </h1>
                {!error && !isLoading && (
                    <>
                        <p className="text-sm text-text-tertiary">
                            {results.length === 100 ? 'Showing top 100 tools' : `${results.length} tool${results.length !== 1 ? 's' : ''} found`}
                        </p>
                        {results.length === 100 && (
                            <p className="text-xs text-text-secondary mt-1">Please refine your search for more specific matches.</p>
                        )}
                    </>
                )}
            </div>

            {error ? (
                <div className="text-center py-16">
                    <svg className="mx-auto mb-4 text-accent-red" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <h2 className="text-lg font-semibold text-text-primary mb-2">{error}</h2>
                    <p className="text-text-secondary mb-4">Something went wrong while searching</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-accent-primary text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                        Try again
                    </button>
                </div>
            ) : results.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {results.map((tool: AdminTool) => (
                        <AIToolCard key={tool.id} tool={tool} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16">
                    <svg className="mx-auto mb-4 text-text-tertiary" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="11" cy="11" r="8" />
                        <path d="M21 21l-4.35-4.35" />
                    </svg>
                    <h2 className="text-lg font-semibold text-text-primary mb-2">No tools found</h2>
                    <p className="text-text-secondary mb-4">Try searching with different keywords</p>
                    <Link href="/" prefetch={false} className="text-accent-primary hover:underline">Go back home</Link>
                </div>
            )}
        </div>
    );
}
