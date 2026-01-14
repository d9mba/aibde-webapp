import { Metadata } from 'next';
import { getPublishedTools, getTasks } from '@/lib/data';
import TaskSlugPageClient from './TaskSlugPageClient';

interface PageProps {
    params: Promise<{ slug: string }>;
}

// Helper to slugify task name
const slugify = (str: string) => str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const tasks = await getTasks();
    const task = tasks.find(t => slugify(t.taskName) === slug);

    if (!task) {
        return {
            title: 'Task Not Found | AiBDE',
            description: 'The requested task could not be found.',
        };
    }

    const description = task.description || `Find the best AI tools for ${task.taskName}. Discover ${task.count || 'top'} AI solutions for this task.`;

    return {
        title: `${task.taskName} | Tasks | AiBDE`,
        description,
        keywords: [task.taskName, 'AI tools', 'AiBDE', 'artificial intelligence'].join(', '),
        openGraph: {
            title: `${task.taskName} | Tasks | AiBDE`,
            description,
            type: 'website',
        },
    };
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
