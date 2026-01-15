'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Search } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useAdminData } from '@/context/AdminContext';
import { useSearch } from '@/context/SearchContext';
import { useTypingPlaceholder } from '@/hooks/useTypingPlaceholder';
import { useDebounce } from '@/hooks/useDebounce';

export default function TopHeader() {
    const router = useRouter();
    const pathname = usePathname();
    const adminData = useAdminData();
    const { searchQuery, setSearchQuery, isMainSearchFocused } = useSearch();
    const [showHeaderSearch, setShowHeaderSearch] = useState(false);
    const [showRecommendations, setShowRecommendations] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const searchRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const typingPlaceholder = useTypingPlaceholder();

    const tools = adminData?.getPublishedTools() || [];

    // Debounce search query for recommendations
    const debouncedQuery = useDebounce(searchQuery, 300);

    // Filter recommendations based on debounced search query
    const recommendations = debouncedQuery.trim().length >= 1
        ? tools
            .filter(tool =>
                tool.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
                tool.description?.toLowerCase().includes(debouncedQuery.toLowerCase())
            )
            .slice(0, 6)
        : [];

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
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            // Ctrl+K or Cmd+K
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                inputRef.current?.focus();
                setShowRecommendations(true);
            }
        };
        document.addEventListener('keydown', handleGlobalKeyDown);
        return () => document.removeEventListener('keydown', handleGlobalKeyDown);
    }, []);

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

        const maxIndex = recommendations.length; // Last index is "Search for..." option

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => prev < maxIndex ? prev + 1 : 0);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => prev > 0 ? prev - 1 : maxIndex);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedIndex >= 0 && selectedIndex < recommendations.length) {
                // Selected a tool
                router.push(`/app/${recommendations[selectedIndex].slug}`);
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
    const handleToolClick = (slug: string) => {
        router.push(`/app/${slug}`);
        setShowRecommendations(false);
        setSearchQuery('');
    };

    return (
        <header className="sticky top-0 z-[100] bg-bg-primary/95 backdrop-blur-sm border-b border-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between h-14 sm:h-16 gap-4">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 no-underline flex-shrink-0">
                        <span className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight font-orbitron">
                            aibde
                        </span>
                    </Link>

                    {/* Search Bar - Google Style */}
                    <div
                        ref={searchRef}
                        className={cn(
                            "relative flex-1 max-w-xl transition-all duration-300 py-1 z-[200]",
                            showHeaderSearch ? "opacity-100" : "opacity-0 pointer-events-none"
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
                                    <Search size={18} strokeWidth={1.5} className={cn("flex-shrink-0 transition-colors", isFocused ? "text-accent-primary" : "text-text-tertiary")} />
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
                                        }}
                                        onBlur={() => {
                                            // Delay to allow click on dropdown items
                                            setTimeout(() => setIsFocused(false), 150);
                                        }}
                                        onKeyDown={handleKeyDown}
                                        autoComplete="off"
                                        placeholder={typingPlaceholder || 'Search AI tools...'}
                                        className="flex-1 border-none outline-none bg-transparent text-sm text-text-primary placeholder:text-text-tertiary/50"
                                        suppressHydrationWarning
                                    />
                                    {searchQuery && (
                                        <button
                                            type="button"
                                            onClick={() => setSearchQuery('')}
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
                                {recommendations.map((tool, index) => (
                                    <button
                                        key={tool.id}
                                        onClick={() => handleToolClick(tool.slug)}
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
                                                className="w-7 h-7 rounded-md object-cover flex-shrink-0"
                                            />
                                        ) : (
                                            <div className="w-7 h-7 rounded-md bg-accent-primary/20 flex items-center justify-center flex-shrink-0">
                                                <span className="text-xs font-semibold text-accent-primary">
                                                    {tool.name[0]}
                                                </span>
                                            </div>
                                        )}
                                        <span className="text-sm text-text-primary truncate">
                                            {tool.name}
                                        </span>
                                    </button>
                                ))}
                                {/* Search for option - always show when there's a query */}
                                <button
                                    onClick={(e) => { e.preventDefault(); handleSearch(e as unknown as React.FormEvent); }}
                                    className={cn(
                                        "flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors border-t border-border",
                                        selectedIndex === recommendations.length
                                            ? "bg-bg-secondary"
                                            : "hover:bg-bg-secondary"
                                    )}
                                    onMouseEnter={() => setSelectedIndex(recommendations.length)}
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
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Mobile search icon when header search is hidden */}
                        {!showHeaderSearch && (
                            <Link
                                href="/search"
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
