import { redirect } from 'next/navigation';

interface PageProps {
    params: Promise<{ slug: string[] }>;
}

/**
 * Catch-All Route
 * 
 * Any unknown route like /anything will redirect to /search?q=anything
 * This provides a better UX than showing a 404 error
 */
export default async function CatchAllPage({ params }: PageProps) {
    const { slug } = await params;

    // Join the slug parts into a search query
    const searchQuery = slug.join(' ');

    // Redirect to search with the query
    redirect(`/search?q=${encodeURIComponent(searchQuery)}`);
}
