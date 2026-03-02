'use client';

import Link from 'next/link';
import { Task } from '@/types';
import { slugify } from '@/lib/utils';
import { useMemo, useState, useEffect } from 'react';
import Pagination from '@/components/ui/Pagination';

function HomeIcon({ className }: { className?: string }) {
    return (
        <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
    );
}
function ChevronUpIcon({ className }: { className?: string }) {
    return (
        <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="18 15 12 9 6 15" />
        </svg>
    );
}

interface TasksPageClientProps {
    tasks: Task[];
    totalCount: number;
}

const ITEMS_PER_PAGE = 48;

export default function TasksPageClient({ tasks, totalCount }: TasksPageClientProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [activeLetter, setActiveLetter] = useState<string>('');

    // Sort tasks alphabetically, dedupe by id, and filter those with tools
    const sortedTasks = useMemo(() => {
        const byId = new Map<string, Task>();
        tasks.forEach((task) => {
            if ((task.count || 0) > 0 && !byId.has(task.id)) {
                byId.set(task.id, task);
            }
        });
        return Array.from(byId.values()).sort((a, b) => a.taskName.localeCompare(b.taskName));
    }, [tasks]);

    const totalPages = Math.ceil(sortedTasks.length / ITEMS_PER_PAGE);

    // Get paginated tasks
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedTasks = sortedTasks.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    // Group paginated tasks by first letter
    const groupedTasks = useMemo(() => {
        const groups: { [key: string]: Task[] } = {};
        paginatedTasks.forEach(task => {
            const firstLetter = (task.taskName?.charAt(0) || '?').toUpperCase();
            if (!groups[firstLetter]) {
                groups[firstLetter] = [];
            }
            groups[firstLetter].push(task);
        });
        return groups;
    }, [paginatedTasks]);

    // All available letters (from all tasks, not just current page)
    const allLetters = useMemo(() => {
        const letters = new Set<string>();
        sortedTasks.forEach(task => {
            letters.add((task.taskName?.charAt(0) || '?').toUpperCase());
        });
        return Array.from(letters).sort();
    }, [sortedTasks]);

    const sortedLetters = Object.keys(groupedTasks).sort();

    // Track active letter based on scroll position
    useEffect(() => {
        let ticking = false;

        function handleScroll() {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const sections = sortedLetters.map(letter => ({
                        letter,
                        element: document.getElementById(`section-${letter}`)
                    })).filter(s => s.element);

                    for (let i = sections.length - 1; i >= 0; i--) {
                        const { letter, element } = sections[i];
                        if (element) {
                            const rect = element.getBoundingClientRect();
                            if (rect.top <= 150) {
                                setActiveLetter(letter);
                                ticking = false;
                                return;
                            }
                        }
                    }

                    if (sections.length > 0) {
                        setActiveLetter(sections[0].letter);
                    }
                    ticking = false;
                });
                ticking = true;
            }
        }

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, [sortedLetters]);

    // Scroll to letter — find which page has that letter and navigate there
    function scrollToLetter(letter: string) {
        const idx = sortedTasks.findIndex(
            task => (task.taskName?.charAt(0) || '?').toUpperCase() === letter
        );
        if (idx === -1) return;

        const targetPage = Math.floor(idx / ITEMS_PER_PAGE) + 1;

        if (targetPage !== currentPage) {
            setCurrentPage(targetPage);
            setTimeout(() => {
                const element = document.getElementById(`section-${letter}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
        } else {
            const element = document.getElementById(`section-${letter}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }

    return (
        <div className="max-w-[1200px] mx-auto px-3 sm:px-6 py-4 sm:py-10">
            {/* Hero Section */}
            <section className="text-center py-6 sm:py-8 mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">Find by Task</h1>
                <p className="text-sm sm:text-base text-text-secondary max-w-lg mx-auto mb-2">
                    Browse all {totalCount.toLocaleString()} AI tasks in alphabetical order.
                </p>
                <p className="text-xs sm:text-sm text-text-tertiary max-w-lg mx-auto">
                    💡 Protip: you can also find them using the search bar at the top of this page.
                </p>
            </section>

            <div className="flex gap-2 sm:gap-4">
                {/* Main Content - left on mobile, right on desktop */}
                <div className="order-1 lg:order-2 flex-1 min-w-0 space-y-6">
                    {sortedLetters.map(letter => (
                        <div key={letter} id={`section-${letter}`}>
                            <h2 className="text-lg font-bold text-text-primary mb-3 pb-2 border-b border-border">{letter}</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                {groupedTasks[letter].map((task, idx) => (
                                    <Link
                                        key={`${letter}-${task.id}-${idx}`}
                                        href={`/task/${slugify(task.taskName)}`}
                                        prefetch={false}
                                        className="flex flex-col gap-0.5 px-3 py-2.5 bg-bg-card border border-border rounded-lg no-underline transition-all duration-200 hover:border-accent-green/50 hover:bg-bg-secondary"
                                    >
                                        <span className="text-sm font-medium text-text-primary truncate">{task.taskName}</span>
                                        <span className="text-xs text-text-tertiary">{task.count || 0} tools</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Pagination */}
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>

                {/* Alphabet bar - right on mobile (sticky), left on desktop */}
                <div className="order-2 lg:order-1 flex flex-col items-center gap-0 sticky top-20 max-h-[calc(100vh-120px)] overflow-y-auto py-1 px-0.5 bg-bg-secondary/50 border border-border rounded-lg flex-shrink-0">
                    {allLetters.map(letter => (
                        <button
                            key={letter}
                            onClick={() => scrollToLetter(letter)}
                            className={`w-7 h-7 flex items-center justify-center text-xs font-medium rounded transition-colors ${activeLetter === letter
                                ? 'bg-accent-green text-white'
                                : groupedTasks[letter]
                                    ? 'text-text-primary hover:bg-accent-green/10 hover:text-accent-green'
                                    : 'text-text-tertiary hover:bg-bg-secondary'
                                }`}
                        >
                            {letter}
                        </button>
                    ))}
                </div>
            </div>

            {/* Empty State */}
            {tasks.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-text-tertiary">No tasks found</p>
                </div>
            )}
        </div>
    );
}
