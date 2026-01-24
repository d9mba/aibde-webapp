import { Metadata } from 'next';
import { getPublishedTools, getTasks } from '@/lib/data';
import TasksPageClient from './TasksPageClient';

/**
 * Dynamic SEO Metadata for Tasks Page
 */
export async function generateMetadata(): Promise<Metadata> {
    const tasks = await getTasks();
    const taskCount = tasks.length;

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
            ...tasks.slice(0, 10).map(t => t.taskName),
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
 * Fetches all data on the server, hides API calls from network tab
 */
export default async function TasksPage() {
    const [tools, tasks] = await Promise.all([
        getPublishedTools(),
        getTasks(),
    ]);

    return (
        <TasksPageClient
            tasks={tasks}
            tools={tools}
        />
    );
}
