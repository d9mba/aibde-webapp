import { Metadata } from 'next';
import { getTrendingTools, getToolsCount } from '@/lib/data';
import TrendingPageClient from './TrendingPageClient';

/**
 * Dynamic SEO Metadata for Trending Page
 */
export async function generateMetadata(): Promise<Metadata> {
    const toolCount = await getToolsCount(['published', 'approved']);

    const title = `Trending AI Tools | Most Popular AI Tools Today | AiBDE`;
    const description = `Discover the most popular and trending AI tools right now. See what ${toolCount.toLocaleString()}+ AI tools are getting the most attention for writing, coding, design, and more.`;

    return {
        title,
        description,
        keywords: [
            'trending AI tools',
            'popular AI tools',
            'best AI tools',
            'top AI tools',
            'AI tools ranking',
            'most used AI tools',
            'viral AI tools',
            'AiBDE',
        ].join(', '),
        openGraph: {
            title,
            description,
            type: 'website',
            siteName: 'AiBDE',
            url: 'https://aibde.tech/trending',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
        },
        alternates: {
            canonical: 'https://aibde.tech/trending',
        },
    };
}

/**
 * Trending Page - Server Component with SSR
 * Only loads top 100 trending tools instead of all 10K+
 */
export default async function TrendingPage() {
    const tools = await getTrendingTools(100); // Only top 100 trending

    return <TrendingPageClient tools={tools} />;
}

