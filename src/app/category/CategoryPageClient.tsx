'use client';

import Link from 'next/link';
import { Category } from '@/types';
import { slugify } from '@/lib/utils';
import { useMemo, useState, useEffect } from 'react';
import Pagination from '@/components/ui/Pagination';

interface CategoryPageClientProps {
    categories: Category[];
    totalCount: number;
}

const ITEMS_PER_PAGE = 48;

export default function CategoryPageClient({ categories, totalCount }: CategoryPageClientProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [activeLetter, setActiveLetter] = useState<string>('');

    // Sort categories alphabetically, dedupe by id, and filter those with tools
    const sortedCategories = useMemo(() => {
        const byId = new Map<string, Category>();
        categories.forEach((cat) => {
            if ((cat.count || 0) > 0 && !byId.has(cat.id)) {
                byId.set(cat.id, cat);
            }
        });
        return Array.from(byId.values()).sort((a, b) => a.categoryName.localeCompare(b.categoryName));
    }, [categories]);

    const totalPages = Math.ceil(sortedCategories.length / ITEMS_PER_PAGE);

    // Get paginated categories
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedCategories = sortedCategories.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    // Group paginated categories by first letter
    const groupedCategories = useMemo(() => {
        const groups: { [key: string]: Category[] } = {};
        paginatedCategories.forEach(category => {
            const firstLetter = (category.categoryName?.charAt(0) || '?').toUpperCase();
            if (!groups[firstLetter]) {
                groups[firstLetter] = [];
            }
            groups[firstLetter].push(category);
        });
        return groups;
    }, [paginatedCategories]);

    // All available letters (from all categories, not just current page)
    const allLetters = useMemo(() => {
        const letters = new Set<string>();
        sortedCategories.forEach(cat => {
            letters.add((cat.categoryName?.charAt(0) || '?').toUpperCase());
        });
        return Array.from(letters).sort();
    }, [sortedCategories]);

    const sortedLetters = Object.keys(groupedCategories).sort();

    // Track active letter based on scroll position
    useEffect(() => {
        let ticking = false;

        function handleScroll() {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const sections = sortedLetters.map(letter => ({
                        letter,
                        element: document.getElementById(`section-${letter}`)
                    })).filter(s => s.element);

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

                    if (sections.length > 0) {
                        setActiveLetter(sections[0].letter);
                    }
                    ticking = false;
                });
                ticking = true;
            }
        }

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, [sortedLetters]);

    // Scroll to letter — find which page has that letter and navigate there
    function scrollToLetter(letter: string) {
        // Find the index of the first category starting with this letter
        const idx = sortedCategories.findIndex(
            cat => (cat.categoryName?.charAt(0) || '?').toUpperCase() === letter
        );
        if (idx === -1) return;

        const targetPage = Math.floor(idx / ITEMS_PER_PAGE) + 1;

        if (targetPage !== currentPage) {
            setCurrentPage(targetPage);
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
    }

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

            <div className="flex gap-2 sm:gap-4">
                {/* Main Content - left on mobile, right on desktop */}
                <div className="order-1 lg:order-2 flex-1 min-w-0 space-y-6">
                    {sortedLetters.map(letter => (
                        <div key={letter} id={`section-${letter}`}>
                            <h2 className="text-lg font-bold text-text-primary mb-3 pb-2 border-b border-border">{letter}</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                {groupedCategories[letter].map((category, idx) => (
                                    <Link
                                        key={`${letter}-${category.id}-${idx}`}
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

                    {/* Pagination */}
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>

                {/* Alphabet bar - right on mobile (sticky), left on desktop */}
                <div className="order-2 lg:order-1 flex flex-col items-center gap-0.5 sticky top-20 max-h-[calc(100vh-120px)] overflow-y-auto py-1.5 px-1 bg-bg-secondary/50 border border-border rounded-lg flex-shrink-0">
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
