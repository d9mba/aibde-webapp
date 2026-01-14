import { Metadata } from 'next';
import { getPublishedTools, getCategories } from '@/lib/data';
import CategoryPageClient from './CategoryPageClient';

export const metadata: Metadata = {
    title: 'Categories | AiBDE',
    description: 'Browse AI tools by category. Find the perfect AI solution organized by use case - from writing and coding to image generation and more.',
    openGraph: {
        title: 'Categories | AiBDE',
        description: 'Browse AI tools by category. Find the perfect AI solution organized by use case.',
        type: 'website',
    },
};

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
