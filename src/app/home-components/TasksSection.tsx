import Link from 'next/link';
import { Task } from '@/types';
import { slugify } from '@/lib/utils';

interface TasksSectionProps {
    tasks: Task[];
    taskCount: number; // Total count from DB
    showTasks: boolean;
}

export default function TasksSection({ tasks, taskCount, showTasks }: TasksSectionProps) {
    if (!showTasks) return null;

    // Filter tasks with tools and sort by count (top 8 by most tools)
    const topTasks = tasks
        .filter(task => (task.count || 0) > 0)
        .sort((a, b) => (b.count || 0) - (a.count || 0))
        .slice(0, 8);

    if (topTasks.length === 0) return null;

    return (
        <section className="flex flex-col gap-2 sm:gap-4">
            <div className="flex justify-between items-center">
                <h2 className="text-base font-semibold text-text-primary m-0 tracking-tight">Find by Task</h2>
                <Link href="/tasks" prefetch={false} className="text-[0.8125rem] text-text-tertiary transition-colors duration-fast hover:text-accent-primary">View all</Link>
            </div>
            <p className="text-[0.75rem] sm:text-[0.8125rem] text-text-secondary -mt-1 sm:-mt-2 hidden sm:block">Explore {taskCount.toLocaleString()} tasks with AI tools</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {topTasks.map((task) => (
                    <Link
                        key={task.id}
                        href={`/task/${slugify(task.taskName)}`}
                        prefetch={false}
                        className="flex px-3 py-2.5 sm:px-4 sm:py-3.5 bg-bg-card border border-border rounded-lg no-underline transition-all duration-fast hover:border-text-tertiary"
                    >
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[0.75rem] sm:text-[0.8125rem] font-medium text-text-primary">{task.taskName}</span>
                            <span className="text-[0.625rem] sm:text-[0.6875rem] text-text-tertiary">{task.count || 0} tools</span>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
