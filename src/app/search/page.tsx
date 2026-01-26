import { Suspense } from 'react';
import { Metadata } from 'next';
import { getToolsCount, getCategoriesCount, getTasksCount, getCategories, getTasks, getSpotlightTools } from '@/lib/data';
import SearchPageClient from './SearchPageClient';

// Generate dynamic metadata with tool count (uses fast count query)
export async function generateMetadata(): Promise<Metadata> {
    const toolCount = await getToolsCount(['published', 'approved']);

    const title = `Search ${toolCount.toLocaleString()}+ AI Tools | Find the Best AI for Any Task | AiBDE`;
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
            siteName: 'AiBDE',
            url: 'https://aibde.tech/search',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
        },
        alternates: {
            canonical: 'https://aibde.tech/search',
        },
    };
}

/**
 * Search Page - Optimized Server Component
 * Fetches initial 100 tools + categories, tasks for filters
 * Full search uses API calls on demand
 */
export default async function SearchPage() {
    // Fetch metadata and counts (same as main page) - no initial tools
    const [categories, tasks, spotlightTools, toolCount, categoryCount, taskCount] = await Promise.all([
        getCategories(),
        getTasks(),
        getSpotlightTools(),
        getToolsCount(['published', 'approved']),
        getCategoriesCount(),
        getTasksCount(),
    ]);

    return (
        <Suspense fallback={<div className="max-w-[1200px] mx-auto px-4 py-10 text-center text-text-secondary">Loading...</div>}>
            <SearchPageClient
                categories={categories}
                tasks={tasks}
                spotlightTools={spotlightTools}
                toolCount={toolCount}
                taskCount={taskCount}
                categoryCount={categoryCount}
            />
        </Suspense>
    );
}
