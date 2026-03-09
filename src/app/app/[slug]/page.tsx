import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getToolByAppUsername, getRelatedTools, getSuggestedTools, getFeaturedTools, getRecentlyAddedTools, getCategories, getTasks, getHomeSettings, getToolNamesBySlugs } from '@/lib/data';
import { getToolJsonLd, safeJsonLdStringify, SEO } from '@/lib/seo';
import ToolDetailClient from './ToolDetailClient';

// PERFORMANCE: ISR - regenerate page every 24 hours
export const revalidate = 86400;
// Generate dynamic metadata for SEO
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

    // Get competitor names: manual alternatives first, then auto-detected related tools
    let alternativeNames = await getToolNamesBySlugs(tool.alternativeTools || []);
    if (alternativeNames.length === 0) {
        const related = await getRelatedTools(tool, 4);
        alternativeNames = related.map(t => t.name).filter(Boolean);
    }

    const categoryLabel = tool.categoryName?.[0] || 'AI Tool';
    const taskLabels = tool.taskName?.slice(0, 3) || [];
    const year = new Date().getFullYear();
    const suffix = ` (Reviews, Pricing & Alternatives) | ${year} | AiBDE`;
    const prefix = `${tool.name}: `;
    const maxSummaryLen = Math.max(10, 60 - prefix.length - suffix.length);
    const shortSummary = tool.summary
        ? tool.summary.slice(0, maxSummaryLen) + (tool.summary.length > maxSummaryLen ? '…' : '')
        : categoryLabel;

    // Title format: "ToolName: Summary (Reviews, Prices & Alternatives) | Year | AiBDE"
    const title = `${prefix}${shortSummary}${suffix}`;

    // Description: mentions competitors and use cases for SERP visibility
    const baseSummary = tool.summary || tool.description?.slice(0, 100) || `Discover ${tool.name}`;
    const altMention = alternativeNames.length > 0
        ? ` Best alternative to ${alternativeNames.slice(0, 3).join(', ')}.`
        : '';
    const taskMention = taskLabels.length > 0
        ? ` Best for ${taskLabels.join(', ')}.`
        : '';
    const description = `${baseSummary}.${altMention}${taskMention} Updated ${year}.`.replace(/\.\.+/g, '.').slice(0, 160);

    return {
        title,
        description,
        keywords: [
            tool.name,
            `${tool.name} AI`,
            `${tool.name} review`,
            `${tool.name} alternative`,
            `${tool.name} pricing`,
            `best ${categoryLabel} tools ${year}`,
            ...alternativeNames.map(n => `${n} alternative`),
            ...alternativeNames,
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
            siteName: SEO.siteName,
            url: `${SEO.siteUrl}/app/${slug}`,
            images: tool.logoUrl ? [{ url: tool.logoUrl, alt: tool.name }] : undefined,
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: tool.logoUrl ? [tool.logoUrl] : undefined,
        },
        alternates: {
            canonical: `${SEO.siteUrl}/app/${slug}`,
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

    // Fetch tool first
    const tool = await getToolByAppUsername(slug);

    if (!tool) {
        notFound();
    }

    // Fetch only the necessary related data in parallel
    const [relatedTools, suggestedTools, featuredTools, recentlyAdded, categories, tasks, settings] = await Promise.all([
        getRelatedTools(tool, 6),
        getSuggestedTools(tool, 6),
        getFeaturedTools(tool.appUsername, 6),
        getRecentlyAddedTools(tool.appUsername, 5),
        getCategories(),
        getTasks(),
        getHomeSettings(),
    ]);

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(getToolJsonLd(tool)) }}
            />
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
        </>
    );
}
