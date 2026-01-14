import { Metadata } from 'next';
import { getPublishedTools, getTasks } from '@/lib/data';
import TasksPageClient from './TasksPageClient';

export const metadata: Metadata = {
    title: 'Tasks | AiBDE',
    description: 'Find AI tools organized by task. Discover the best AI solutions for writing, designing, coding, marketing, and more.',
    openGraph: {
        title: 'Tasks | AiBDE',
        description: 'Find AI tools organized by task. Discover the best AI solutions for your needs.',
        type: 'website',
    },
};

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
