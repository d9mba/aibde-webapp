'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import AIToolCard from '@/components/features/tools/ToolCard';
import { AdminTool, Category } from '@/types';
import { Folder, ArrowLeft, ChevronRight } from 'lucide-react';
import { useSearch } from '@/context/SearchContext';

interface CategorySlugPageClientProps {
    category: Category | null;
    tools: AdminTool[];
    allCategories: Category[];
    slug: string;
}

export default function CategorySlugPageClient({
    category,
    tools,
    allCategories,
    slug
}: CategorySlugPageClientProps) {
    const { setSharedTools } = useSearch();
    const slugify = (str: string) => str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    // Set sharedTools for search recommendations in header
    useEffect(() => {
        if (tools.length > 0) {
            setSharedTools(tools);
        }
    }, [tools, setSharedTools]);

    // Get tools in this category
    const categoryTools = category
        ? tools.filter(t => (t.categoryName || []).includes(category.categoryName))
        : [];

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

            {/* Header - Compact */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-accent-primary/10 text-accent-primary flex items-center justify-center flex-shrink-0">
                        <Folder className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-text-primary">{category.categoryName}</h1>
                        <p className="text-sm text-text-secondary">{categoryTools.length} AI tool{categoryTools.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>
                {category.description && (
                    <p className="text-sm text-text-tertiary mt-2">{category.description}</p>
                )}
            </div>

            {/* Tools Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-12">
                {categoryTools.length > 0 ? (
                    categoryTools.map((tool) => (
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
                                key={cat.categoryName}
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
