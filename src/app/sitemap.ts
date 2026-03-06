import { MetadataRoute } from 'next';
import {
    getPublishedToolsRange,
    getCategoriesRange,
    getTasksRange,
    getToolsCount,
    getCategoriesCount,
    getTasksCount,
} from '@/lib/data';
import { slugify } from '@/lib/utils';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.aibde.tech';

/** Max URLs per sitemap (smaller files = faster crawling by search engines). */
const SITEMAP_PAGE_SIZE = 1000;

function isSafeSlug(s: string): boolean {
    return s.length > 0 && !s.includes('..') && !/^\s*$/.test(s);
}

/**
 * Returns all sitemap ids: one "static" plus paginated tools, categories, tasks.
 * Used by both generateSitemaps (Next) and the sitemap index route.
 */
export async function getAllSitemapIds(): Promise<string[]> {
    const [toolCount, categoryCount, taskCount] = await Promise.all([
        getToolsCount(['published', 'approved']),
        getCategoriesCount(),
        getTasksCount(),
    ]);

    const ids: string[] = ['static'];

    const toolPages = Math.ceil(toolCount / SITEMAP_PAGE_SIZE) || 1;
    for (let i = 0; i < toolPages; i++) ids.push(`tools-${i}`);

    const categoryPages = Math.ceil(categoryCount / SITEMAP_PAGE_SIZE) || 1;
    for (let i = 0; i < categoryPages; i++) ids.push(`categories-${i}`);

    const taskPages = Math.ceil(taskCount / SITEMAP_PAGE_SIZE) || 1;
    for (let i = 0; i < taskPages; i++) ids.push(`tasks-${i}`);

    return ids;
}

export async function generateSitemaps(): Promise<{ id: string }[]> {
    const ids = await getAllSitemapIds();
    return ids.map((id) => ({ id }));
}

export default async function sitemap(props: { id: Promise<string> }): Promise<MetadataRoute.Sitemap> {
    const id = await props.id;

    if (id === 'static') {
        return [
            { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
            { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
            { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
            { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
            { url: `${BASE_URL}/submit`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
            { url: `${BASE_URL}/category`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
            { url: `${BASE_URL}/tasks`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
            { url: `${BASE_URL}/new`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
            { url: `${BASE_URL}/trending`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
            { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
        ];
    }

    const toolsMatch = id.match(/^tools-(\d+)$/);
    if (toolsMatch) {
        const page = parseInt(toolsMatch[1], 10);
        const offset = page * SITEMAP_PAGE_SIZE;
        const tools = await getPublishedToolsRange(offset, SITEMAP_PAGE_SIZE);
        return tools
            .filter((tool) => isSafeSlug(tool.appUsername))
            .map((tool) => ({
                url: `${BASE_URL}/app/${encodeURIComponent(tool.appUsername)}`,
                lastModified: tool.updatedAt ? new Date(tool.updatedAt) : new Date(),
                changeFrequency: 'weekly' as const,
                priority: 0.8,
            }));
    }

    const categoriesMatch = id.match(/^categories-(\d+)$/);
    if (categoriesMatch) {
        const page = parseInt(categoriesMatch[1], 10);
        const offset = page * SITEMAP_PAGE_SIZE;
        const categories = await getCategoriesRange(offset, SITEMAP_PAGE_SIZE);
        return categories
            .filter((category) => isSafeSlug(category.categoryName))
            .map((category) => ({
                url: `${BASE_URL}/category/${encodeURIComponent(slugify(category.categoryName))}`,
                lastModified: new Date(),
                changeFrequency: 'weekly' as const,
                priority: 0.7,
            }));
    }

    const tasksMatch = id.match(/^tasks-(\d+)$/);
    if (tasksMatch) {
        const page = parseInt(tasksMatch[1], 10);
        const offset = page * SITEMAP_PAGE_SIZE;
        const tasks = await getTasksRange(offset, SITEMAP_PAGE_SIZE);
        return tasks
            .filter((task) => isSafeSlug(task.taskName))
            .map((task) => ({
                url: `${BASE_URL}/task/${encodeURIComponent(slugify(task.taskName))}`,
                lastModified: new Date(),
                changeFrequency: 'weekly' as const,
                priority: 0.7,
            }));
    }

    return [];
}
