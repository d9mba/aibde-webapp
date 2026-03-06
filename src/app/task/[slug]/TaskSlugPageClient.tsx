'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import AIToolCard from '@/components/features/tools/ToolCard';
import Pagination from '@/components/ui/Pagination';
import { AdminTool, Task } from '@/types';
import { slugify } from '@/lib/utils';
import { Target, ArrowLeft, ChevronRight } from 'lucide-react';

interface TaskSlugPageClientProps {
    task: Task | null;
    tools: AdminTool[];
    allTasks: Task[];
    slug: string;
    totalCount: number;
}

const ITEMS_PER_PAGE = 48;

export default function TaskSlugPageClient({
    task,
    tools: initialTools,
    allTasks,
    slug,
    totalCount
}: TaskSlugPageClientProps) {
    const [tools, setTools] = useState<AdminTool[]>(initialTools);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const endIndex = Math.min(currentPage * ITEMS_PER_PAGE, totalCount);

    // Fetch a specific page of tools
    const goToPage = useCallback(async (page: number) => {
        if (!task) return;

        // Page 1 uses SSR data
        if (page === 1) {
            setTools(initialTools);
            setCurrentPage(1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        setIsLoading(true);
        try {
            const offset = (page - 1) * ITEMS_PER_PAGE;
            const response = await fetch(
                `/api/tools/by-task?task=${encodeURIComponent(task.taskName)}&offset=${offset}&limit=${ITEMS_PER_PAGE}`
            );
            if (!response.ok) {
                const text = await response.text().catch(() => response.statusText);
                console.error(`Failed to load tools: ${response.status} ${text}`);
                setTools([]);
                setCurrentPage(1);
                return;
            }
            const data = await response.json();
            setTools(data.tools || []);
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            console.error('Failed to load tools:', error);
            setTools([]);
            setCurrentPage(1);
        } finally {
            setIsLoading(false);
        }
    }, [task, initialTools]);

    if (!task) {
        return (
            <div className="max-w-[1200px] mx-auto px-3 sm:px-6 py-4 sm:py-10">
                <div className="text-center py-16">
                    <div className="w-16 h-16 rounded-2xl bg-bg-tertiary flex items-center justify-center mx-auto mb-4">
                        <Target className="w-8 h-8 text-text-tertiary" />
                    </div>
                    <h1 className="text-2xl font-bold text-text-primary mb-2">Task not found</h1>
                    <p className="text-text-secondary mb-4">The task you&apos;re looking for doesn&apos;t exist.</p>
                    <Link href="/tasks" prefetch={false} className="inline-flex items-center gap-1.5 text-accent-green hover:underline">
                        <ArrowLeft className="w-4 h-4" /> Browse all tasks
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1200px] mx-auto px-3 sm:px-6 py-4 sm:py-8">
            {/* Back Link */}
            <Link href="/tasks" prefetch={false} className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-accent-green mb-4 no-underline">
                <ArrowLeft className="w-4 h-4" /> Back to Tasks
            </Link>

            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-accent-green/10 text-accent-green flex items-center justify-center flex-shrink-0">
                        <Target className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-text-primary">{task.taskName}</h1>
                        <p className="text-sm text-text-secondary">{totalCount} AI tool{totalCount !== 1 ? 's' : ''}</p>
                    </div>
                </div>
                {task.description && (
                    <p className="text-sm text-text-tertiary mt-2">{task.description}</p>
                )}
            </div>

            {/* Showing count */}
            {totalCount > 0 && totalPages > 1 && !isLoading && (
                <p className="text-sm text-text-tertiary mb-4">
                    Showing {startIndex}–{endIndex} of {totalCount.toLocaleString()} tools
                </p>
            )}

            {/* Tools Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4">
                {isLoading ? (
                    <div className="col-span-full flex items-center justify-center py-16">
                        <span className="w-6 h-6 border-2 border-border border-t-accent-green rounded-full animate-spin" role="status" aria-label="Loading" />
                    </div>
                ) : tools.length > 0 ? (
                    tools.map((tool) => (
                        <AIToolCard key={tool.id} tool={tool} />
                    ))
                ) : (
                    <div className="col-span-full text-center py-12 bg-bg-card border border-border rounded-xl">
                        <Target className="w-10 h-10 text-text-tertiary mx-auto mb-3" />
                        <p className="text-text-secondary mb-2">No tools found for this task yet.</p>
                        <Link href="/tasks" prefetch={false} className="text-accent-green hover:underline text-sm">Browse other tasks</Link>
                    </div>
                )}
            </div>

            {/* Pagination */}
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={goToPage}
            />

            {/* Other Tasks Section */}
            <section className="border-t border-border pt-6 sm:pt-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-text-primary">Other Tasks</h2>
                    <Link href="/tasks" prefetch={false} className="text-sm text-text-tertiary hover:text-accent-green no-underline flex items-center gap-1">
                        View all <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>
                <div className="flex flex-wrap gap-2">
                    {allTasks
                        .filter((t) => slugify(t.taskName) !== slug)
                        .slice(0, 8)
                        .map((t) => (
                            <Link
                                key={t.id}
                                href={`/task/${slugify(t.taskName)}`}
                                prefetch={false}
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
