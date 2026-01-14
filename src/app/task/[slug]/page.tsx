import { getPublishedTools, getTasks } from '@/lib/data';
import TaskSlugPageClient from './TaskSlugPageClient';

interface PageProps {
    params: Promise<{ slug: string }>;
}

/**
 * Task Detail Page - Server Component with SSR
 * Fetches all data on the server, hides API calls from network tab
 */
export default async function TaskPage({ params }: PageProps) {
    const { slug } = await params;

    const [tools, tasks] = await Promise.all([
        getPublishedTools(),
        getTasks(),
    ]);

    // Helper to slugify task name for comparison
    const slugify = (str: string) => str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    // Find task by matching against slugified version of task name
    const task = tasks.find(t => slugify(t.taskName) === slug) || null;

    return (
        <TaskSlugPageClient
            task={task}
            tools={tools}
            allTasks={tasks}
            slug={slug}
        />
    );
}
