import { Metadata } from 'next';
import { getRecentlyReleasedTools, getToolsCount } from '@/lib/data';
import NewPageClient from './NewPageClient';

export const revalidate = 86400;

/**
 * Dynamic SEO Metadata for New/Just Released Page
 */
export async function generateMetadata(): Promise<Metadata> {
    const toolCount = await getToolsCount(['published', 'approved']);

    const title = `New AI Tools | Latest AI Releases`;
    const description = `Discover the newest AI tools launched recently. Stay ahead with the latest AI innovations in writing, coding, design, marketing, and more. Browse ${toolCount.toLocaleString()}+ tools.`;

    return {
        title,
        description,
        keywords: [
            'new AI tools',
            'latest AI tools',
            'AI tools 2026',
            'new AI releases',
            'recently launched AI',
            'AI software new',
            'BrowseForAI',
        ].join(', '),
        openGraph: {
            title,
            description,
            type: 'website',
            siteName: 'BrowseForAI',
            url: 'https://www.browseforai.com/new',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
        },
        alternates: {
            canonical: 'https://www.browseforai.com/new',
        },
    };
}

/**
 * New/Just Released Page - Optimized
 * Only fetches 100 most recent tools instead of all 10K+
 */
export default async function NewPage() {
    // Fetch only 100 recent tools (not all 10K+)
    const tools = await getRecentlyReleasedTools(100);

    return <NewPageClient tools={tools} />;
}
