import { Metadata } from 'next';
import { getPublishedTools, getCategories } from '@/lib/data';
import CategorySlugPageClient from './CategorySlugPageClient';

// PERFORMANCE: ISR - regenerate page every 5 minutes
export const revalidate = 300;
interface PageProps {
    params: Promise<{ slug: string }>;
}

// Helper to slugify category name
const slugify = (str: string) => str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const categories = await getCategories();
    const category = categories.find(c => slugify(c.categoryName) === slug);

    if (!category) {
        return {
            title: 'Category Not Found | AiBDE',
            description: 'The requested category could not be found.',
        };
    }

    const description = category.description || `Explore the best AI tools for ${category.categoryName}. Find ${category.count || 'top'} tools in this category.`;

    return {
        title: `${category.categoryName} | Categories | AiBDE`,
        description,
        keywords: [category.categoryName, 'AI tools', 'AiBDE', 'artificial intelligence'].join(', '),
        openGraph: {
            title: `${category.categoryName} | Categories | AiBDE`,
            description,
            type: 'website',
        },
    };
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
