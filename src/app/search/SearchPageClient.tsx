'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import AIToolCard from '@/components/features/tools/ToolCard';
import CustomSelect from '@/components/ui/Select';
import { searchTools } from '@/lib/search';
import { AdminTool, Category, Task } from '@/types';

const ITEMS_PER_PAGE = 6;

interface SearchPageClientProps {
    tools: AdminTool[];
    categories: Category[];
    tasks: Task[];
}

export default function SearchPageClient({ tools, categories, tasks }: SearchPageClientProps) {
    const searchParams = useSearchParams();

    const [query, setQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedTask, setSelectedTask] = useState<string | null>(null);
    const [selectedPricing, setSelectedPricing] = useState<string | null>(null);
    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

    // Read URL parameters on mount
    useEffect(() => {
        const q = searchParams.get('q');
        const pricing = searchParams.get('pricing');
        const category = searchParams.get('category');
        const task = searchParams.get('task');

        if (q) setQuery(q);
        if (pricing) setSelectedPricing(pricing);
        if (category) setSelectedCategory(category);
        if (task) setSelectedTask(task);
    }, [searchParams]);

    // Reset visible count when filters change
    useEffect(() => {
        setVisibleCount(ITEMS_PER_PAGE);
    }, [query, selectedCategory, selectedTask, selectedPricing]);

    // Use priority-based search with fuzzy matching
    const filteredTools = useMemo(() => {
        let results = query ? searchTools(tools, query) : tools;

        // Apply additional filters
        if (selectedCategory) {
            results = results.filter(tool => (tool.categoryName || []).includes(selectedCategory));
        }
        if (selectedTask) {
            results = results.filter(tool => (tool.taskName || []).includes(selectedTask));
        }
        if (selectedPricing) {
            results = results.filter(tool => tool.pricing === selectedPricing);
        }

        return results;
    }, [tools, query, selectedCategory, selectedTask, selectedPricing]);

    // Paginated results
    const visibleTools = filteredTools.slice(0, visibleCount);
    const hasMore = visibleCount < filteredTools.length;

    // Featured tools (spotlight enabled)
    const featuredTools = useMemo(() => {
        return tools
            .filter(t => t.spotlightEnabled)
            .sort((a, b) => (a.spotlightPosition || 999) - (b.spotlightPosition || 999))
            .slice(0, 6);
    }, [tools]);

    // Recently added tools
    const recentlyAdded = useMemo(() => {
        return [...tools]
            .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
            .slice(0, 6);
    }, [tools]);

    const handleLoadMore = () => {
        setVisibleCount(prev => prev + ITEMS_PER_PAGE);
    };

    return (
        <div className="max-w-[1200px] mx-auto px-4 py-6 sm:px-6 sm:py-10">
            <section className="text-center py-8 mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-4">Search AI Tools</h1>
                <div className="flex items-center gap-3 max-w-[500px] mx-auto px-5 py-3.5 bg-bg-card border-2 border-border rounded-full transition-all duration-200 hover:border-text-tertiary focus-within:border-text-secondary focus-within:shadow-[0_0_0_3px_var(--border-color)]">
                    <svg className="text-text-tertiary" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <path d="M21 21l-4.35-4.35" />
                    </svg>
                    <input
                        type="text"
                        className="flex-1 border-none outline-none bg-transparent text-base text-text-primary placeholder:text-text-tertiary"
                        placeholder="Search for any AI tool..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
                {query && (
                    <p className="text-lg text-text-secondary mt-4">
                        Search results for &ldquo;<span className="font-medium text-text-primary">{query}</span>&rdquo;
                    </p>
                )}
            </section>

            <div className="flex flex-wrap gap-3 mb-6 justify-center">
                <CustomSelect
                    options={[
                        { value: '', label: 'All Categories' },
                        ...categories.map(cat => ({ value: cat.categoryName, label: cat.categoryName }))
                    ]}
                    value={selectedCategory}
                    onChange={setSelectedCategory}
                    placeholder="All Categories"
                />

                <CustomSelect
                    options={[
                        { value: '', label: 'All Tasks' },
                        ...tasks.map(task => ({ value: task.taskName, label: task.taskName }))
                    ]}
                    value={selectedTask}
                    onChange={setSelectedTask}
                    placeholder="All Tasks"
                />

                <CustomSelect
                    options={[
                        { value: '', label: 'All Pricing' },
                        { value: 'free', label: 'Free' },
                        { value: 'freemium', label: 'Freemium' },
                        { value: 'paid', label: 'Paid' }
                    ]}
                    value={selectedPricing}
                    onChange={setSelectedPricing}
                    placeholder="All Pricing"
                />
            </div>

            {/* Search Results */}
            <div className="mb-12">
                <p className="text-sm text-text-tertiary mb-4">
                    {filteredTools.length} tool{filteredTools.length !== 1 ? 's' : ''} found
                    {query && ` for "${query}"`}
                </p>

                {filteredTools.length === 0 ? (
                    <div className="text-center py-16 px-4">
                        <div className="text-5xl mb-4">🔍</div>
                        <h3 className="text-xl font-semibold text-text-primary mb-2">We might have missed something!</h3>
                        <p className="text-text-secondary mb-6 max-w-md mx-auto">
                            We couldn't find what you're looking for. If you know an AI tool that should be here, help us grow our directory.
                        </p>
                        <a
                            href="/submit"
                            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-accent-primary rounded-full transition-opacity hover:opacity-90"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 5v14M5 12h14" />
                            </svg>
                            Submit a Tool
                        </a>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {visibleTools.map((tool) => (
                                <AIToolCard key={tool.id} tool={tool} />
                            ))}
                        </div>

                        {hasMore && (
                            <div className="text-center mt-8">
                                <button
                                    onClick={handleLoadMore}
                                    className="px-6 py-3 bg-bg-card border border-border rounded-full text-sm font-medium text-text-primary transition-all duration-200 hover:border-text-tertiary hover:shadow-md"
                                >
                                    Load more ({filteredTools.length - visibleCount} remaining)
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Featured Tools Section */}
            {featuredTools.length > 0 && (
                <section className="mb-12 pt-10">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-text-primary">Featured Tools</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {featuredTools.map((tool) => (
                            <AIToolCard key={tool.id} tool={tool} />
                        ))}
                    </div>
                </section>
            )}

            {/* Recently Added Section */}
            {recentlyAdded.length > 0 && (
                <section className="pt-10">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-text-primary">Recently Added</h2>
                        <a href="/new" className="text-sm text-text-tertiary hover:text-accent-primary transition-colors">
                            View all
                        </a>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {recentlyAdded.map((tool) => (
                            <AIToolCard key={tool.id} tool={tool} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
