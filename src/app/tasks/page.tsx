import { Metadata } from 'next';
import { getTasks, getTasksCount } from '@/lib/data';
import TasksPageClient from './TasksPageClient';

/**
 * Dynamic SEO Metadata for Tasks Page
 */
export async function generateMetadata(): Promise<Metadata> {
    const taskCount = await getTasksCount();

    const title = `Browse ${taskCount}+ AI Tasks | Find AI Tools by Task | AiBDE`;
    const description = `Discover AI tools for ${taskCount}+ different tasks including writing, coding, image generation, video editing, marketing automation, and more. Find the perfect AI solution for your needs.`;

    return {
        title,
        description,
        keywords: [
            'AI tasks',
            'AI tools by task',
            'find AI tools',
            'AI for writing',
            'AI for coding',
            'AI for marketing',
            'AI automation',
            'AI productivity tools',
        ].join(', '),
        openGraph: {
            title,
            description,
            type: 'website',
            siteName: 'AiBDE',
            url: 'https://aibde.tech/tasks',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
        },
        alternates: {
            canonical: 'https://aibde.tech/tasks',
        },
    };
}

/**
 * Tasks Listing Page - Server Component with SSR
 * Fetches tasks and count from database
 */
export default async function TasksPage() {
    const [tasks, totalCount] = await Promise.all([
        getTasks(),
        getTasksCount()
    ]);

    return (
        <TasksPageClient tasks={tasks} totalCount={totalCount} />
    );
}
