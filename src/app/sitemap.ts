import { MetadataRoute } from 'next';
import { getPublishedTools, getCategories, getTasks } from '@/lib/data';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.aibde.tech';

/**
 * Generate sitemap entries for the site, including static pages and dynamic tool, category, and task pages.
 *
 * Fetches published tools, categories, and tasks and constructs sitemap entries containing URL, lastModified,
 * changeFrequency, and priority for each route.
 *
 * @returns An array of sitemap entries for static pages and dynamically generated app, category, and task pages.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // Fetch all data for sitemap
    const [tools, categories, tasks] = await Promise.all([
        getPublishedTools(),
        getCategories(),
        getTasks(),
    ]);

    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: BASE_URL,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${BASE_URL}/about`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${BASE_URL}/privacy`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        {
            url: `${BASE_URL}/terms`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        {
            url: `${BASE_URL}/submit`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.6,
        },
        {
            url: `${BASE_URL}/search`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.7,
        },
    ];

    // Tool pages
    const toolPages: MetadataRoute.Sitemap = tools.map((tool) => ({
        url: `${BASE_URL}/app/${tool.app_username}`,
        lastModified: tool.updatedAt ? new Date(tool.updatedAt) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }));

    // Category pages
    const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
        url: `${BASE_URL}/category/${encodeURIComponent(category.categoryName.toLowerCase().replace(/\s+/g, '-'))}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
    }));

    // Task pages
    const taskPages: MetadataRoute.Sitemap = tasks.map((task) => ({
        url: `${BASE_URL}/task/${encodeURIComponent(task.taskName.toLowerCase().replace(/\s+/g, '-'))}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
    }));

    return [...staticPages, ...toolPages, ...categoryPages, ...taskPages];
}