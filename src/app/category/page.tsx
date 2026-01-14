import { getPublishedTools, getCategories } from '@/lib/data';
import CategoryPageClient from './CategoryPageClient';

/**
 * Categories Listing Page - Server Component with SSR
 * Fetches all data on the server, hides API calls from network tab
 */
export default async function CategoriesPage() {
    const [tools, categories] = await Promise.all([
        getPublishedTools(),
        getCategories(),
    ]);

    return (
        <CategoryPageClient
            categories={categories}
            tools={tools}
        />
    );
}
