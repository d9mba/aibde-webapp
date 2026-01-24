import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getToolBySlug, getPublishedTools, getCategories, getTasks, getHomeSettings } from '@/lib/data';
import ToolDetailClient from './ToolDetailClient';

// PERFORMANCE: ISR - regenerate page every 5 minutes
export const revalidate = 300;
// Generate dynamic metadata for SEO
export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const tool = await getToolBySlug(slug);

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

export default async function ToolDetailPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;

    // Fetch data on the server - not visible in browser network tab
    const [tool, allTools, categories, tasks, settings] = await Promise.all([
        getToolBySlug(slug),
        getPublishedTools(),
        getCategories(),
        getTasks(),
        getHomeSettings(),
    ]);

    if (!tool) {
        notFound();
    }

    return (
        <ToolDetailClient
            tool={tool}
            allTools={allTools}
            categories={categories}
            tasks={tasks}
            showFeaturedAlternatives={settings.showFeaturedAlternatives}
        />
    );
}
