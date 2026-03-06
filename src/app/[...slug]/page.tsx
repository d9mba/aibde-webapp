import { redirect } from 'next/navigation';

interface PageProps {
    params: Promise<{ slug: string[] }>;
}

/**
 * Catch-All Route
 *
 * Any unknown page route like /gemini redirects to /search?q=gemini
 */
export default async function CatchAllPage({ params }: PageProps) {
    const { slug } = await params;
    if (!slug || slug.length === 0) redirect('/');
    const searchQuery = slug.join(' ');
    redirect(`/search?q=${encodeURIComponent(searchQuery)}`);
}
