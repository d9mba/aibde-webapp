/**
 * Homepage - Server Component (ISR)
 * 
 * Optimized: Uses count queries instead of loading all 10K+ tools
 * Revalidates every 5 minutes for fresh content without per-request DB hits.
 */

import { Metadata } from 'next';
import {
    getToolsCount,
    getCategoriesCount,
    getTasksCount,
    getRecentlyReleasedTools,
    getSpotlightTools,
    getTrendingTools,
    getCategories,
    getTasks,
    getHomeSettings
} from '@/lib/data';
import { SEO } from '@/lib/seo';
import HomePageClient from './HomePageClient';

// PERFORMANCE: ISR - regenerate page every 5 minutes
export const revalidate = 86400;

// Generate dynamic metadata with tool count
export async function generateMetadata(): Promise<Metadata> {
    const [toolCount, categoryCount, taskCount] = await Promise.all([
        getToolsCount(['published', 'approved']),
        getCategoriesCount(),
        getTasksCount(),
    ]);

    const title = `AiBDE - Browse, Discover, and Explore. Top AI Tools For Your Everyday Tasks`;
    const description = `Discover ${toolCount.toLocaleString()}+ AI tools across ${categoryCount} categories for ${taskCount}+ tasks. Find the best AI solutions for writing, design, coding, marketing, and more. Updated daily.`;

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
            siteName: SEO.siteName,
            url: SEO.siteUrl,
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
        },
        alternates: {
            canonical: SEO.siteUrl,
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
    // OPTIMIZED: Fetch only what's needed - counts + limited tools
    const [toolCount, categoryCount, taskCount, recentTools, spotlightTools, trendingTools, categories, tasks, settings] = await Promise.all([
        getToolsCount(['published', 'approved']),
        getCategoriesCount(),
        getTasksCount(),
        getRecentlyReleasedTools(90), // Fetch 90 tools to support Load More up to max
        getSpotlightTools(),
        getTrendingTools(50), // Fetch top 50 trending tools
        getCategories(),
        getTasks(),
        getHomeSettings(),
    ]);

    // Pass minimal data to client component
    return (
        <HomePageClient
            toolCount={toolCount}
            categoryCount={categoryCount}
            taskCount={taskCount}
            recentTools={recentTools}
            trendingTools={trendingTools}
            spotlightTools={spotlightTools}
            categories={categories}
            tasks={tasks}
            settings={settings}
        />
    );
}
