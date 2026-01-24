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
    const [categories, tools] = await Promise.all([
        getCategories(),
        getPublishedTools(),
    ]);
    const category = categories.find(c => slugify(c.categoryName) === slug);

    if (!category) {
        return {
            title: 'Category Not Found | AiBDE',
            description: 'The requested category could not be found.',
        };
    }

    // Count tools in this category
    const toolCount = tools.filter(t => t.categoryName?.some(c => slugify(c) === slug)).length;
    const title = `${category.categoryName} AI Tools (${toolCount}+) | Best ${category.categoryName} Tools | AiBDE`;
    const description = category.description || `Discover ${toolCount}+ best ${category.categoryName} AI tools. Compare features, pricing, and find the perfect AI solution for your ${category.categoryName.toLowerCase()} needs.`;

    return {
        title,
        description,
        keywords: [
            category.categoryName,
            `${category.categoryName} AI tools`,
            `best ${category.categoryName} tools`,
            `${category.categoryName} software`,
            'AI tools',
            'AiBDE',
        ].join(', '),
        openGraph: {
            title,
            description,
            type: 'website',
            siteName: 'AiBDE',
            url: `https://aibde.tech/category/${slug}`,
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
        },
        alternates: {
            canonical: `https://aibde.tech/category/${slug}`,
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
