'use client';

import Link from 'next/link';
import { Category } from '@/types';
import { useMemo, useState, useEffect, useRef, useCallback } from 'react';

interface CategoryPageClientProps {
    categories: Category[];
    totalCount: number;
}

const ITEMS_PER_LOAD = 50;

/**
 * Render a categorized, alphabetically grouped category page with infinite loading and letter-based navigation.
 *
 * Displays a hero section with total count, an alphabet sidebar for quick navigation, and letter sections containing category cards that link to each category page. Supports incremental loading as the user scrolls and scrolling-to-letter behavior that expands the list when a target letter is not yet visible.
 *
 * @param categories - Array of category objects; categories with a tool count of zero are excluded from the listing.
 * @param totalCount - Total number of categories (used for display in the hero and footer).
 * @returns The React element for the category page UI.
 */
export default function CategoryPageClient({ categories, totalCount }: CategoryPageClientProps) {
    const slugify = (str: string) => str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);
    const [activeLetter, setActiveLetter] = useState<string>('');
    const loadMoreRef = useRef<HTMLDivElement>(null);

    // Sort categories alphabetically and filter those with tools
    const sortedCategories = useMemo(() => {
        return categories
            .filter(cat => (cat.count || 0) > 0)
            .sort((a, b) => a.categoryName.localeCompare(b.categoryName));
    }, [categories]);

    // Get visible categories
    const visibleCategories = sortedCategories.slice(0, visibleCount);
    const hasMore = visibleCount < sortedCategories.length;

    // Group visible categories by first letter
    const groupedCategories = useMemo(() => {
        const groups: { [key: string]: Category[] } = {};

        visibleCategories.forEach(category => {
            const firstLetter = category.categoryName[0].toUpperCase();
            if (!groups[firstLetter]) {
                groups[firstLetter] = [];
            }
            groups[firstLetter].push(category);
        });

        return groups;
    }, [visibleCategories]);

    // All available letters (from all categories, not just visible)
    const allLetters = useMemo(() => {
        const letters = new Set<string>();
        sortedCategories.forEach(cat => {
            letters.add(cat.categoryName[0].toUpperCase());
        });
        return Array.from(letters).sort();
    }, [sortedCategories]);

    const sortedLetters = Object.keys(groupedCategories).sort();

    // Track active letter based on scroll position (debounced to prevent jitter)
    useEffect(() => {
        let ticking = false;

        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const sections = sortedLetters.map(letter => ({
                        letter,
                        element: document.getElementById(`section-${letter}`)
                    })).filter(s => s.element);

                    // Find which section is currently in view
                    for (let i = sections.length - 1; i >= 0; i--) {
                        const { letter, element } = sections[i];
                        if (element) {
                            const rect = element.getBoundingClientRect();
                            if (rect.top <= 150) {
                                setActiveLetter(letter);
                                ticking = false;
                                return;
                            }
                        }
                    }

                    // Default to first letter if none in view
                    if (sections.length > 0) {
                        setActiveLetter(sections[0].letter);
                    }
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll(); // Initial check
        return () => window.removeEventListener('scroll', handleScroll);
    }, [sortedLetters]);

    // Scroll to letter section
    const scrollToLetter = (letter: string) => {
        // First, load all categories if clicking on a letter not yet visible
        if (!groupedCategories[letter]) {
            setVisibleCount(sortedCategories.length);
            // Wait for render then scroll
            setTimeout(() => {
                const element = document.getElementById(`section-${letter}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
        } else {
            const element = document.getElementById(`section-${letter}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    };

    // Infinite scroll - load more when reaching bottom
    const loadMore = useCallback(() => {
        if (hasMore) {
            setVisibleCount(prev => Math.min(prev + ITEMS_PER_LOAD, sortedCategories.length));
        }
    }, [hasMore, sortedCategories.length]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore) {
                    loadMore();
                }
            },
            { threshold: 0.1 }
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => observer.disconnect();
    }, [hasMore, loadMore]);

    return (
        <div className="max-w-[1200px] mx-auto px-3 sm:px-6 py-4 sm:py-10">
            {/* Hero Section */}
            <section className="text-center py-6 sm:py-8 mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">Browse by Category</h1>
                <p className="text-sm sm:text-base text-text-secondary max-w-lg mx-auto mb-2">
                    Discover the best AI tools across {totalCount.toLocaleString()} categories. Find the perfect AI solution for your needs.
                </p>
                <p className="text-xs sm:text-sm text-text-tertiary max-w-lg mx-auto">
                    💡 Pro tip: Use the search bar above to quickly find specific tools or categories.
                </p>
            </section>

            <div className="flex gap-4">
                {/* Alphabet Sidebar - Fixed on desktop */}
                <div className="hidden lg:flex flex-col items-center gap-0 sticky top-20 max-h-[calc(100vh-120px)] overflow-y-auto py-1 px-0.5 bg-bg-secondary/50 border border-border rounded-lg">
                    {allLetters.map(letter => (
                        <button
                            key={letter}
                            onClick={() => scrollToLetter(letter)}
                            className={`w-7 h-7 flex items-center justify-center text-xs font-medium rounded transition-colors ${activeLetter === letter
                                ? 'bg-accent-primary text-white'
                                : groupedCategories[letter]
                                    ? 'text-text-primary hover:bg-accent-primary/10 hover:text-accent-primary'
                                    : 'text-text-tertiary hover:bg-bg-secondary'
                                }`}
                        >
                            {letter}
                        </button>
                    ))}
                </div>

                {/* Main Content */}
                <div className="flex-1 space-y-6">
                    {sortedLetters.map(letter => (
                        <div key={letter} id={`section-${letter}`}>
                            <h2 className="text-lg font-bold text-text-primary mb-3 pb-2 border-b border-border">{letter}</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                {groupedCategories[letter].map((category) => (
                                    <Link
                                        key={category.categoryName}
                                        href={`/category/${slugify(category.categoryName)}`}
                                        prefetch={false}
                                        className="flex flex-col gap-0.5 px-3 py-2.5 bg-bg-card border border-border rounded-lg no-underline transition-all duration-200 hover:border-accent-primary/50 hover:bg-bg-secondary"
                                    >
                                        <span className="text-sm font-medium text-text-primary truncate">{category.categoryName}</span>
                                        <span className="text-xs text-text-tertiary">{category.count || 0} tools</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Loading indicator / Load more trigger */}
                    <div ref={loadMoreRef} className="py-8 text-center">
                        {hasMore ? (
                            <div className="flex items-center justify-center gap-2 text-text-tertiary">
                                <span className="w-5 h-5 border-2 border-border border-t-accent-primary rounded-full animate-spin"></span>
                                <span className="text-sm">Loading more categories...</span>
                            </div>
                        ) : sortedCategories.length > 0 ? (
                            <p className="text-sm text-text-tertiary">Showing all {totalCount.toLocaleString()} categories</p>
                        ) : null}
                    </div>
                </div>
            </div>

            {/* Empty State */}
            {categories.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-text-tertiary">No categories found</p>
                </div>
            )}
        </div>
    );
}