'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useSearch } from '@/context/SearchContext';
import { useTypingPlaceholder } from '@/hooks/useTypingPlaceholder';
import { useDebounce } from '@/hooks/useDebounce';
import { quickSearchTools } from '@/lib/search';
import { AdminTool } from '@/types';

// CDN URL helper
const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || '';
const getFullUrl = (path: string): string => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${CDN_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

interface HeroSectionProps {
    allTools: AdminTool[];
    categoryCount?: number;
    taskCount?: number;
}

export default function HeroSection({ allTools, categoryCount = 0, taskCount = 0 }: HeroSectionProps) {
    const { searchQuery, setSearchQuery, isMainSearchFocused, setIsMainSearchFocused } = useSearch();
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const typingPlaceholder = useTypingPlaceholder();
    const debouncedSearchQuery = useDebounce(searchQuery, 150);
    const inputRef = useRef<HTMLInputElement>(null);

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

    const searchResults = useMemo(() => {
        if (debouncedSearchQuery.length === 0) return [];
        return quickSearchTools(allTools, debouncedSearchQuery, 6);
    }, [allTools, debouncedSearchQuery]);

    return (
        <section className="text-center flex flex-col items-center gap-4 py-8">
            <h1 className="font-orbitron text-5xl sm:text-6xl font-bold text-text-primary tracking-wider lowercase m-0">
                aibde
            </h1>
            <p className="font-orbitron text-text-secondary text-sm sm:text-base -mt-2 tracking-wide">Browse, Discover, Explore</p>
            <p className="text-text-tertiary text-xs sm:text-sm -mt-2">
                <Link href="/search" prefetch={false}><span className="text-text-primary font-semibold">{allTools.length.toLocaleString()}</span> AI tools</Link> for <Link href="/tasks" prefetch={false}><span className="text-text-primary font-semibold">{taskCount}</span> tasks</Link> and <Link href="/category" prefetch={false}><span className="text-text-primary font-semibold">{categoryCount}</span> categories</Link>
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
                            onFocus={() => setIsMainSearchFocused(true)}
                            onBlur={() => setTimeout(() => setIsMainSearchFocused(false), 150)}
                            onKeyDown={(e) => {
                                const results = searchResults.slice(0, 5);
                                const maxIndex = results.length;
                                if (e.key === 'ArrowDown') {
                                    e.preventDefault();
                                    setSelectedIndex(prev => prev < maxIndex ? prev + 1 : prev);
                                } else if (e.key === 'ArrowUp') {
                                    e.preventDefault();
                                    setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
                                } else if (e.key === 'Enter') {
                                    if (selectedIndex >= 0 && selectedIndex < results.length && results[selectedIndex]) {
                                        window.location.href = `/app/${results[selectedIndex].slug}`;
                                    } else if (searchQuery.trim()) {
                                        window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
                                    }
                                } else if (e.key === 'Escape') {
                                    setSearchQuery('');
                                    setSelectedIndex(-1);
                                }
                            }}
                            suppressHydrationWarning
                        />
                        {searchQuery && (
                            <button
                                className="flex items-center justify-center p-1 bg-transparent border-none cursor-pointer text-text-tertiary transition-colors hover:text-text-primary"
                                onClick={() => setSearchQuery('')}
                                suppressHydrationWarning
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* Search Dropdown */}
                {searchQuery && isMainSearchFocused && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-bg-card border border-border rounded-xl shadow-xl overflow-hidden z-[100]">
                        {searchResults.slice(0, 5).map((tool, index) => {
                            const logoUrl = tool.logoUrl ? getFullUrl(tool.logoUrl) : '';
                            return (
                                <div
                                    key={tool.id}
                                    className={`flex items-center gap-3 px-5 py-2.5 cursor-pointer transition-colors ${index === selectedIndex ? 'bg-bg-secondary' : 'hover:bg-bg-secondary'}`}
                                    onClick={() => window.location.href = `/app/${tool.slug}`}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                >
                                    {logoUrl ? (
                                        <img src={logoUrl} alt={tool.name} className="w-7 h-7 rounded-md object-cover flex-shrink-0" />
                                    ) : (
                                        <div className="w-7 h-7 rounded-md bg-accent-primary/20 flex items-center justify-center flex-shrink-0">
                                            <span className="text-xs font-semibold text-accent-primary">{tool.name.charAt(0)}</span>
                                        </div>
                                    )}
                                    <span className="text-sm text-text-primary truncate">{tool.name}</span>
                                </div>
                            );
                        })}
                        <div
                            className={`flex items-center gap-3 px-5 py-2.5 cursor-pointer transition-colors border-t border-border ${selectedIndex === searchResults.slice(0, 5).length ? 'bg-bg-secondary' : 'hover:bg-bg-secondary'}`}
                            onClick={() => window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`}
                            onMouseEnter={() => setSelectedIndex(searchResults.slice(0, 5).length)}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-tertiary flex-shrink-0">
                                <circle cx="11" cy="11" r="8" />
                                <path d="M21 21l-4.35-4.35" />
                            </svg>
                            <span className="text-sm text-text-secondary">
                                Search for <span className="font-medium text-text-primary">&quot;{searchQuery}&quot;</span>...
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
