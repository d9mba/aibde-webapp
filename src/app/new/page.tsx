import { getPublishedTools } from '@/lib/data';
import NewPageClient from './NewPageClient';

/**
 * New/Just Released Page - Server Component with SSR
 * Fetches all data on the server, hides API calls from network tab
 */
export default async function NewPage() {
    const tools = await getPublishedTools();

    return <NewPageClient tools={tools} />;
}
