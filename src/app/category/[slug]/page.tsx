import { getPublishedTools, getCategories } from '@/lib/data';
import CategorySlugPageClient from './CategorySlugPageClient';

interface PageProps {
    params: Promise<{ slug: string }>;
}

/**
 * Category Detail Page - Server Component with SSR
 * Fetches all data on the server, hides API calls from network tab
 */
export default async function CategoryPage({ params }: PageProps) {
    const { slug } = await params;

    const [tools, categories] = await Promise.all([
        getPublishedTools(),
        getCategories(),
    ]);

    // Helper to slugify category name for comparison
    const slugify = (str: string) => str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    // Find category by matching against slugified version of category name
    const category = categories.find(c => slugify(c.categoryName) === slug) || null;

    return (
        <CategorySlugPageClient
            category={category}
            tools={tools}
            allCategories={categories}
            slug={slug}
        />
    );
}
