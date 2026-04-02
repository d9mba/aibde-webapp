'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import SearchSuggestionsDropdown from '@/components/ui/SearchSuggestionsDropdown';
import { Category, Task, AdminTool } from '@/types';
import AIToolCard from '@/components/features/tools/ToolCard';
import { trackSearch, trackFilterUsed } from '@/hooks/useToolAnalytics';
import { searchWithCountAction, getSearchSuggestionsAction } from '@/lib/actions';

const PAGE_SIZE = 48;

interface SearchPageClientProps {
    categories: Category[];
    tasks: Task[];
    toolCount: number;
    taskCount: number;
    categoryCount: number;
    initialQuery: string;
    initialCategory: string | null;
    initialTask: string | null;
    initialPricing: string | null;
}

export default function SearchPageClient({ categories, tasks, toolCount, taskCount, categoryCount, initialQuery, initialCategory, initialTask, initialPricing }: SearchPageClientProps) {
    const lastTrackedQuery = useRef<string>('');
    const searchTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
    const abortRef = useRef<AbortController | null>(null);
    const router = useRouter();
    const searchCommittedRef = useRef(!!initialQuery);

    const [query, setQuery] = useState(initialQuery);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory);
    const [selectedTask, setSelectedTask] = useState<string | null>(initialTask);
    const [selectedPricing, setSelectedPricing] = useState<string | null>(initialPricing);

    // Search state
    const [searchResults, setSearchResults] = useState<AdminTool[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [isSearching, setIsSearching] = useState(false);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const resultsRef = useRef<HTMLDivElement>(null);
    const blurTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    // Ctrl+K keyboard shortcut to focus search
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k' && window.scrollY < 200) {
                e.preventDefault();
                e.stopPropagation();
                inputRef.current?.focus();
            }
        };
        document.addEventListener('keydown', handleKeyDown, true);
        return () => {
            document.removeEventListener('keydown', handleKeyDown, true);
            // Clean up blur timeout on unmount to prevent leaked state updates
            clearTimeout(blurTimeoutRef.current);
        };
    }, []);


    // Suggestions state (shown while typing)
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [committedQuery, setCommittedQuery] = useState(initialQuery); // Query that triggers full search
    const [selectedIndex, setSelectedIndex] = useState(-1); // For arrow key navigation

    // Fetch suggestions while typing (small list)
    const fetchSuggestions = useCallback(async (q: string) => {
        if (!q || q.length < 2) {
            setSuggestions([]);
            return;
        }
        setIsLoadingSuggestions(true);
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        try {
            // NOTE: getSearchSuggestionsAction is a Next.js Server Action (RPC call),
            // not a fetch request, so it cannot accept an AbortSignal. The controller
            // is only used to discard stale results via signal.aborted checks below.
            const tools = await getSearchSuggestionsAction(q, 6);
            if (!controller.signal.aborted) {
                setSuggestions(tools);
            }
        } catch (error) {
            if (!controller.signal.aborted) {
                console.error('Suggestions failed:', error);
            }
        } finally {
            if (!controller.signal.aborted) {
                setIsLoadingSuggestions(false);
            }
        }
    }, []);

    // Fetch a specific page of results
    const performSearch = useCallback(async (searchQuery: string, category: string | null, task: string | null, pricing: string | null, page: number = 1) => {
        if ((!searchQuery || searchQuery.length < 3) && !category && !task && !pricing) {
            setSearchResults([]);
            setTotalCount(0);
            setHasSearched(false);
            return;
        }

        setIsSearching(true);
        setShowSuggestions(false);
        try {
            const { tools, totalCount } = await searchWithCountAction({
                query: searchQuery && searchQuery.length >= 3 ? searchQuery : undefined,
                category: category || undefined,
                task: task || undefined,
                pricing: pricing || undefined,
                limit: PAGE_SIZE,
                offset: (page - 1) * PAGE_SIZE,
            });
            setSearchResults(tools);
            setTotalCount(totalCount);
            setCurrentPage(page);
            setHasSearched(true);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setIsSearching(false);
        }
    }, []);

    // Navigate to a specific page
    async function goToPage(page: number): Promise<void> {
        await performSearch(committedQuery, selectedCategory, selectedTask, selectedPricing, page);
        if (resultsRef.current) {
            resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            window.scrollTo(0, 0);
        }
    }

    // Debounced suggestions on query change (NOT full search)
    useEffect(() => {
        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        // Skip suggestions when search is already committed (e.g. landing on /search?q=audio)
        if (searchCommittedRef.current) return;

        if (query.length >= 2) {
            searchTimeout.current = setTimeout(() => {
                fetchSuggestions(query);
                setShowSuggestions(true);
            }, 350);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }

        return () => {
            if (searchTimeout.current) {
                clearTimeout(searchTimeout.current);
            }
        };
    }, [query, fetchSuggestions]);

    // Trigger fresh search (page 1) when committed query or filters change
    useEffect(() => {
        performSearch(committedQuery, selectedCategory, selectedTask, selectedPricing, 1);
    }, [committedQuery, selectedCategory, selectedTask, selectedPricing, performSearch]);

    // Handle keyboard navigation (arrows, Enter, Escape)
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const maxIndex = suggestions.length; // suggestions + "Search for" button

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, maxIndex));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, -1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
                const selected = suggestions[selectedIndex];
                if (selected?.appUsername) {
                    router.push(`/app/${selected.appUsername}`);
                }
            } else {
                if (searchTimeout.current) {
                    clearTimeout(searchTimeout.current);
                    searchTimeout.current = undefined;
                }
                searchCommittedRef.current = true;
                setCommittedQuery(query);
                setShowSuggestions(false);
            }
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
            setSelectedIndex(-1);
        }
    };

    // Reset selected index when suggestions change
    useEffect(() => {
        setSelectedIndex(-1);
    }, [suggestions]);

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

    // Pagination helpers
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    function getPageNumbers(): (number | 'ellipsis')[] {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }
        const pages: (number | 'ellipsis')[] = [1];
        if (currentPage > 3) pages.push('ellipsis');
        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);
        for (let i = start; i <= end; i++) pages.push(i);
        if (currentPage < totalPages - 2) pages.push('ellipsis');
        if (totalPages > 1 && pages[pages.length - 1] !== totalPages) pages.push(totalPages);
        return pages;
    }

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
                    <div className={`bg-bg-card border rounded-full shadow-lg hover:shadow-xl transition-all duration-200 ${isFocused ? 'border-emerald-500 shadow-[0_0_0_3px_rgba(52,178,123,0.25)]' : 'border-border hover:border-text-tertiary'}`}>
                        <div className="flex items-center gap-3 w-full px-5 py-3.5">
                            {(isSearching || isLoadingSuggestions) ? (
                                <span className="w-[22px] h-[22px] border-2 border-border border-t-accent-primary rounded-full animate-spin flex-shrink-0" />
                            ) : (
                                <svg className={`flex-shrink-0 transition-colors ${isFocused ? 'text-accent-primary' : 'text-text-tertiary'}`} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="M21 21l-4.35-4.35" />
                                </svg>
                            )}
                            <input
                                ref={inputRef}
                                type="text"
                                autoComplete="off"
                                className="flex-1 border-none outline-none bg-transparent text-base font-medium text-text-primary placeholder:text-text-tertiary/50 focus:shadow-none"
                                placeholder="Search AI tools... (press Enter to search)"
                                value={query}
                                onChange={(e) => {
                                    searchCommittedRef.current = false;
                                    setQuery(e.target.value);
                                }}
                                onKeyDown={handleKeyDown}
                                onFocus={() => {
                                    setIsFocused(true);
                                    if (query.length >= 2 && !searchCommittedRef.current) {
                                        setShowSuggestions(true);
                                        fetchSuggestions(query);
                                    }
                                }}
                                onBlur={() => {
                                    blurTimeoutRef.current = setTimeout(() => {
                                        setShowSuggestions(false);
                                        setIsFocused(false);
                                    }, 300);
                                }}
                            />
                            {!query && (
                                <span className="hidden sm:flex items-center gap-1 text-[10px] text-text-tertiary/60 flex-shrink-0">
                                    <kbd className="px-1.5 py-0.5 bg-bg-tertiary border border-border rounded text-[10px] font-mono">Ctrl</kbd>
                                    <kbd className="px-1.5 py-0.5 bg-bg-tertiary border border-border rounded text-[10px] font-mono">K</kbd>
                                </span>
                            )}
                            {query && (
                                <button
                                    className="flex items-center justify-center p-1 bg-transparent border-none cursor-pointer text-text-tertiary transition-colors hover:text-text-primary"
                                    onClick={() => { searchCommittedRef.current = false; setQuery(''); }}
                                    title="Clear input (press Enter to clear results)"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M18 6L6 18M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Suggestions Dropdown */}
                    {showSuggestions && (
                        <SearchSuggestionsDropdown
                            suggestions={suggestions}
                            query={query}
                            selectedIndex={selectedIndex}
                            onHoverItem={setSelectedIndex}
                            onSearchAll={() => { searchCommittedRef.current = true; setCommittedQuery(query); setShowSuggestions(false); }}
                        />
                    )}
                </div>

                {query && query.length < 3 && !showSuggestions && (
                    <p className="text-xs text-text-tertiary">Type at least 3 characters and press Enter</p>
                )}
                {query && query.length >= 2 && !hasSearched && !showSuggestions && (
                    <p className="text-xs text-text-tertiary">Press Enter to search</p>
                )}
                {committedQuery && hasSearched && !isSearching && (
                    <p className="text-sm text-text-secondary">
                        Found <span className="font-medium text-text-primary">{totalCount.toLocaleString()}</span> results for &ldquo;<span className="font-medium text-text-primary">{committedQuery}</span>&rdquo;
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
                        <button
                            onClick={() => setSelectedPricing('open_source')}
                            className={`px-4 py-2 text-sm rounded-full border transition-all duration-200 ${selectedPricing === 'open_source'
                                ? 'bg-sky-500/20 border-sky-500 text-sky-500'
                                : 'bg-bg-card border-border text-text-secondary hover:border-text-tertiary hover:text-text-primary'
                                }`}
                        >
                            Open Source
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

            {(hasSearched || hasActiveFilters) && (
                <div className="flex flex-wrap gap-3 mb-6 justify-center">
                    <SearchableSelect
                        options={[
                            { value: '', label: 'All Categories' },
                            ...categories
                                .map(cat => ({ value: cat.categoryName, label: cat.categoryName }))
                                .sort((a, b) => a.label.localeCompare(b.label))
                        ]}
                        value={selectedCategory || ''}
                        onChange={(value) => setSelectedCategory(value || null)}
                        placeholder="All Categories"
                        className="min-w-[160px]"
                    />

                    <SearchableSelect
                        options={[
                            { value: '', label: 'All Tasks' },
                            ...tasks
                                .map(task => ({ value: task.taskName, label: task.taskName }))
                                .sort((a, b) => a.label.localeCompare(b.label))
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
                            { value: 'open_source', label: 'Open Source' },
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
            )}

            {/* Search Results */}
            {hasSearched && (
                <div className="mb-12" ref={resultsRef}>
                    {!isSearching && (
                        <p className="text-sm text-text-tertiary mb-4">
                            {totalCount > 0
                                ? <>Showing {((currentPage - 1) * PAGE_SIZE + 1).toLocaleString()}–{Math.min(currentPage * PAGE_SIZE, totalCount).toLocaleString()} of {totalCount.toLocaleString()} tool{totalCount !== 1 ? 's' : ''}{committedQuery && ` for "${committedQuery}"`}</>
                                : <>No tools found{committedQuery && ` for "${committedQuery}"`}</>
                            }
                        </p>
                    )}

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
                                {searchResults.map((tool) => (
                                    <AIToolCard key={tool.id} tool={tool} />
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <nav className="flex items-center justify-center gap-1 mt-8" aria-label="Search results pagination">
                                    <button
                                        onClick={() => goToPage(currentPage - 1)}
                                        disabled={currentPage === 1 || isSearching}
                                        className="px-3 py-2 text-sm rounded-lg border border-border bg-bg-card text-text-secondary hover:border-text-tertiary hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                    >
                                        ← Prev
                                    </button>

                                    {getPageNumbers().map((page, i) =>
                                        page === 'ellipsis' ? (
                                            <span key={`ellipsis-${i}`} className="px-2 text-text-tertiary" aria-hidden="true">…</span>
                                        ) : (
                                            <button
                                                key={page}
                                                onClick={() => goToPage(page)}
                                                disabled={isSearching}
                                                aria-current={page === currentPage ? 'page' : undefined}
                                                className={`w-10 h-10 text-sm rounded-lg border transition-all ${page === currentPage
                                                    ? 'bg-accent-primary border-accent-primary text-white font-semibold'
                                                    : 'border-border bg-bg-card text-text-secondary hover:border-text-tertiary hover:text-text-primary'
                                                    } disabled:cursor-not-allowed`}
                                            >
                                                {page}
                                            </button>
                                        )
                                    )}

                                    <button
                                        onClick={() => goToPage(currentPage + 1)}
                                        disabled={currentPage === totalPages || isSearching}
                                        className="px-3 py-2 text-sm rounded-lg border border-border bg-bg-card text-text-secondary hover:border-text-tertiary hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                    >
                                        Next →
                                    </button>
                                </nav>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
