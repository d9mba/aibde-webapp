import { Suspense } from 'react';
import { Metadata } from 'next';
import { getPublishedTools, getCategories, getTasks } from '@/lib/data';
import SearchPageClient from './SearchPageClient';

// Generate dynamic metadata with tool count
export async function generateMetadata(): Promise<Metadata> {
    const tools = await getPublishedTools();
    const toolCount = tools.length;

    return {
        title: `Search ${toolCount}+ Tools | AiBDE`,
        description: `Search and discover ${toolCount}+ AI tools for your everyday needs.`,
        openGraph: {
            title: `Search ${toolCount}+ Tools | AiBDE`,
            description: `Search and discover ${toolCount}+ AI tools for your everyday needs.`,
            type: 'website',
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
