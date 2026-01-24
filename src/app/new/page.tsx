import { Metadata } from 'next';
import { getPublishedTools } from '@/lib/data';
import NewPageClient from './NewPageClient';

/**
 * Dynamic SEO Metadata for New/Just Released Page
 */
export async function generateMetadata(): Promise<Metadata> {
    const tools = await getPublishedTools();

    // Count tools released in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newToolsCount = tools.filter(t => {
        const releaseDate = new Date(t.releasedAt || t.createdAt || 0);
        return releaseDate >= thirtyDaysAgo;
    }).length;

    const title = `New AI Tools (${newToolsCount}+ This Month) | Latest AI Releases | AiBDE`;
    const description = `Discover ${newToolsCount}+ newly released AI tools this month. Stay ahead with the latest AI innovations in writing, coding, design, marketing, and more.`;

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
 * New/Just Released Page - Server Component with SSR
 * Fetches all data on the server, hides API calls from network tab
 */
export default async function NewPage() {
    const tools = await getPublishedTools();

    return <NewPageClient tools={tools} />;
}
