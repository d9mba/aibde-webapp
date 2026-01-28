import { Metadata } from 'next';
import { getRecentlyReleasedTools, getToolsCount } from '@/lib/data';
import NewPageClient from './NewPageClient';

/**
 * Dynamic SEO Metadata for New/Just Released Page
 */
export async function generateMetadata(): Promise<Metadata> {
    const toolCount = await getToolsCount(['published', 'approved']);

    const title = `New AI Tools | Latest AI Releases | AiBDE`;
    const description = `Discover the newest AI tools launched recently. Stay ahead with the latest AI innovations in writing, coding, design, marketing, and more. Browse ${toolCount.toLocaleString()}+ tools.`;

    return {
        title,
        description,
        keywords: [
            'new AI tools',
            'latest AI tools',
            'AI tools 2025',
            'new AI releases',
            'recently launched AI',
            'AI software new',
            'AiBDE',
        ].join(', '),
        openGraph: {
            title,
            description,
            type: 'website',
            siteName: 'AiBDE',
            url: 'https://aibde.tech/new',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
        },
        alternates: {
            canonical: 'https://aibde.tech/new',
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
