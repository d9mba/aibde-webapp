import { Metadata } from 'next';
import { getPublishedTools, getCategories } from '@/lib/data';
import CategoryPageClient from './CategoryPageClient';

/**
 * Dynamic SEO Metadata for Categories Page
 */
export async function generateMetadata(): Promise<Metadata> {
    const categories = await getCategories();
    const categoryCount = categories.length;

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
            ...categories.slice(0, 10).map(c => c.categoryName),
        ].join(', '),
        openGraph: {
            title,
            description,
            type: 'website',
            siteName: 'AiBDE',
            url: 'https://aibde.tech/category',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
        },
        alternates: {
            canonical: 'https://aibde.tech/category',
        },
    };
}

/**
 * Categories Listing Page - Server Component with SSR
 * Fetches all data on the server, hides API calls from network tab
 */
export default async function CategoriesPage() {
    const [tools, categories] = await Promise.all([
        getPublishedTools(),
        getCategories(),
    ]);

    return (
        <CategoryPageClient
            categories={categories}
            tools={tools}
        />
    );
}
