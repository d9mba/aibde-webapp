'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Search } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useSearch } from '@/context/SearchContext';
import { useTypingPlaceholder } from '@/hooks/useTypingPlaceholder';
import { trackToolClick } from '@/hooks/useToolAnalytics';
import { getSearchSuggestionsAction } from '@/lib/actions';
import { AdminTool } from '@/types';
import { ToolBadge } from '@/components/icons/ToolBadge';
import InstallButton from '@/components/layout/InstallButton';

export default function TopHeader() {
    const router = useRouter();
    const pathname = usePathname();
    const { searchQuery, setSearchQuery, isMainSearchFocused } = useSearch();
    const [showHeaderSearch, setShowHeaderSearch] = useState(false);
    const [showRecommendations, setShowRecommendations] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const searchRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const typingPlaceholder = useTypingPlaceholder();

    // API-based search suggestions
    const [suggestions, setSuggestions] = useState<AdminTool[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const abortRef = useRef<AbortController | null>(null);

    // Fetch suggestions using Server Action (hidden from Network tab)
    const fetchSuggestions = useCallback(async (query: string) => {
        if (!query || query.length < 2) {
            setSuggestions([]);
            return;
        }

        setIsLoading(true);
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        try {
            // NOTE: getSearchSuggestionsAction is a Server Action (RPC), not a fetch
            // request — it cannot accept an AbortSignal. The controller is only used
            // to discard stale results via signal.aborted checks below.
            const tools = await getSearchSuggestionsAction(query, 6);
            if (!controller.signal.aborted) {
                setSuggestions(tools);
            }
        } catch (error) {
            if (!controller.signal.aborted) {
                console.error('Search suggestions failed:', error);
            }
        } finally {
            if (!controller.signal.aborted) {
                setIsLoading(false);
            }
        }
    }, []);

    // Debounced search
    useEffect(() => {
        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        if (searchQuery.length >= 2 && showRecommendations && !isMainSearchFocused) {
            searchTimeout.current = setTimeout(() => {
                fetchSuggestions(searchQuery);
            }, 350);
        } else {
            setSuggestions([]);
        }

        return () => {
            if (searchTimeout.current) {
                clearTimeout(searchTimeout.current);
            }
        };
    }, [searchQuery, showRecommendations, fetchSuggestions]);

    // Reset selected index when suggestions change
    useEffect(() => {
        setSelectedIndex(-1);
    }, [suggestions]);

    // Pages that have their own search bar
    const pagesWithSearch = ['/', '/search'];
    const hasPageSearchBar = pagesWithSearch.includes(pathname);

    // Handle scroll to show/hide header search on pages with their own search
    const handleScroll = useCallback(() => {
        if (!hasPageSearchBar) {
            setShowHeaderSearch(true);
            return;
        }

        // Show header search when scrolled past ~200px (typical search bar position)
        const scrollThreshold = 200;
        setShowHeaderSearch(window.scrollY > scrollThreshold);
    }, [hasPageSearchBar]);

    useEffect(() => {
        // On pages without their own search bar, always show header search
        if (!hasPageSearchBar) {
            setShowHeaderSearch(true);
            return;
        }

        // Initial check
        handleScroll();

        // Listen for scroll events
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [hasPageSearchBar, handleScroll]);

    // Close recommendations when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowRecommendations(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Global keyboard shortcut: Ctrl+K or Cmd+K to focus search
    // Only handle when TopHeader search is visible
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            // Ctrl+K or Cmd+K — only fire if TopHeader search is actually shown
            if ((e.ctrlKey || e.metaKey) && e.key === 'k' && showHeaderSearch) {
                e.preventDefault();
                e.stopPropagation();
                inputRef.current?.focus();
                setIsFocused(true);
                setShowRecommendations(true);
            }
        };
        // Use capture phase to ensure header has a chance to catch it
        document.addEventListener('keydown', handleGlobalKeyDown, true);
        return () => document.removeEventListener('keydown', handleGlobalKeyDown, true);
    }, [showHeaderSearch]);

    // Handle search submission
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setShowRecommendations(false);
        }
    };

    // Handle keyboard navigation - include "Search for..." option as last index
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showRecommendations || !searchQuery.trim()) return;

        const maxIndex = suggestions.length; // Last index is "Search for..." option

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => prev < maxIndex ? prev + 1 : 0);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => prev > 0 ? prev - 1 : maxIndex);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
                // Selected a tool - track the click
                const tool = suggestions[selectedIndex];
                trackToolClick({ id: tool.id, name: tool.name, appUsername: tool.appUsername, category: (tool.categoryName || [])[0], pricing: tool.pricing }, 'search');
                router.push(`/app/${tool.appUsername}`);
                setShowRecommendations(false);
                setSearchQuery('');
            } else {
                // Selected "Search for..." or no selection - go to search page
                router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                setShowRecommendations(false);
            }
        } else if (e.key === 'Escape') {
            setShowRecommendations(false);
        }
    };

    // Handle tool click
    const handleToolClick = (appUsername: string, tool: AdminTool) => {
        trackToolClick({ id: tool.id, name: tool.name, appUsername: tool.appUsername, category: (tool.categoryName || [])[0], pricing: tool.pricing }, 'search');
        router.push(`/app/${appUsername}`);
        setShowRecommendations(false);
        setSearchQuery('');
    };

    return (
        <header className="sticky top-0 z-[100] bg-bg-primary/95 backdrop-blur-sm border-b border-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between h-14 sm:h-16 gap-4">
                    {/* Logo */}
                    <Link href="/" prefetch={false} className="flex items-center gap-2 sm:gap-2.5 no-underline flex-shrink-0 group" aria-label="browseforai">
                        <span className="flex items-center justify-center w-8 h-8 sm:w-8.5 sm:h-8.5 flex-shrink-0">
                            <img src="/logo-trimmed.png" alt="browseforai logo" className="w-full h-full object-contain" />
                        </span>
                        <span className="text-xl sm:text-2xl font-brand font-extrabold text-text-primary tracking-normal lowercase">
                            browsefor<span className="text-accent-primary uppercase">ai</span>
                        </span>
                    </Link>

                    {/* Search Bar - Google Style */}
                    <div
                        ref={searchRef}
                        className={cn(
                            "relative max-w-xl transition-all duration-300 py-1 z-[200]",
                            showHeaderSearch
                                ? "flex-1 opacity-100"
                                : "w-0 opacity-0 pointer-events-none overflow-hidden"
                        )}
                    >
                        {/* Search Input */}
                        <div className={cn(
                            "bg-bg-card border transition-all duration-200 rounded-full",
                            isFocused
                                ? "shadow-[0_0_0_3px_rgba(52,178,123,0.25)] border-emerald-500"
                                : "border-border shadow-lg hover:shadow-xl"
                        )}>
                            <form onSubmit={handleSearch} className="w-full">
                                <div className="flex items-center gap-3 px-4 py-2.5">
                                    {isLoading ? (
                                        <span className="w-[18px] h-[18px] border-2 border-border border-t-accent-primary rounded-full animate-spin flex-shrink-0" role="status" aria-label="Loading"><span className="sr-only">Loading…</span></span>
                                    ) : (
                                        <Search size={18} strokeWidth={1.5} className={cn("flex-shrink-0 transition-colors", isFocused ? "text-accent-primary" : "text-text-tertiary")} />
                                    )}
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            setShowRecommendations(true);
                                            setSelectedIndex(-1);
                                        }}
                                        onFocus={() => {
                                            setIsFocused(true);
                                            setShowRecommendations(true);
                                            // Fetch suggestions immediately if there's already a query
                                            if (searchQuery.length >= 2) {
                                                fetchSuggestions(searchQuery);
                                            }
                                        }}
                                        onBlur={() => {
                                            // Longer delay for mobile touch handling
                                            setTimeout(() => setIsFocused(false), 300);
                                        }}
                                        onKeyDown={handleKeyDown}
                                        autoComplete="off"
                                        placeholder={typingPlaceholder || 'Search AI tools...'}
                                        className="flex-1 border-none outline-none bg-transparent text-sm text-text-primary placeholder:text-text-tertiary/50 focus:shadow-none"
                                        suppressHydrationWarning
                                    />
                                    {!searchQuery && (
                                        <span className="hidden sm:flex items-center gap-1 text-[10px] text-text-tertiary/60 flex-shrink-0">
                                            <kbd className="px-1 py-0.5 bg-bg-tertiary border border-border rounded text-[10px] font-mono">Ctrl</kbd>
                                            <kbd className="px-1 py-0.5 bg-bg-tertiary border border-border rounded text-[10px] font-mono">K</kbd>
                                        </span>
                                    )}
                                    {searchQuery && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSearchQuery('');
                                                setSuggestions([]);
                                            }}
                                            className="flex items-center justify-center p-1 text-text-tertiary hover:text-text-primary transition-colors"
                                            suppressHydrationWarning
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M18 6L6 18M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>

                        {/* Recommendations Dropdown - Absolute positioned below */}
                        {searchQuery && showHeaderSearch && showRecommendations && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
                                {suggestions.map((tool, index) => (
                                    <button
                                        key={tool.id}
                                        onClick={() => handleToolClick(tool.appUsername, tool)}
                                        className={cn(
                                            "flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors",
                                            index === selectedIndex
                                                ? "bg-bg-secondary"
                                                : "hover:bg-bg-secondary"
                                        )}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                        suppressHydrationWarning
                                    >
                                        {tool.logoUrl ? (
                                            <img
                                                src={tool.logoUrl}
                                                alt=""
                                                className="w-7 h-7 rounded-md object-contain flex-shrink-0"
                                            />
                                        ) : (
                                            <div className="w-7 h-7 rounded-md bg-accent-primary/20 flex items-center justify-center flex-shrink-0">
                                                <span className="text-xs font-semibold text-accent-primary">
                                                    {tool.name[0]}
                                                </span>
                                            </div>
                                        )}
                                        <span className="text-sm text-text-primary truncate flex items-center gap-1">
                                            {tool.name}
                                            <ToolBadge listingType={tool.listingType} spotlightEnabled={tool.spotlightEnabled} isFeatured={tool.isFeatured} />
                                        </span>
                                    </button>
                                ))}
                                {/* Search for option - always show when there's a query */}
                                <button
                                    onClick={(e) => { e.preventDefault(); handleSearch(e as unknown as React.FormEvent); }}
                                    className={cn(
                                        "flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors border-t border-border",
                                        selectedIndex === suggestions.length
                                            ? "bg-bg-secondary"
                                            : "hover:bg-bg-secondary"
                                    )}
                                    onMouseEnter={() => setSelectedIndex(suggestions.length)}
                                    suppressHydrationWarning
                                >
                                    <Search size={18} className="text-text-tertiary flex-shrink-0" />
                                    <span className="text-sm text-text-secondary">
                                        Search for <span className="font-medium text-text-primary">&quot;{searchQuery}&quot;</span>...
                                    </span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
                        <InstallButton />
                        {/* Mobile search icon when header search is hidden */}
                        {!showHeaderSearch && (
                            <Link
                                href="/search"
                                prefetch={false}
                                className="flex items-center justify-center w-10 h-10 text-text-secondary hover:text-text-primary rounded-full hover:bg-bg-secondary transition-colors"
                            >
                                <Search size={20} strokeWidth={1.5} />
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
