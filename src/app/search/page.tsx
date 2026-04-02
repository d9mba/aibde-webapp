import { Metadata } from 'next';
import { getToolsCount, getCategoriesCount, getTasksCount, getCategories, getTasks } from '@/lib/data';
import { SEO } from '@/lib/seo';
import SearchPageClient from './SearchPageClient';

// Generate dynamic metadata with tool count (uses fast count query)
export async function generateMetadata(): Promise<Metadata> {
    const toolCount = await getToolsCount(['published', 'approved']);

    const title = 'Search AI Tools | Find the Best AI for Any Task';
    const description = `Search and discover ${toolCount.toLocaleString()}+ AI tools for writing, coding, design, marketing, and more. Filter by category, task, or pricing to find your perfect AI solution.`;

    return {
        title,
        description,
        keywords: [
            'search AI tools',
            'find AI tools',
            'AI tool finder',
            'best AI tools',
            'AI search engine',
            'compare AI tools',
            'AI tools comparison',
            'AiBDE search',
        ].join(', '),
        openGraph: {
            title,
            description,
            type: 'website',
            siteName: SEO.siteName,
            url: `${SEO.siteUrl}/search`,
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
        },
        alternates: {
            canonical: `${SEO.siteUrl}/search`,
        },
        robots: {
            index: true,
            follow: true,
        },
    };
}

/**
 * Search Page - Optimized Server Component
 * Fetches categories, tasks for filters - tools load on search
 */
interface SearchPageProps {
    searchParams: Promise<{ q?: string; category?: string; task?: string; pricing?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
    const [resolvedParams, categories, tasks, toolCount, categoryCount, taskCount] = await Promise.all([
        searchParams,
        getCategories(),
        getTasks(),
        getToolsCount(['published', 'approved']),
        getCategoriesCount(),
        getTasksCount(),
    ]);

    return (
        <SearchPageClient
            categories={categories}
            tasks={tasks}
            toolCount={toolCount}
            taskCount={taskCount}
            categoryCount={categoryCount}
            initialQuery={resolvedParams.q || ''}
            initialCategory={resolvedParams.category || null}
            initialTask={resolvedParams.task || null}
            initialPricing={resolvedParams.pricing || null}
        />
    );
}
