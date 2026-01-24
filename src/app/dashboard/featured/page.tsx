'use client';

import { useState, useMemo } from 'react';
import { useAdmin, AdminTool } from '@/context/AdminContext';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

const ITEMS_PER_PAGE = 25;

export default function FeaturedPage() {
    const { tools, updateTool } = useAdmin();
    const [search, setSearch] = useState('');
    const [featuredSearch, setFeaturedSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [featuredPage, setFeaturedPage] = useState(1);

    const featuredTools = tools.filter((t: AdminTool) => t.isFeatured && !t.spotlightEnabled);
    const spotlightTools = tools.filter((t: AdminTool) => t.spotlightEnabled);
    const regularTools = tools.filter((t: AdminTool) => !t.isFeatured && !t.spotlightEnabled);

    // Filter featured tools by search
    const filteredFeaturedTools = useMemo(() => {
        if (!featuredSearch) return featuredTools;
        const searchLower = featuredSearch.toLowerCase();
        return featuredTools.filter(t =>
            (t.name || '').toLowerCase().includes(searchLower) ||
            (t.categoryName || []).some(cat => (cat || '').toLowerCase().includes(searchLower))
        );
    }, [featuredTools, featuredSearch]);

    // Filter regular tools by search
    const filteredRegularTools = useMemo(() => {
        if (!search) return regularTools;
        const searchLower = search.toLowerCase();
        return regularTools.filter(t =>
            (t.name || '').toLowerCase().includes(searchLower) ||
            (t.categoryName || []).some(cat => (cat || '').toLowerCase().includes(searchLower))
        );
    }, [regularTools, search]);

    // Pagination for featured tools
    const featuredTotalPages = Math.ceil(filteredFeaturedTools.length / ITEMS_PER_PAGE);
    const featuredStartIndex = (featuredPage - 1) * ITEMS_PER_PAGE;
    const paginatedFeaturedTools = filteredFeaturedTools.slice(featuredStartIndex, featuredStartIndex + ITEMS_PER_PAGE);

    // Pagination for regular tools
    const totalPages = Math.ceil(filteredRegularTools.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedTools = filteredRegularTools.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    // Reset to page 1 when search changes
    const handleSearch = (value: string) => {
        setSearch(value);
        setCurrentPage(1);
    };

    const handleFeaturedSearch = (value: string) => {
        setFeaturedSearch(value);
        setFeaturedPage(1);
    };

    const toggleFeatured = (toolId: string, isFeatured: boolean) => {
        updateTool(toolId, { isFeatured });
    };

    return (
        <div className="min-h-screen p-3 sm:p-6 bg-bg-primary">
            <div className="max-w-[1200px] mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Featured Tools</h1>
                        <p className="text-xs sm:text-sm text-text-tertiary mt-0.5 sm:mt-1">Boosted tools appear more frequently in search and lists</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
                    <div className="bg-bg-card border border-border rounded-xl p-3 sm:p-4 text-center">
                        <div className="text-xl sm:text-2xl font-bold text-accent-primary">{spotlightTools.length}</div>
                        <div className="text-[10px] sm:text-xs text-text-tertiary">Spotlight</div>
                    </div>
                    <div className="bg-bg-card border border-border rounded-xl p-3 sm:p-4 text-center">
                        <div className="text-xl sm:text-2xl font-bold text-accent-green">{featuredTools.length}</div>
                        <div className="text-[10px] sm:text-xs text-text-tertiary">Featured</div>
                    </div>
                    <div className="bg-bg-card border border-border rounded-xl p-3 sm:p-4 text-center">
                        <div className="text-xl sm:text-2xl font-bold text-text-tertiary">{regularTools.length}</div>
                        <div className="text-[10px] sm:text-xs text-text-tertiary">Regular</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {/* Add to Featured (Left) */}
                    <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
                        <div className="px-3 sm:px-5 py-3 sm:py-4 border-b border-border flex items-center gap-2">
                            <svg className="w-4 h-4 text-text-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
                            <h2 className="text-sm sm:text-base font-semibold text-text-primary">Add to Featured</h2>
                        </div>

                        {/* Search Input */}
                        <div className="px-3 sm:px-5 py-2.5 sm:py-3 border-b border-border">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={e => handleSearch(e.target.value)}
                                    placeholder="Search tools..."
                                    className="w-full pl-10 pr-4 py-2 bg-bg-secondary border border-border rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-text-tertiary"
                                />
                            </div>
                        </div>

                        <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
                            {paginatedTools.length === 0 ? (
                                <div className="p-6 sm:p-8 text-center text-text-tertiary text-sm">
                                    {search ? 'No tools match your search' : 'All tools are already featured'}
                                </div>
                            ) : (
                                paginatedTools.map((tool) => (
                                    <div key={tool.id} className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2.5 sm:py-3 hover:bg-bg-secondary transition-colors">
                                        {tool.logoUrl ? (
                                            <img src={tool.logoUrl} alt="" className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-contain" />
                                        ) : (
                                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-bg-secondary flex items-center justify-center text-text-tertiary text-xs font-bold">
                                                {(tool.name || 'T')[0]}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-text-primary text-sm truncate">{tool.name}</div>
                                            <div className="text-xs text-text-tertiary truncate">{(tool.categoryName || []).slice(0, 2).join(', ') || '-'}</div>
                                        </div>
                                        <button
                                            onClick={() => toggleFeatured(tool.id, true)}
                                            className="px-2 py-1 text-xs text-accent-primary bg-accent-primary-bg rounded hover:bg-accent-primary/20"
                                        >
                                            + Add
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-3 sm:px-5 py-3 border-t border-border">
                                <span className="text-sm text-text-tertiary">
                                    {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredRegularTools.length)} of {filteredRegularTools.length}
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-sm text-text-secondary hover:bg-bg-secondary disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                        Previous
                                    </button>
                                    <span className="text-sm text-text-tertiary">
                                        {currentPage}/{totalPages}
                                    </span>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage >= totalPages}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-sm text-text-secondary hover:bg-bg-secondary disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        Next
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Currently Featured (Right) */}
                    <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
                        <div className="px-3 sm:px-5 py-3 sm:py-4 border-b border-border flex items-center gap-2">
                            <svg className="w-4 h-4 text-accent-green" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                            <h2 className="text-sm sm:text-base font-semibold text-text-primary">Currently Featured</h2>
                        </div>

                        {/* Search Input */}
                        <div className="px-3 sm:px-5 py-2.5 sm:py-3 border-b border-border">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                                <input
                                    type="text"
                                    value={featuredSearch}
                                    onChange={e => handleFeaturedSearch(e.target.value)}
                                    placeholder="Search featured..."
                                    className="w-full pl-10 pr-4 py-2 bg-bg-secondary border border-border rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-text-tertiary"
                                />
                            </div>
                        </div>

                        <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
                            {paginatedFeaturedTools.length === 0 ? (
                                <div className="p-6 sm:p-8 text-center text-text-tertiary text-sm">
                                    {featuredSearch ? 'No featured tools match your search' : 'No featured tools yet'}
                                </div>
                            ) : (
                                paginatedFeaturedTools.map((tool) => (
                                    <div key={tool.id} className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2.5 sm:py-3 hover:bg-bg-secondary transition-colors">
                                        {tool.logoUrl ? (
                                            <img src={tool.logoUrl} alt="" className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-contain" />
                                        ) : (
                                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-accent-green/10 flex items-center justify-center text-accent-green text-xs font-bold">
                                                {(tool.name || 'T')[0]}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-text-primary text-sm truncate">{tool.name}</div>
                                            <div className="text-xs text-text-tertiary truncate">{(tool.categoryName || []).slice(0, 2).join(', ') || '-'}</div>
                                        </div>
                                        <button
                                            onClick={() => toggleFeatured(tool.id, false)}
                                            className="p-1 text-text-tertiary hover:text-accent-red"
                                            title="Remove"
                                        >
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Pagination */}
                        {featuredTotalPages > 1 && (
                            <div className="flex items-center justify-between px-3 sm:px-5 py-3 border-t border-border">
                                <span className="text-sm text-text-tertiary">
                                    {featuredStartIndex + 1}-{Math.min(featuredStartIndex + ITEMS_PER_PAGE, filteredFeaturedTools.length)} of {filteredFeaturedTools.length}
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setFeaturedPage(p => Math.max(1, p - 1))}
                                        disabled={featuredPage === 1}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-sm text-text-secondary hover:bg-bg-secondary disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                        Previous
                                    </button>
                                    <span className="text-sm text-text-tertiary">
                                        {featuredPage}/{featuredTotalPages}
                                    </span>
                                    <button
                                        onClick={() => setFeaturedPage(p => Math.min(featuredTotalPages, p + 1))}
                                        disabled={featuredPage >= featuredTotalPages}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-sm text-text-secondary hover:bg-bg-secondary disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        Next
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
