import { getPublishedTools } from '@/lib/data';
import TrendingPageClient from './TrendingPageClient';

/**
 * Trending Page - Server Component with SSR
 * Fetches all data on the server, hides API calls from network tab
 */
export default async function TrendingPage() {
    const tools = await getPublishedTools();

    return <TrendingPageClient tools={tools} />;
}
