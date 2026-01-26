'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import AIToolCard from '@/components/features/tools/ToolCard';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { AdminTool, Category, Task } from '@/types';
import { trackSearch, trackFilterUsed } from '@/hooks/useToolAnalytics';

const ITEMS_PER_PAGE = 20;

interface SearchPageClientProps {
    categories: Category[];
    tasks: Task[];
    spotlightTools: AdminTool[];
    toolCount: number;
    taskCount: number;
    categoryCount: number;
}

export default function SearchPageClient({ categories, tasks, spotlightTools, toolCount, taskCount, categoryCount }: SearchPageClientProps) {
    const searchParams = useSearchParams();
    const lastTrackedQuery = useRef<string>('');
    const searchTimeout = useRef<NodeJS.Timeout>();

    const [query, setQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedTask, setSelectedTask] = useState<string | null>(null);
    const [selectedPricing, setSelectedPricing] = useState<string | null>(null);
    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

    // Search state
    const [searchResults, setSearchResults] = useState<AdminTool[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // Read URL parameters on mount
    useEffect(() => {
        const q = searchParams.get('q');
        const pricing = searchParams.get('pricing');
        const category = searchParams.get('category');
        const task = searchParams.get('task');

        if (q) setQuery(q);
        if (pricing) setSelectedPricing(pricing);
        if (category) setSelectedCategory(category);
        if (task) setSelectedTask(task);
    }, [searchParams]);

    // Search function using API
    const performSearch = useCallback(async (searchQuery: string, category: string | null, task: string | null, pricing: string | null) => {
        // Only search if there's a query (min 3 chars) or filter
        if ((!searchQuery || searchQuery.length < 3) && !category && !task && !pricing) {
            setSearchResults([]);
            setHasSearched(false);
            return;
        }

        setIsSearching(true);
        try {
            const params = new URLSearchParams();
            if (searchQuery && searchQuery.length >= 3) params.append('q', searchQuery);
            if (category) params.append('category', category);
            if (task) params.append('task', task);
            if (pricing) params.append('pricing', pricing);
            params.append('limit', '100'); // Limit results

            const response = await fetch(`/api/search?${params.toString()}`);
            if (response.ok) {
                const data = await response.json();
                setSearchResults(data.tools || []);
                setHasSearched(true);
            }
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setIsSearching(false);
        }
    }, []);

    // Debounced search on query/filter change
    useEffect(() => {
        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        searchTimeout.current = setTimeout(() => {
            performSearch(query, selectedCategory, selectedTask, selectedPricing);
        }, 300);

        return () => {
            if (searchTimeout.current) {
                clearTimeout(searchTimeout.current);
            }
        };
    }, [query, selectedCategory, selectedTask, selectedPricing, performSearch]);

    // Reset visible count when results change
    useEffect(() => {
        setVisibleCount(ITEMS_PER_PAGE);
    }, [searchResults]);

    // Track search queries
    useEffect(() => {
        if (query && query.length >= 3 && query !== lastTrackedQuery.current && hasSearched) {
            trackSearch(query, searchResults.length);
            lastTrackedQuery.current = query;
        }
    }, [query, searchResults.length, hasSearched]);

    // Track filter usage
    useEffect(() => {
        if (selectedCategory) trackFilterUsed('category', selectedCategory);
    }, [selectedCategory]);

    useEffect(() => {
        if (selectedTask) trackFilterUsed('task', selectedTask);
    }, [selectedTask]);

    useEffect(() => {
        if (selectedPricing) trackFilterUsed('pricing', selectedPricing);
    }, [selectedPricing]);

    // Paginated results
    const visibleTools = searchResults.slice(0, visibleCount);
    const hasMore = visibleCount < searchResults.length;

    const handleLoadMore = () => {
        setVisibleCount(prev => prev + ITEMS_PER_PAGE);
    };

    const clearFilters = () => {
        setQuery('');
        setSelectedCategory(null);
        setSelectedTask(null);
        setSelectedPricing(null);
        setSearchResults([]);
        setHasSearched(false);
    };

    const hasActiveFilters = query || selectedCategory || selectedTask || selectedPricing;

    return (
        <div className="max-w-[1200px] mx-auto px-4 py-6 sm:px-6 sm:py-10">
            {/* Hero Section - Matching main page style */}
            <section className="text-center flex flex-col items-center gap-4 py-8 mb-8">
                <h1 className="font-orbitron text-5xl sm:text-6xl font-bold text-text-primary tracking-wider lowercase m-0">
                    aibde
                </h1>
                <p className="font-orbitron text-text-secondary text-sm sm:text-base -mt-2 tracking-wide">Browse, Discover, Explore</p>
                <p className="text-text-tertiary text-xs sm:text-sm -mt-2">
                    <span className="text-text-primary font-semibold">{toolCount.toLocaleString()}</span> AI tools for <span className="text-text-primary font-semibold">{taskCount}</span> tasks and <span className="text-text-primary font-semibold">{categoryCount}</span> categories
                </p>

                {/* Search Input */}
                <div className="relative w-full max-w-[500px] mt-1 py-1">
                    <div className="bg-bg-card border border-border rounded-full shadow-lg hover:shadow-xl hover:border-text-tertiary focus-within:border-accent-primary/50 focus-within:shadow-[0_0_0_3px_rgba(52,178,123,0.25)] transition-all duration-200">
                        <div className="flex items-center gap-3 w-full px-5 py-3.5">
                            <svg className="text-text-tertiary flex-shrink-0" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" />
                                <path d="M21 21l-4.35-4.35" />
                            </svg>
                            <input
                                type="text"
                                autoComplete="off"
                                className="flex-1 border-none outline-none bg-transparent text-base font-medium text-text-primary placeholder:text-text-tertiary/50"
                                placeholder="Search AI tools... (min 3 characters)"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                            {isSearching && (
                                <span className="w-5 h-5 border-2 border-border border-t-accent-primary rounded-full animate-spin"></span>
                            )}
                            {query && !isSearching && (
                                <button
                                    className="flex items-center justify-center p-1 bg-transparent border-none cursor-pointer text-text-tertiary transition-colors hover:text-text-primary"
                                    onClick={() => setQuery('')}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M18 6L6 18M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {query && query.length < 3 && (
                    <p className="text-xs text-text-tertiary">Type at least 3 characters to search</p>
                )}
                {query && query.length >= 3 && hasSearched && (
                    <p className="text-sm text-text-secondary">
                        Found <span className="font-medium text-text-primary">{searchResults.length}</span> results for &ldquo;<span className="font-medium text-text-primary">{query}</span>&rdquo;
                    </p>
                )}
            </section>

            {/* Pro Tip with Quick Browse Pills */}
            {!hasSearched && (
                <div className="text-center mb-8">
                    <p className="text-xs text-text-tertiary mb-3">
                        <span className="text-accent-primary font-medium">Pro tip:</span> Try quick filters to discover tools
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                        <button
                            onClick={() => setSelectedPricing('free')}
                            className={`px-4 py-2 text-sm rounded-full border transition-all duration-200 ${selectedPricing === 'free'
                                ? 'bg-accent-green/20 border-accent-green text-accent-green'
                                : 'bg-bg-card border-border text-text-secondary hover:border-text-tertiary hover:text-text-primary'
                                }`}
                        >
                            100% Free
                        </button>
                        <button
                            onClick={() => setSelectedPricing('freemium')}
                            className={`px-4 py-2 text-sm rounded-full border transition-all duration-200 ${selectedPricing === 'freemium'
                                ? 'bg-accent-primary/20 border-accent-primary text-accent-primary'
                                : 'bg-bg-card border-border text-text-secondary hover:border-text-tertiary hover:text-text-primary'
                                }`}
                        >
                            Freemium
                        </button>
                        <a
                            href="/tasks"
                            className="px-4 py-2 text-sm rounded-full border border-border bg-bg-card text-text-secondary hover:border-text-tertiary hover:text-text-primary transition-all duration-200"
                        >
                            Browse by Task
                        </a>
                        <a
                            href="/categories"
                            className="px-4 py-2 text-sm rounded-full border border-border bg-bg-card text-text-secondary hover:border-text-tertiary hover:text-text-primary transition-all duration-200"
                        >
                            Browse by Category
                        </a>
                    </div>
                </div>
            )}

            <div className="flex flex-wrap gap-3 mb-6 justify-center">
                <SearchableSelect
                    options={[
                        { value: '', label: 'All Categories' },
                        ...categories.map(cat => ({ value: cat.categoryName, label: cat.categoryName }))
                    ]}
                    value={selectedCategory || ''}
                    onChange={(value) => setSelectedCategory(value || null)}
                    placeholder="All Categories"
                    className="min-w-[160px]"
                />

                <SearchableSelect
                    options={[
                        { value: '', label: 'All Tasks' },
                        ...tasks.map(task => ({ value: task.taskName, label: task.taskName }))
                    ]}
                    value={selectedTask || ''}
                    onChange={(value) => setSelectedTask(value || null)}
                    placeholder="All Tasks"
                    className="min-w-[160px]"
                />

                <SearchableSelect
                    options={[
                        { value: '', label: 'All Pricing' },
                        { value: 'free', label: 'Free' },
                        { value: 'freemium', label: 'Freemium' },
                        { value: 'paid', label: 'Paid' },
                    ]}
                    value={selectedPricing || ''}
                    onChange={(value) => setSelectedPricing(value || null)}
                    placeholder="All Pricing"
                    showSearch={false}
                    className="min-w-[140px]"
                />

                {hasActiveFilters && (
                    <button
                        onClick={clearFilters}
                        className="px-4 py-2 text-sm text-text-tertiary hover:text-accent-primary transition-colors"
                    >
                        Clear all
                    </button>
                )}
            </div>

            {/* Search Results */}
            {hasSearched && (
                <div className="mb-12">
                    <p className="text-sm text-text-tertiary mb-4">
                        {searchResults.length} tool{searchResults.length !== 1 ? 's' : ''} found
                        {query && ` for "${query}"`}
                    </p>

                    {searchResults.length === 0 ? (
                        <div className="text-center py-16 px-4">
                            <div className="text-5xl mb-4">🔍</div>
                            <h3 className="text-xl font-semibold text-text-primary mb-2">We might have missed something!</h3>
                            <p className="text-text-secondary mb-6 max-w-md mx-auto">
                                We couldn't find what you're looking for. If you know an AI tool that should be here, help us grow our directory.
                            </p>
                            <a
                                href="/submit"
                                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-accent-primary rounded-full transition-opacity hover:opacity-90"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 5v14M5 12h14" />
                                </svg>
                                Submit a Tool
                            </a>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {visibleTools.map((tool) => (
                                    <AIToolCard key={tool.id} tool={tool} />
                                ))}
                            </div>

                            {hasMore && (
                                <div className="text-center mt-8">
                                    <button
                                        onClick={handleLoadMore}
                                        className="px-6 py-3 bg-bg-card border border-border rounded-full text-sm font-medium text-text-primary transition-all duration-200 hover:border-text-tertiary hover:shadow-md"
                                    >
                                        Load more ({searchResults.length - visibleCount} remaining)
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Tools only shown after search */}
        </div>
    );
}
