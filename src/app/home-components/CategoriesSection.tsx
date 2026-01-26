import Link from 'next/link';
import { Category } from '@/types';

interface CategoriesSectionProps {
    categories: Category[];
    categoryCount: number; // Total count from DB
    showCategories: boolean;
}

export default function CategoriesSection({ categories, categoryCount, showCategories }: CategoriesSectionProps) {
    if (!showCategories) return null;

    const slugify = (str: string) => str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    // Filter categories with tools and sort by count (top 8 by most tools)
    const topCategories = categories
        .filter(cat => (cat.count || 0) > 0)
        .sort((a, b) => (b.count || 0) - (a.count || 0))
        .slice(0, 8);

    if (topCategories.length === 0) return null;

    return (
        <section className="flex flex-col gap-2 sm:gap-4">
            <div className="flex justify-between items-center">
                <h2 className="text-base font-semibold text-text-primary m-0 tracking-tight">Browse by Category</h2>
                <Link href="/category" prefetch={false} className="text-[0.8125rem] text-text-tertiary transition-colors duration-fast hover:text-accent-primary">View all</Link>
            </div>
            <p className="text-[0.75rem] sm:text-[0.8125rem] text-text-secondary -mt-1 sm:-mt-2 hidden sm:block">Explore {categoryCount} categories with AI tools</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {topCategories.map((category) => (
                    <Link
                        key={category.categoryName}
                        href={`/category/${slugify(category.categoryName)}`}
                        prefetch={false}
                        className="flex flex-col gap-0.5 px-3 py-2.5 sm:px-4 sm:py-3.5 bg-bg-card border border-border rounded-lg no-underline transition-all duration-fast hover:border-text-tertiary"
                    >
                        <span className="text-[0.75rem] sm:text-[0.8125rem] font-medium text-text-primary">{category.categoryName}</span>
                        <span className="text-[0.625rem] sm:text-[0.6875rem] text-text-tertiary">{category.count || 0} tools</span>
                    </Link>
                ))}
            </div>
        </section>
    );
}
