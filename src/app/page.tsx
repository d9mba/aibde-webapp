/**
 * Homepage - Server Component
 * 
 * Fetches data on the server and passes to client component.
 * This ensures data fetching is invisible to the browser.
 */

import { getPublishedTools, getSpotlightTools, getCategories, getTasks, getHomeSettings } from '@/lib/data';
import HomePageClient from './HomePageClient';

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
