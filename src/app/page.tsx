/**
 * Homepage - Server Component (ISR)
 * 
 * Fetches data on the server and passes to client component.
 * Revalidates every 5 minutes for fresh content without per-request DB hits.
 */

import { Metadata } from 'next';
import { getPublishedTools, getSpotlightTools, getCategories, getTasks, getHomeSettings } from '@/lib/data';
import HomePageClient from './HomePageClient';

// PERFORMANCE: ISR - regenerate page every 5 minutes
export const revalidate = 300;

// Generate dynamic metadata with tool count
export async function generateMetadata(): Promise<Metadata> {
    const tools = await getPublishedTools();
    const toolCount = tools.length;

    return {
        title: `AiBDE - Browse, Discover, and Explore ${toolCount}+ Top AI Tools`,
        description: `Browse, discover, and explore ${toolCount}+ top AI tools for your everyday tasks. Find the best AI solutions for writing, design, coding, and more.`,
        openGraph: {
            title: `AiBDE - Browse, Discover, and Explore ${toolCount}+ top AI tools for your everyday tasks.`,
            description: `Browse, discover, and explore ${toolCount}+ top AI tools for your everyday tasks.`,
            type: 'website',
        },
    };
}

export default async function HomePage() {
    // Fetch all data on the server - this is invisible to the browser
    const [publishedTools, spotlightTools, categories, tasks, settings] = await Promise.all([
        getPublishedTools(),
        getSpotlightTools(),
        getCategories(),
        getTasks(),
        getHomeSettings(),
    ]);

    // Pass server-fetched data to client component
    return (
        <HomePageClient
            initialTools={publishedTools}
            initialSpotlightTools={spotlightTools}
            initialCategories={categories}
            initialTasks={tasks}
            initialSettings={settings}
        />
    );
}
