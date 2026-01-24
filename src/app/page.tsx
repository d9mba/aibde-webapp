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
    const [tools, categories, tasks] = await Promise.all([
        getPublishedTools(),
        getCategories(),
        getTasks(),
    ]);
    const toolCount = tools.length;
    const categoryCount = categories.length;
    const taskCount = tasks.length;

    const title = `AiBDE - Browse, Discover, and Explore ${toolCount}+ Top AI Tools`;
    const description = `Discover ${toolCount}+ AI tools across ${categoryCount} categories for ${taskCount}+ tasks. Find the best AI solutions for writing, design, coding, marketing, and more. Updated daily.`;

    return {
        title,
        description,
        keywords: [
            'AI tools',
            'AI tools directory',
            'best AI tools',
            'AI tools 2025',
            'free AI tools',
            'AI software',
            'artificial intelligence tools',
            'AI for productivity',
            'AI for writing',
            'AI for coding',
            'AI image generator',
            'ChatGPT alternatives',
            'AiBDE',
        ].join(', '),
        openGraph: {
            title,
            description,
            type: 'website',
            siteName: 'AiBDE',
            url: 'https://aibde.tech',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
        },
        alternates: {
            canonical: 'https://aibde.tech',
        },
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
                'max-video-preview': -1,
                'max-image-preview': 'large',
                'max-snippet': -1,
            },
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
