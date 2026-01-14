import { getPublishedTools, getTasks } from '@/lib/data';
import TasksPageClient from './TasksPageClient';

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
