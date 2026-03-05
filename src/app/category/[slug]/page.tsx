import { Metadata } from 'next';
import { getCategories, getToolsByCategory, getToolsCountByCategory } from '@/lib/data';
import { getBreadcrumbJsonLd, getItemListJsonLd, safeJsonLdStringify, SEO } from '@/lib/seo';
import { slugify } from '@/lib/utils';
import CategorySlugPageClient from './CategorySlugPageClient';

// PERFORMANCE: ISR - regenerate page every 24 hours
export const revalidate = 86400;
interface PageProps {
    params: Promise<{ slug: string }>;
}

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
    const title = `${category.categoryName} AI Tools | AiBDE`;
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
            siteName: SEO.siteName,
            url: `${SEO.siteUrl}/category/${slug}`,
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
        },
        alternates: {
            canonical: `${SEO.siteUrl}/category/${slug}`,
        },
        robots: { index: true, follow: true },
    };
}

/**
 * Category Detail Page - Optimized with pagination
 * Initially loads 48 tools, more loaded on demand
 */
export default async function CategoryPage({ params }: PageProps) {
    const { slug } = await params;
    const categories = await getCategories();

    // Find category by matching against slugified version of category name
    const category = categories.find(c => slugify(c.categoryName) === slug) || null;

    // Fetch initial tools (1 page) and total count
    const [tools, totalCount] = await Promise.all([
        category ? getToolsByCategory(category.categoryName, 48) : Promise.resolve([]),
        category ? getToolsCountByCategory(category.categoryName) : Promise.resolve(0)
    ]);

    const categoryUrl = category ? `${SEO.siteUrl}/category/${slug}` : '';
    const breadcrumbLd = category ? getBreadcrumbJsonLd([{ name: 'Home', url: SEO.siteUrl }, { name: category.categoryName, url: categoryUrl }]) : null;
    const itemListLd = category && tools.length ? getItemListJsonLd(
        `${category.categoryName} AI Tools`,
        categoryUrl,
        tools.slice(0, 10).map(t => ({ name: t.name, url: `${SEO.siteUrl}/app/${t.app_username}` })),
        category.description || undefined
    ) : null;

    return (
        <>
            {breadcrumbLd && (
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(breadcrumbLd) }} />
            )}
            {itemListLd && (
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(itemListLd) }} />
            )}
            <CategorySlugPageClient
                category={category}
                tools={tools}
                allCategories={categories}
                slug={slug}
                totalCount={totalCount}
            />
        </>
    );
}
