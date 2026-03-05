'use client';

import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import AIToolCard from '@/components/features/tools/ToolCard';
import Pagination from '@/components/ui/Pagination';
import { AdminTool, Category } from '@/types';
import { slugify } from '@/lib/utils';
import { Folder, ArrowLeft, ChevronRight } from 'lucide-react';

interface CategorySlugPageClientProps {
    category: Category | null;
    tools: AdminTool[];
    allCategories: Category[];
    slug: string;
    totalCount: number;
}

const ITEMS_PER_PAGE = 48;

export default function CategorySlugPageClient({
    category,
    tools: initialTools,
    allCategories,
    slug,
    totalCount
}: CategorySlugPageClientProps) {
    const [tools, setTools] = useState<AdminTool[]>(initialTools);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const pageFetchControllerRef = useRef<AbortController | null>(null);

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const endIndex = Math.min(currentPage * ITEMS_PER_PAGE, totalCount);

    // Fetch a specific page of tools
    const goToPage = useCallback(async (page: number) => {
        if (!category) return;

        // Page 1 uses SSR data
        if (page === 1) {
            pageFetchControllerRef.current?.abort();
            pageFetchControllerRef.current = null;
            setTools(initialTools);
            setCurrentPage(1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        // Abort any previous in-flight request
        pageFetchControllerRef.current?.abort();
        const controller = new AbortController();
        pageFetchControllerRef.current = controller;

        setIsLoading(true);
        setFetchError(null);
        try {
            const offset = (page - 1) * ITEMS_PER_PAGE;
            const response = await fetch(
                `/api/tools/by-category?category=${encodeURIComponent(category.categoryName)}&offset=${offset}&limit=${ITEMS_PER_PAGE}`,
                { signal: controller.signal }
            );
            if (!response.ok) {
                const text = await response.text().catch(() => response.statusText);
                const msg = `Failed to load tools (${response.status}): ${text}`;
                console.error(msg);
                setFetchError(msg);
                return;
            }
            const data = await response.json();
            setTools(data.tools || []);
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') return;
            const msg = error instanceof Error ? error.message : 'Failed to load tools';
            console.error('Failed to load tools:', error);
            setFetchError(msg);
        } finally {
            setIsLoading(false);
        }
    }, [category, initialTools]);

    if (!category) {
        return (
            <div className="max-w-[1200px] mx-auto px-3 sm:px-6 py-4 sm:py-10">
                <div className="text-center py-16">
                    <div className="w-16 h-16 rounded-2xl bg-bg-tertiary flex items-center justify-center mx-auto mb-4">
                        <Folder className="w-8 h-8 text-text-tertiary" />
                    </div>
                    <h1 className="text-2xl font-bold text-text-primary mb-2">Category not found</h1>
                    <p className="text-text-secondary mb-4">The category you&apos;re looking for doesn&apos;t exist.</p>
                    <Link href="/category" prefetch={false} className="inline-flex items-center gap-1.5 text-accent-primary hover:underline">
                        <ArrowLeft className="w-4 h-4" /> Browse all categories
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1200px] mx-auto px-3 sm:px-6 py-4 sm:py-8">
            {/* Back Link */}
            <Link href="/category" prefetch={false} className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-accent-primary mb-4 no-underline">
                <ArrowLeft className="w-4 h-4" /> Back to Categories
            </Link>

            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-accent-primary/10 text-accent-primary flex items-center justify-center flex-shrink-0">
                        <Folder className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-text-primary">{category.categoryName}</h1>
                        <p className="text-sm text-text-secondary">{totalCount} AI tool{totalCount !== 1 ? 's' : ''}</p>
                    </div>
                </div>
                {category.description && (
                    <p className="text-sm text-text-tertiary mt-2">{category.description}</p>
                )}
            </div>

            {/* Showing count */}
            {totalCount > 0 && totalPages > 1 && !isLoading && (
                <p className="text-sm text-text-tertiary mb-4">
                    Showing {startIndex}–{endIndex} of {totalCount.toLocaleString()} tools
                </p>
            )}

            {/* Fetch error banner */}
            {fetchError && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {fetchError}
                </div>
            )}

            {/* Tools Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4">
                {isLoading ? (
                    <div className="col-span-full flex items-center justify-center py-16">
                        <span className="w-6 h-6 border-2 border-border border-t-accent-primary rounded-full animate-spin" />
                    </div>
                ) : tools.length > 0 ? (
                    tools.map((tool) => (
                        <AIToolCard key={tool.id} tool={tool} />
                    ))
                ) : (
                    <div className="col-span-full text-center py-12 bg-bg-card border border-border rounded-xl">
                        <Folder className="w-10 h-10 text-text-tertiary mx-auto mb-3" />
                        <p className="text-text-secondary mb-2">No tools in this category yet.</p>
                        <Link href="/category" prefetch={false} className="text-accent-primary hover:underline text-sm">Browse other categories</Link>
                    </div>
                )}
            </div>

            {/* Pagination */}
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={goToPage}
            />

            {/* Other Categories Section */}
            <section className="border-t border-border pt-6 sm:pt-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-text-primary">Other Categories</h2>
                    <Link href="/category" prefetch={false} className="text-sm text-text-tertiary hover:text-accent-primary no-underline flex items-center gap-1">
                        View all <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>
                <div className="flex flex-wrap gap-2">
                    {allCategories
                        .filter((c) => slugify(c.categoryName) !== slug)
                        .slice(0, 8)
                        .map((cat) => (
                            <Link
                                key={cat.id}
                                href={`/category/${slugify(cat.categoryName)}`}
                                prefetch={false}
                                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-bg-card border border-border rounded-full text-xs sm:text-sm text-text-secondary no-underline transition-all duration-200 hover:border-accent-primary hover:text-accent-primary hover:bg-accent-primary/5"
                            >
                                {cat.categoryName}
                            </Link>
                        ))}
                </div>
            </section>
        </div>
    );
}
