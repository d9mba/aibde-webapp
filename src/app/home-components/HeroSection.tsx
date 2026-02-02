'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearch } from '@/context/SearchContext';
import { useTypingPlaceholder } from '@/hooks/useTypingPlaceholder';
import { AdminTool } from '@/types';
import SearchSuggestionsDropdown from '@/components/ui/SearchSuggestionsDropdown';

interface HeroSectionProps {
    toolCount: number;
    categoryCount: number;
    taskCount: number;
}

export default function HeroSection({ toolCount, categoryCount, taskCount }: HeroSectionProps) {
    const { searchQuery, setSearchQuery, isMainSearchFocused, setIsMainSearchFocused } = useSearch();
    const typingPlaceholder = useTypingPlaceholder();
    const inputRef = useRef<HTMLInputElement>(null);

    // API-based search suggestions
    const [suggestions, setSuggestions] = useState<AdminTool[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const searchTimeout = useRef<NodeJS.Timeout>();

    // Fetch suggestions using Server Action (hidden from Network tab)
    const fetchSuggestions = useCallback(async (query: string) => {
        if (!query || query.length < 2) {
            setSuggestions([]);
            return;
        }

        try {
            const { getSearchSuggestionsAction } = await import('@/lib/actions');
            const tools = await getSearchSuggestionsAction(query, 5);
            setSuggestions(tools);
        } catch (error) {
            console.error('Search suggestions failed:', error);
        }
    }, []);

    // Debounced search
    useEffect(() => {
        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        if (searchQuery.length >= 2) {
            searchTimeout.current = setTimeout(() => {
                fetchSuggestions(searchQuery);
            }, 200);
        } else {
            setSuggestions([]);
        }

        return () => {
            if (searchTimeout.current) {
                clearTimeout(searchTimeout.current);
            }
        };
    }, [searchQuery, fetchSuggestions]);

    // Reset selected index when suggestions change
    useEffect(() => {
        setSelectedIndex(-1);
    }, [suggestions]);

    // Ctrl+K keyboard shortcut to focus hero search (only when at top of page)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Only handle if TopHeader search is not visible (scrolled less than 200px)
            if ((e.ctrlKey || e.metaKey) && e.key === 'k' && window.scrollY < 200) {
                e.preventDefault();
                e.stopPropagation();
                inputRef.current?.focus();
                setIsMainSearchFocused(true);
            }
        };
        document.addEventListener('keydown', handleKeyDown, true); // Use capture phase
        return () => document.removeEventListener('keydown', handleKeyDown, true);
    }, [setIsMainSearchFocused]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        const maxIndex = suggestions.length; // Last index is "Search for..." option

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => prev < maxIndex ? prev + 1 : 0);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => prev > 0 ? prev - 1 : maxIndex);
        } else if (e.key === 'Enter') {
            if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
                window.location.href = `/app/${suggestions[selectedIndex].app_username}`;
            } else if (searchQuery.trim()) {
                window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
            }
        } else if (e.key === 'Escape') {
            setSearchQuery('');
            setSuggestions([]);
        }
    };

    const showSuggestions = isMainSearchFocused && (suggestions.length > 0 || searchQuery.length >= 2);

    return (
        <section className="text-center flex flex-col items-center gap-4 py-8">
            <h1 className="font-orbitron text-5xl sm:text-6xl font-bold text-text-primary tracking-wider lowercase m-0">
                aibde
            </h1>
            <p className="font-orbitron text-text-secondary text-sm sm:text-base -mt-2 tracking-wide">Browse, Discover, Explore</p>
            <p className="text-text-tertiary text-xs sm:text-sm -mt-2">
                <Link href="/search" prefetch={false}><span className="text-text-primary font-semibold">{toolCount.toLocaleString()}</span> AI tools</Link> for <Link href="/tasks" prefetch={false}><span className="text-text-primary font-semibold">{taskCount}</span> tasks</Link> and <Link href="/category" prefetch={false}><span className="text-text-primary font-semibold">{categoryCount}</span> categories</Link>
            </p>
            <div className="relative w-full max-w-[500px] mt-1 py-1 z-50">
                {/* Search Input */}
                <div className={`bg-bg-card border rounded-full transition-all duration-200 ${isMainSearchFocused ? 'border-accent-primary/50 shadow-[0_0_0_3px_rgba(52,178,123,0.25)]' : 'border-border shadow-lg hover:shadow-xl hover:border-text-tertiary'}`}>
                    <div className="flex items-center gap-3 w-full px-5 py-3.5">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`flex-shrink-0 transition-colors ${isMainSearchFocused ? 'text-text-secondary' : 'text-text-tertiary'}`}>
                            <circle cx="11" cy="11" r="8" />
                            <path d="M21 21l-4.35-4.35" />
                        </svg>
                        <input
                            ref={inputRef}
                            type="text"
                            autoComplete="off"
                            className="flex-1 border-none outline-none bg-transparent text-base font-medium text-text-primary placeholder:text-text-tertiary/50"
                            placeholder={typingPlaceholder || 'Search AI tools...'}
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setSelectedIndex(-1);
                            }}
                            onFocus={() => {
                                setIsMainSearchFocused(true);
                                // Fetch suggestions immediately if there's already a query
                                if (searchQuery.length >= 2) {
                                    fetchSuggestions(searchQuery);
                                }
                            }}
                            onBlur={() => setTimeout(() => setIsMainSearchFocused(false), 300)}
                            onKeyDown={handleKeyDown}
                            suppressHydrationWarning
                        />
                        {!searchQuery && (
                            <span className="hidden sm:flex items-center gap-1 text-[10px] text-text-tertiary/60 flex-shrink-0">
                                <kbd className="px-1.5 py-0.5 bg-bg-tertiary border border-border rounded text-[10px] font-mono">Ctrl</kbd>
                                <kbd className="px-1.5 py-0.5 bg-bg-tertiary border border-border rounded text-[10px] font-mono">K</kbd>
                            </span>
                        )}
                        {searchQuery && (
                            <button
                                className="flex items-center justify-center p-1 bg-transparent border-none cursor-pointer text-text-tertiary transition-colors hover:text-text-primary"
                                onClick={() => {
                                    setSearchQuery('');
                                    setSuggestions([]);
                                }}
                                suppressHydrationWarning
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* Search Suggestions Dropdown */}
                {showSuggestions && (
                    <SearchSuggestionsDropdown
                        suggestions={suggestions}
                        query={searchQuery}
                        selectedIndex={selectedIndex}
                        onHoverItem={setSelectedIndex}
                    />
                )}
            </div>

            {/* Tagline */}
            <div className="mt-3">
                <p className="text-xs sm:text-sm text-text-secondary">
                    🚀 <span className="text-text-primary font-medium">Your #1 destination</span> for discovering the best AI tools, updated daily for <span className="text-text-primary font-medium">Real Humans</span>
                </p>
            </div>

            {/* Quick Filter Capsules */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                <Link
                    href="/search?pricing=free"
                    prefetch={false}
                    className="group inline-flex items-center gap-1.5 px-4 py-1.5 bg-bg-tertiary hover:bg-border border border-border rounded-full text-sm font-medium text-text-secondary hover:text-text-primary transition-all hover:scale-105"
                >
                    Free
                </Link>
                <Link
                    href="/search?pricing=freemium"
                    prefetch={false}
                    className="group inline-flex items-center gap-1.5 px-4 py-1.5 bg-bg-tertiary hover:bg-border border border-border rounded-full text-sm font-medium text-text-secondary hover:text-text-primary transition-all hover:scale-105"
                >
                    Freemium
                </Link>
                <Link
                    href="/tasks"
                    prefetch={false}
                    className="group inline-flex items-center gap-1.5 px-4 py-1.5 bg-bg-tertiary hover:bg-border border border-border rounded-full text-sm font-medium text-text-secondary hover:text-text-primary transition-all hover:scale-105"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-70">
                        <path d="M9 11l3 3L22 4" />
                        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                    </svg>
                    Browse by Task
                </Link>
                <Link
                    href="/category"
                    prefetch={false}
                    className="group inline-flex items-center gap-1.5 px-4 py-1.5 bg-bg-tertiary hover:bg-border border border-border rounded-full text-sm font-medium text-text-secondary hover:text-text-primary transition-all hover:scale-105"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-70">
                        <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                    </svg>
                    Browse by Category
                </Link>
            </div>
        </section>
    );
}
