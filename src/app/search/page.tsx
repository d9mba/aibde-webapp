import { Suspense } from 'react';
import { Metadata } from 'next';
import { getPublishedTools, getCategories, getTasks } from '@/lib/data';
import SearchPageClient from './SearchPageClient';

// Generate dynamic metadata with tool count
export async function generateMetadata(): Promise<Metadata> {
    const tools = await getPublishedTools();
    const toolCount = tools.length;

    const title = `Search ${toolCount}+ AI Tools | Find the Best AI for Any Task | AiBDE`;
    const description = `Search and discover ${toolCount}+ AI tools for writing, coding, design, marketing, and more. Filter by category, task, or pricing to find your perfect AI solution.`;

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
 * Search Page - Server Component with SSR
 * Fetches all data on the server, hides API calls from network tab
 */
export default async function SearchPage() {
    // Fetch all data on the server
    const [tools, categories, tasks] = await Promise.all([
        getPublishedTools(),
        getCategories(),
        getTasks(),
    ]);

    return (
        <Suspense fallback={<div className="max-w-[1200px] mx-auto px-4 py-10 text-center text-text-secondary">Loading...</div>}>
            <SearchPageClient
                tools={tools}
                categories={categories}
                tasks={tasks}
            />
        </Suspense>
    );
}
