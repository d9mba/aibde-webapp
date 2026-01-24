'use client';

import { useState, useMemo } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

const ITEMS_PER_PAGE = 25;

export default function SpotlightPage() {
    const { tools, updateTool, settings } = useAdmin();
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const spotlightTools = useMemo(() => {
        return tools
            .filter(t => t.spotlightEnabled && t.spotlightPosition && t.status === 'published')
            .sort((a, b) => (a.spotlightPosition ?? 999) - (b.spotlightPosition ?? 999));
    }, [tools]);

    const availableTools = useMemo(() => {
        return tools.filter(t => !t.spotlightEnabled);
    }, [tools]);

    // Filter available tools by search
    const filteredAvailableTools = useMemo(() => {
        if (!search) return availableTools;
        const searchLower = search.toLowerCase();
        return availableTools.filter(t =>
            (t.name || '').toLowerCase().includes(searchLower) ||
            (t.categoryName || []).some(cat => (cat || '').toLowerCase().includes(searchLower))
        );
    }, [availableTools, search]);

    // Pagination
    const totalPages = Math.ceil(filteredAvailableTools.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedTools = filteredAvailableTools.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    // Reset to page 1 when search changes
    const handleSearch = (value: string) => {
        setSearch(value);
        setCurrentPage(1);
    };

    const handleRemoveFromSpotlight = (toolId: string) => {
        updateTool(toolId, { isFeatured: false, spotlightEnabled: false, spotlightPosition: undefined });
    };

    const handleAddToSpotlight = (toolId: string) => {
        const maxPos = Math.max(...spotlightTools.map(t => t.spotlightPosition ?? 0), 0);
        updateTool(toolId, { isFeatured: true, spotlightEnabled: true, spotlightPosition: maxPos + 1 });
    };

    const handleMoveUp = (toolId: string) => {
        const idx = spotlightTools.findIndex(t => t.id === toolId);
        if (idx > 0) {
            const tool = spotlightTools[idx];
            const prevTool = spotlightTools[idx - 1];
            updateTool(tool.id, { spotlightPosition: prevTool.spotlightPosition });
            updateTool(prevTool.id, { spotlightPosition: tool.spotlightPosition });
        }
    };

    const handleMoveDown = (toolId: string) => {
        const idx = spotlightTools.findIndex(t => t.id === toolId);
        if (idx < spotlightTools.length - 1) {
            const tool = spotlightTools[idx];
            const nextTool = spotlightTools[idx + 1];
            updateTool(tool.id, { spotlightPosition: nextTool.spotlightPosition });
            updateTool(nextTool.id, { spotlightPosition: tool.spotlightPosition });
        }
    };

    return (
        <div className="min-h-screen p-3 sm:p-6 bg-bg-primary">
            <div className="max-w-[1200px] mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Spotlight</h1>
                        <p className="text-xs sm:text-sm text-text-tertiary mt-0.5 sm:mt-1">Manage featured tools on homepage</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
                    <div className="bg-bg-card border border-border rounded-xl p-3 sm:p-4 text-center">
                        <div className="text-xl sm:text-2xl font-bold text-accent-primary">{spotlightTools.length}</div>
                        <div className="text-[10px] sm:text-xs text-text-tertiary">Active</div>
                    </div>
                    <div className="bg-bg-card border border-border rounded-xl p-3 sm:p-4 text-center">
                        <div className="text-xl sm:text-2xl font-bold text-text-primary">{settings.spotlightCount}</div>
                        <div className="text-[10px] sm:text-xs text-text-tertiary">Max</div>
                    </div>
                    <div className="bg-bg-card border border-border rounded-xl p-3 sm:p-4 text-center">
                        <div className="text-xl sm:text-2xl font-bold text-accent-green">{availableTools.length}</div>
                        <div className="text-[10px] sm:text-xs text-text-tertiary">Available</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {/* Current Spotlight */}
                    <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
                        <div className="px-3 sm:px-5 py-3 sm:py-4 border-b border-border flex items-center gap-2">
                            <svg className="w-4 h-4 text-accent-yellow" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                            <h2 className="text-sm sm:text-base font-semibold text-text-primary">Current Spotlight</h2>
                        </div>
                        <div className="divide-y divide-border">
                            {spotlightTools.length === 0 ? (
                                <div className="p-6 sm:p-8 text-center text-text-tertiary text-sm">
                                    No spotlight tools. Add from below.
                                </div>
                            ) : (
                                spotlightTools.map((tool, idx) => (
                                    <div key={tool.id} className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2.5 sm:py-3 hover:bg-bg-secondary transition-colors">
                                        <span className="text-xs font-mono text-text-tertiary w-5 sm:w-6">#{idx + 1}</span>
                                        {tool.logoUrl ? (
                                            <img src={tool.logoUrl} alt="" className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-contain" />
                                        ) : (
                                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-accent-primary-bg flex items-center justify-center text-accent-primary text-xs font-bold">
                                                {(tool.name || 'T')[0]}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-text-primary text-sm truncate">{tool.name}</div>
                                        </div>
                                        <div className="flex items-center gap-0.5 sm:gap-1">
                                            <button
                                                onClick={() => handleMoveUp(tool.id)}
                                                disabled={idx === 0}
                                                className="p-1 text-text-tertiary hover:text-text-primary disabled:opacity-30"
                                                title="Move Up"
                                            >
                                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
                                            </button>
                                            <button
                                                onClick={() => handleMoveDown(tool.id)}
                                                disabled={idx === spotlightTools.length - 1}
                                                className="p-1 text-text-tertiary hover:text-text-primary disabled:opacity-30"
                                                title="Move Down"
                                            >
                                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7" /></svg>
                                            </button>
                                            <button
                                                onClick={() => handleRemoveFromSpotlight(tool.id)}
                                                className="p-1 text-text-tertiary hover:text-accent-red"
                                                title="Remove"
                                            >
                                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Available Tools */}
                    <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
                        <div className="px-3 sm:px-5 py-3 sm:py-4 border-b border-border flex items-center gap-2">
                            <svg className="w-4 h-4 text-text-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
                            <h2 className="text-sm sm:text-base font-semibold text-text-primary">Available Tools</h2>
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
                                    {search ? 'No tools match your search' : 'All published tools are in spotlight'}
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
                                        </div>
                                        <button
                                            onClick={() => handleAddToSpotlight(tool.id)}
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
                                    Showing {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredAvailableTools.length)} of {filteredAvailableTools.length}
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
                                        Page {currentPage} of {totalPages}
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
                </div>
            </div>
        </div>
    );
}
