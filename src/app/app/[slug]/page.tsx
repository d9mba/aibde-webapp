import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getToolByAppUsername, getRelatedTools, getSuggestedTools, getFeaturedTools, getRecentlyAddedTools, getCategories, getTasks, getHomeSettings } from '@/lib/data';
import ToolDetailClient from './ToolDetailClient';

// PERFORMANCE: ISR - regenerate page every 5 minutes
export const revalidate = 300;
/**
 * Builds metadata for a tool detail page using the tool's app username (slug) for SEO and social previews.
 *
 * If the tool is not found, returns metadata with a "Tool Not Found | AiBDE" title and a generic description.
 *
 * @param params - An object whose `params` promise resolves to route parameters containing the tool's `slug` (app username).
 * @returns A Metadata object containing title, description, keywords, Open Graph and Twitter card data, alternates (canonical URL), and robots directives.
 */
export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const tool = await getToolByAppUsername(slug);

    if (!tool) {
        return {
            title: 'Tool Not Found | AiBDE',
            description: 'The requested AI tool could not be found.',
        };
    }

    const description = tool.summary || tool.description?.slice(0, 155) || `Discover ${tool.name} - an AI tool for ${tool.categoryName?.join(', ') || 'various tasks'}`;
    const categoryLabel = tool.categoryName?.[0] || 'AI Tool';
    const taskLabels = tool.taskName?.slice(0, 3).join(', ') || '';
    const title = `${tool.name} | ${categoryLabel} | AiBDE`;

    return {
        title,
        description,
        keywords: [
            tool.name,
            `${tool.name} AI`,
            `${tool.name} review`,
            `${tool.name} alternative`,
            ...(tool.categoryName || []),
            ...(tool.taskName || []),
            ...(tool.tags || []),
            'AI tool',
            'best AI tools',
            'AiBDE'
        ].join(', '),
        openGraph: {
            title,
            description,
            type: 'website',
            siteName: 'AiBDE',
            url: `https://aibde.tech/app/${slug}`,
            images: tool.logoUrl ? [{ url: tool.logoUrl, alt: tool.name }] : undefined,
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: tool.logoUrl ? [tool.logoUrl] : undefined,
        },
        alternates: {
            canonical: `https://aibde.tech/app/${slug}`,
        },
        robots: {
            index: true,
            follow: true,
        },
    };
}

/**
 * Render the tool detail page for the tool identified by the route slug.
 *
 * Fetches the tool by app username, triggers a 404 response if the tool does not exist, then loads related, suggested, featured, and recently added tools plus categories, tasks, and home settings in parallel before rendering the client component.
 *
 * @param params - A promise resolving to route parameters containing `slug` (the tool's app username).
 * @returns The React element for the tool detail page populated with the tool and its related data.
 */
export default async function ToolDetailPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;

    // Fetch tool first
    const tool = await getToolByAppUsername(slug);

    if (!tool) {
        notFound();
    }

    // Fetch only the necessary related data in parallel
    const [relatedTools, suggestedTools, featuredTools, recentlyAdded, categories, tasks, settings] = await Promise.all([
        getRelatedTools(tool, 6),
        getSuggestedTools(tool, 6),
        getFeaturedTools(tool.app_username, 6),
        getRecentlyAddedTools(tool.app_username, 5),
        getCategories(),
        getTasks(),
        getHomeSettings(),
    ]);

    return (
        <ToolDetailClient
            tool={tool}
            relatedTools={relatedTools}
            suggestedTools={suggestedTools}
            featuredTools={featuredTools}
            recentlyAdded={recentlyAdded}
            categories={categories}
            tasks={tasks}
            showFeaturedAlternatives={settings.showFeaturedAlternatives}
        />
    );
}