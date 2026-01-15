'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AIToolCard from '@/components/features/tools/ToolCard';
import { useAdminData } from '@/context/AdminContext';
import { ToolGridSkeleton } from '@/components/ui/Skeleton';

export default function SearchResultsPage() {
    const params = useParams();
    const adminData = useAdminData();
    const initialQuery = decodeURIComponent(params.query as string);
    const [searchQuery, setSearchQuery] = useState(initialQuery);

    const isLoading = !adminData?.isLoaded;

    const searchInTools = (query: string) => {
        if (!adminData || !query) return [];
        const q = query.toLowerCase();
        return adminData.getPublishedTools().filter(t =>
            t.name.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q) ||
            t.category.toLowerCase().includes(q) ||
            (t.features || []).some(f => f.toLowerCase().includes(q))
        );
    };

    const results = useMemo(() => searchInTools(initialQuery), [adminData, initialQuery]);

    const suggestions = searchQuery !== initialQuery && searchQuery.length > 0
        ? searchInTools(searchQuery).slice(0, 6)
        : [];

    const handleSearch = () => {
        if (searchQuery.trim() && searchQuery.trim() !== initialQuery) {
            window.location.href = `/search/${encodeURIComponent(searchQuery.trim())}`;
        }
    };

    return (
        <div className="max-w-[1200px] mx-auto px-4 py-6 sm:px-6 sm:py-10">
            <div className="mb-8">
                <Link href="/" className="inline-flex items-center gap-2 text-sm text-text-secondary mb-4 hover:text-accent-primary">
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
                            className="flex-1 border-none outline-none bg-transparent text-base text-text-primary placeholder:text-text-tertiary"
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
                            {suggestions.map((tool) => (
                                <div
                                    key={tool.id}
                                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-bg-tertiary"
                                    onClick={() => { window.location.href = `/app/${tool.slug}`; }}
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
                <p className="text-sm text-text-tertiary">{results.length} tool{results.length !== 1 ? 's' : ''} found</p>
            </div>

            {results.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {results.map((tool) => (
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
                    <Link href="/" className="text-accent-primary hover:underline">Go back home</Link>
                </div>
            )}
        </div>
    );
}
