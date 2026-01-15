'use client';

import Link from 'next/link';
import { AdminTool, Category } from '@/types';
import { Folder, ChevronRight } from 'lucide-react';

interface CategoryPageClientProps {
    categories: Category[];
    tools: AdminTool[];
}

export default function CategoryPageClient({ categories, tools }: CategoryPageClientProps) {
    const slugify = (str: string) => str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    return (
        <div className="max-w-[1200px] mx-auto px-3 sm:px-6 py-4 sm:py-10">
            {/* Hero Section */}
            <section className="text-center py-6 sm:py-8 mb-6 sm:mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-accent-primary/10 text-accent-primary mb-4">
                    <Folder className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">Browse by Category</h1>
                <p className="text-sm sm:text-base text-text-secondary max-w-md mx-auto">Explore {categories.length} categories with AI tools for every need</p>
            </section>

            {/* Categories Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {categories.map((category) => {
                    const count = tools.filter(t => (t.categoryName || []).includes(category.categoryName)).length;
                    return (
                        <Link
                            key={category.categoryName}
                            href={`/category/${slugify(category.categoryName)}`}
                            prefetch={false}
                            className="group p-4 sm:p-5 bg-bg-card border border-border rounded-xl no-underline transition-all duration-200 hover:border-accent-primary/50 hover:shadow-lg hover:shadow-accent-primary/5 active:scale-[0.98]"
                        >
                            <div className="flex items-start gap-3">
                                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-accent-primary/10 flex items-center justify-center text-accent-primary flex-shrink-0 group-hover:bg-accent-primary group-hover:text-white transition-colors">
                                    <Folder className="w-4 h-4 sm:w-5 sm:h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm sm:text-base font-semibold text-text-primary mb-0.5 sm:mb-1 group-hover:text-accent-primary transition-colors truncate">{category.categoryName}</h3>
                                    <p className="text-xs sm:text-sm text-text-tertiary line-clamp-2">{category.description || 'No description'}</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-text-tertiary group-hover:text-accent-primary group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
                            </div>
                            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                                <span className="text-xs text-text-tertiary">{count} tool{count !== 1 ? 's' : ''}</span>
                                <span className="text-xs text-accent-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">Explore →</span>
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* Empty State */}
            {categories.length === 0 && (
                <div className="text-center py-12">
                    <Folder className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
                    <p className="text-text-tertiary">No categories found</p>
                </div>
            )}
        </div>
    );
}
