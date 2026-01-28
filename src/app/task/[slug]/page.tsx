import { Metadata } from 'next';
import { getTasks, getToolsByTask, getToolsCountByTask } from '@/lib/data';
import TaskSlugPageClient from './TaskSlugPageClient';

// PERFORMANCE: ISR - regenerate page every 5 minutes
export const revalidate = 300;
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

    // Get count efficiently (not loading all tools)
    const toolCount = await getToolsCountByTask(task.taskName);
    const title = `${task.taskName} AI Tools (${toolCount}+) | Best AI for ${task.taskName} | AiBDE`;
    const description = task.description || `Find ${toolCount}+ best AI tools for ${task.taskName}. Compare top-rated AI solutions to automate and enhance your ${task.taskName.toLowerCase()} workflow.`;

    return {
        title,
        description,
        keywords: [
            task.taskName,
            `AI for ${task.taskName}`,
            `${task.taskName} AI tools`,
            `best ${task.taskName} tools`,
            'AI automation',
            'AiBDE',
        ].join(', '),
        openGraph: {
            title,
            description,
            type: 'website',
            siteName: 'AiBDE',
            url: `https://aibde.tech/task/${slug}`,
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
        },
        alternates: {
            canonical: `https://aibde.tech/task/${slug}`,
        },
    };
}

/**
 * Task Detail Page - Optimized with pagination
 * Initially loads 100 tools, more loaded on demand
 */
export default async function TaskPage({ params }: PageProps) {
    const { slug } = await params;
    const tasks = await getTasks();

    // Find task by matching against slugified version of task name
    const task = tasks.find(t => slugify(t.taskName) === slug) || null;

    // Fetch initial tools and total count
    const [tools, totalCount] = await Promise.all([
        task ? getToolsByTask(task.taskName, 100) : Promise.resolve([]),
        task ? getToolsCountByTask(task.taskName) : Promise.resolve(0)
    ]);

    return (
        <TaskSlugPageClient
            task={task}
            tools={tools}
            allTasks={tasks}
            slug={slug}
            totalCount={totalCount}
        />
    );
}
