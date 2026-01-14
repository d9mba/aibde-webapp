'use client';

import Link from 'next/link';
import { AdminTool, Task } from '@/types';
import { ClipboardEdit, ChevronRight } from 'lucide-react';

interface TasksPageClientProps {
    tasks: Task[];
    tools: AdminTool[];
}

export default function TasksPageClient({ tasks, tools }: TasksPageClientProps) {
    const slugify = (str: string) => str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    return (
        <div className="max-w-[1200px] mx-auto px-3 sm:px-6 py-4 sm:py-10">
            {/* Hero Section */}
            <section className="text-center py-6 sm:py-8 mb-6 sm:mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-accent-green/10 text-accent-green mb-4">
                    <ClipboardEdit className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">Find by Task</h1>
                <p className="text-sm sm:text-base text-text-secondary max-w-md mx-auto">What do you need to accomplish? Find the right AI tool for your task.</p>
            </section>

            {/* Tasks Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {tasks.map((task) => {
                    const count = tools.filter(t => (t.taskName || []).includes(task.taskName)).length;
                    return (
                        <Link
                            key={task.taskName}
                            href={`/task/${slugify(task.taskName)}`}
                            className="group p-4 sm:p-5 bg-bg-card border border-border rounded-xl no-underline transition-all duration-200 hover:border-accent-green/50 hover:shadow-lg hover:shadow-accent-green/5 active:scale-[0.98]"
                        >
                            <div className="flex items-start gap-3">
                                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-accent-green/10 flex items-center justify-center text-accent-green flex-shrink-0 group-hover:bg-accent-green group-hover:text-white transition-colors">
                                    <ClipboardEdit className="w-4 h-4 sm:w-5 sm:h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm sm:text-base font-semibold text-text-primary mb-0.5 sm:mb-1 group-hover:text-accent-green transition-colors truncate">{task.taskName}</h3>
                                    <p className="text-xs sm:text-sm text-text-tertiary line-clamp-2">{task.description || 'No description'}</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-text-tertiary group-hover:text-accent-green group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
                            </div>
                            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                                <span className="text-xs text-text-tertiary">{count} tool{count !== 1 ? 's' : ''}</span>
                                <span className="text-xs text-accent-green font-medium opacity-0 group-hover:opacity-100 transition-opacity">View →</span>
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* Empty State */}
            {tasks.length === 0 && (
                <div className="text-center py-12">
                    <ClipboardEdit className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
                    <p className="text-text-tertiary">No tasks found</p>
                </div>
            )}
        </div>
    );
}

