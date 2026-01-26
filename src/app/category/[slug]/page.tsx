import { Metadata } from 'next';
import { getCategories, getToolsByCategory, getToolsCountByCategory } from '@/lib/data';
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

    // Get count efficiently (not loading all tools)
    const toolCount = await getToolsCountByCategory(category.categoryName);
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
 * Category Detail Page - Optimized with pagination
 * Initially loads 100 tools, more loaded on demand
 */
export default async function CategoryPage({ params }: PageProps) {
    const { slug } = await params;
    const categories = await getCategories();

    // Find category by matching against slugified version of category name
    const category = categories.find(c => slugify(c.categoryName) === slug) || null;

    // Fetch initial tools and total count
    const [tools, totalCount] = await Promise.all([
        category ? getToolsByCategory(category.categoryName, 100) : Promise.resolve([]),
        category ? getToolsCountByCategory(category.categoryName) : Promise.resolve(0)
    ]);

    return (
        <CategorySlugPageClient
            category={category}
            tools={tools}
            allCategories={categories}
            slug={slug}
            totalCount={totalCount}
        />
    );
}
