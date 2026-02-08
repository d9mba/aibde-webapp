import { Metadata } from 'next';
import { getCategories, getCategoriesCount } from '@/lib/data';
import { SEO } from '@/lib/seo';
import CategoryPageClient from './CategoryPageClient';

/**
 * Dynamic SEO Metadata for Categories Page
 */
export async function generateMetadata(): Promise<Metadata> {
    const categoryCount = await getCategoriesCount();

    const title = `Browse ${categoryCount}+ AI Categories | AI Tools Directory | AiBDE`;
    const description = `Explore ${categoryCount}+ categories of AI tools including chatbots, image generators, writing assistants, code tools, video editors, and more. Find the best AI for any use case.`;

    return {
        title,
        description,
        keywords: [
            'AI categories',
            'AI tools directory',
            'AI chatbots',
            'AI image generator',
            'AI writing tools',
            'AI code assistant',
            'AI video tools',
            'best AI tools',
        ].join(', '),
        openGraph: {
            title,
            description,
            type: 'website',
            siteName: SEO.siteName,
            url: `${SEO.siteUrl}/category`,
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
        },
        alternates: {
            canonical: `${SEO.siteUrl}/category`,
        },
        robots: { index: true, follow: true },
    };
}

/**
 * Categories Listing Page - Server Component with SSR
 * Fetches categories and count from database
 */
export default async function CategoriesPage() {
    const [categories, totalCount] = await Promise.all([
        getCategories(),
        getCategoriesCount()
    ]);

    return (
        <CategoryPageClient categories={categories} totalCount={totalCount} />
    );
}
