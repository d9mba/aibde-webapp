import { notFound } from 'next/navigation';
import { getToolBySlug, getPublishedTools, getCategories, getTasks, getHomeSettings } from '@/lib/data';
import ToolDetailClient from './ToolDetailClient';

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
