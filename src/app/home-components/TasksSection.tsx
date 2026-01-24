import Link from 'next/link';
import { AdminTool, Task } from '@/types';

interface TasksSectionProps {
    tasks: Task[];
    allTools: AdminTool[];
    showTasks: boolean;
}

export default function TasksSection({ tasks, allTools, showTasks }: TasksSectionProps) {
    if (!showTasks) return null;

    const slugify = (str: string) => str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    // Calculate count for each task, filter out zero-count, and sort by count descending
    const tasksWithCount = tasks
        .map((task) => {
            const count = allTools.filter(t => (t.taskName || []).includes(task.taskName)).length;
            return { ...task, count };
        })
        .filter(task => task.count > 0) // Only show tasks with at least 1 published tool
        .sort((a, b) => b.count - a.count); // Sort by count descending (top count first)

    if (tasksWithCount.length === 0) return null;

    return (
        <section className="flex flex-col gap-2 sm:gap-4">
            <div className="flex justify-between items-center">
                <h2 className="text-base font-semibold text-text-primary m-0 tracking-tight">Find by Task</h2>
                <Link href="/tasks" prefetch={false} className="text-[0.8125rem] text-text-tertiary transition-colors duration-fast hover:text-accent-primary">View all</Link>
            </div>
            <p className="text-[0.75rem] sm:text-[0.8125rem] text-text-secondary -mt-1 sm:-mt-2 hidden sm:block">What do you need to accomplish? Find the right AI tool for your task.</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {tasksWithCount.map((task) => (
                    <Link
                        key={task.taskName}
                        href={`/task/${slugify(task.taskName)}`}
                        prefetch={false}
                        className="flex px-3 py-2.5 sm:px-4 sm:py-3.5 bg-bg-card border border-border rounded-lg no-underline transition-all duration-fast hover:border-text-tertiary"
                    >
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[0.75rem] sm:text-[0.8125rem] font-medium text-text-primary">{task.taskName}</span>
                            <span className="text-[0.625rem] sm:text-[0.6875rem] text-text-tertiary">{task.count} tools</span>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
