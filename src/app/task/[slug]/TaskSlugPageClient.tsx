'use client';

import Link from 'next/link';
import AIToolCard from '@/components/features/tools/ToolCard';
import { AdminTool, Task } from '@/types';
import { Target, ArrowLeft, ChevronRight } from 'lucide-react';

interface TaskSlugPageClientProps {
    task: Task | null;
    tools: AdminTool[];
    allTasks: Task[];
    slug: string;
}

export default function TaskSlugPageClient({
    task,
    tools,
    allTasks,
    slug
}: TaskSlugPageClientProps) {
    const slugify = (str: string) => str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    // Get tools for this task
    const taskTools = task
        ? tools.filter(t => (t.taskName || []).includes(task.taskName))
        : [];

    if (!task) {
        return (
            <div className="max-w-[1200px] mx-auto px-3 sm:px-6 py-4 sm:py-10">
                <div className="text-center py-16">
                    <div className="w-16 h-16 rounded-2xl bg-bg-tertiary flex items-center justify-center mx-auto mb-4">
                        <Target className="w-8 h-8 text-text-tertiary" />
                    </div>
                    <h1 className="text-2xl font-bold text-text-primary mb-2">Task not found</h1>
                    <p className="text-text-secondary mb-4">The task you&apos;re looking for doesn&apos;t exist.</p>
                    <Link href="/tasks" className="inline-flex items-center gap-1.5 text-accent-green hover:underline">
                        <ArrowLeft className="w-4 h-4" /> Browse all tasks
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1200px] mx-auto px-3 sm:px-6 py-4 sm:py-8">
            {/* Back Link */}
            <Link href="/tasks" className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-accent-green mb-4 no-underline">
                <ArrowLeft className="w-4 h-4" /> Back to Tasks
            </Link>

            {/* Header - Compact */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-accent-green/10 text-accent-green flex items-center justify-center flex-shrink-0">
                        <Target className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-text-primary">{task.taskName}</h1>
                        <p className="text-sm text-text-secondary">{taskTools.length} AI tool{taskTools.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>
                {task.description && (
                    <p className="text-sm text-text-tertiary mt-2">{task.description}</p>
                )}
            </div>

            {/* Tools Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-12">
                {taskTools.length > 0 ? (
                    taskTools.map((tool) => (
                        <AIToolCard key={tool.id} tool={tool} />
                    ))
                ) : (
                    <div className="col-span-full text-center py-12 bg-bg-card border border-border rounded-xl">
                        <Target className="w-10 h-10 text-text-tertiary mx-auto mb-3" />
                        <p className="text-text-secondary mb-2">No tools found for this task yet.</p>
                        <Link href="/tasks" className="text-accent-green hover:underline text-sm">Browse other tasks</Link>
                    </div>
                )}
            </div>

            {/* Other Tasks Section */}
            <section className="border-t border-border pt-6 sm:pt-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-text-primary">Other Tasks</h2>
                    <Link href="/tasks" className="text-sm text-text-tertiary hover:text-accent-green no-underline flex items-center gap-1">
                        View all <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>
                <div className="flex flex-wrap gap-2">
                    {allTasks
                        .filter((t) => slugify(t.taskName) !== slug)
                        .slice(0, 8)
                        .map((t) => (
                            <Link
                                key={t.taskName}
                                href={`/task/${slugify(t.taskName)}`}
                                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-bg-card border border-border rounded-full text-xs sm:text-sm text-text-secondary no-underline transition-all duration-200 hover:border-accent-green hover:text-accent-green hover:bg-accent-green/5"
                            >
                                {t.taskName}
                            </Link>
                        ))}
                </div>
            </section>
        </div>
    );
}
