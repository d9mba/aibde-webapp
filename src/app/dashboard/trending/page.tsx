'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useAdmin, AdminTool } from '@/context/AdminContext';
import { useTools } from '@/hooks/useTools';
import { useToast } from '@/components/ui/Toast';
import { Search, ChevronLeft, ChevronRight, Save, TrendingUp, AlertTriangle, Loader2 } from 'lucide-react';

const ITEMS_PER_PAGE = 25;
const MAX_TRENDING_TOOLS = 100; // Maximum trending tools allowed

export default function TrendingManagementPage() {
    const { updateTool, toolsMutated } = useAdmin();
    const { showToast } = useToast();
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [trendingPage, setTrendingPage] = useState(1);
    const [saving, setSaving] = useState(false);

    // Fetch trending tools (small set) and available tools (paginated)
    const { tools: trendingToolsRaw, loading: trendLoading } = useTools({
        trending: true, status: 'published', all: true, deps: toolsMutated, fields: 'card',
    });
    const { tools: availableToolsRaw, loading: availLoading, totalPages: apiTotalPages, totalCount: availableTotal } = useTools({
        status: 'published', limit: ITEMS_PER_PAGE, page: currentPage,
        search, deps: toolsMutated, fields: 'card',
    });

    // Only block the full page on initial trending load, not on available tools search
    const isLoaded = !trendLoading;

    // Capture initial total so "Available" stat stays constant during search
    const initialTotalRef = useRef<number>(0);
    useEffect(() => {
        if (availableTotal > 0 && initialTotalRef.current === 0) {
            initialTotalRef.current = availableTotal;
        }
    }, [availableTotal]);

    // Local state for pending changes
    const [pendingTrendingIds, setPendingTrendingIds] = useState<string[]>([]);
    const [pendingPositions, setPendingPositions] = useState<Record<string, number>>({});
    const [hasChanges, setHasChanges] = useState(false);
    // Cache tool objects so they persist across pagination
    const pendingToolsCacheRef = useRef<Map<string, AdminTool>>(new Map());

    // Initialize from current data
    useEffect(() => {
        const currentTrending = trendingToolsRaw
            .filter(t => t.trendingPosition && t.trendingPosition > 0 && t.status === 'published')
            .sort((a, b) => (a.trendingPosition ?? 999) - (b.trendingPosition ?? 999));

        const ids = currentTrending.map(t => t.id);
        const positions: Record<string, number> = {};
        currentTrending.forEach(t => {
            positions[t.id] = t.trendingPosition ?? 0;
        });

        if (pendingTrendingIds.length === 0) {
            setPendingTrendingIds(ids);
            setPendingPositions(positions);
        }
    }, [trendingToolsRaw]);

    // Combined tools for lookups
    const allTools = useMemo(() => [...trendingToolsRaw, ...availableToolsRaw], [trendingToolsRaw, availableToolsRaw]);

    // Populate cache in an effect to avoid side effects in useMemo
    useEffect(() => {
        allTools.forEach(t => pendingToolsCacheRef.current.set(t.id, t));
    }, [allTools]);

    // Current trending tools based on pending changes
    const trendingTools = useMemo(() => {
        return pendingTrendingIds
            .map(id => pendingToolsCacheRef.current.get(id) || allTools.find(t => t.id === id))
            .filter((t): t is AdminTool => t !== undefined)
            .sort((a, b) => (pendingPositions[a.id] ?? 999) - (pendingPositions[b.id] ?? 999));
    }, [allTools, pendingTrendingIds, pendingPositions]);

    const availableTools = useMemo(() => {
        return availableToolsRaw.filter(t => !pendingTrendingIds.includes(t.id));
    }, [availableToolsRaw, pendingTrendingIds]);

    // Available tools exclude pending trending — server-side pagination handles the rest
    const filteredAvailableTools = availableTools;
    const paginatedTools = filteredAvailableTools;

    const handleSearch = (value: string) => {
        setSearch(value);
        setCurrentPage(1);
    };

    const handleRemoveFromTrending = (toolId: string) => {
        const tool = allTools.find((t: AdminTool) => t.id === toolId);
        setPendingTrendingIds(prev => prev.filter(id => id !== toolId));
        setPendingPositions(prev => {
            const updated = { ...prev };
            delete updated[toolId];
            return updated;
        });
        setHasChanges(true);
        showToast(`Removed "${tool?.name || 'Tool'}" - Click Save to apply`, 'info');
    };

    const handleAddToTrending = (toolId: string) => {
        if (pendingTrendingIds.length >= MAX_TRENDING_TOOLS) {
            showToast(`Maximum ${MAX_TRENDING_TOOLS} trending tools allowed! Remove one before adding.`, 'error');
            return;
        }
        const tool = allTools.find((t: AdminTool) => t.id === toolId);
        if (tool) pendingToolsCacheRef.current.set(tool.id, tool);
        const maxPos = Math.max(...Object.values(pendingPositions), 0);
        setPendingTrendingIds(prev => [...prev, toolId]);
        setPendingPositions(prev => ({ ...prev, [toolId]: maxPos + 1 }));
        setHasChanges(true);
        showToast(`Added "${tool?.name || 'Tool'}" - Click Save to apply`, 'info');
    };

    const handleMoveUp = (toolId: string) => {
        const idx = trendingTools.findIndex(t => t.id === toolId);
        if (idx > 0) {
            const tool = trendingTools[idx];
            const prevTool = trendingTools[idx - 1];
            setPendingPositions(prev => ({
                ...prev,
                [tool.id]: prev[prevTool.id],
                [prevTool.id]: prev[tool.id]
            }));
            setHasChanges(true);
            showToast('Moved up - Click Save to apply', 'info');
        }
    };

    const handleMoveDown = (toolId: string) => {
        const idx = trendingTools.findIndex(t => t.id === toolId);
        if (idx < trendingTools.length - 1) {
            const tool = trendingTools[idx];
            const nextTool = trendingTools[idx + 1];
            setPendingPositions(prev => ({
                ...prev,
                [tool.id]: prev[nextTool.id],
                [nextTool.id]: prev[tool.id]
            }));
            setHasChanges(true);
            showToast('Moved down - Click Save to apply', 'info');
        }
    };

    const handleSetPosition = (toolId: string, newPosition: number) => {
        if (newPosition < 1 || newPosition > trendingTools.length) {
            showToast(`Position must be between 1 and ${trendingTools.length}`, 'error');
            return;
        }

        const currentIdx = trendingTools.findIndex(t => t.id === toolId);
        if (currentIdx === -1) return;

        const targetIdx = newPosition - 1;
        if (currentIdx === targetIdx) return;

        // Reorder the tools array
        const reordered = [...trendingTools];
        const [movedTool] = reordered.splice(currentIdx, 1);
        reordered.splice(targetIdx, 0, movedTool);

        // Update positions for all tools
        const newPositions: Record<string, number> = {};
        reordered.forEach((tool, idx) => {
            newPositions[tool.id] = idx + 1;
        });

        setPendingPositions(newPositions);
        setHasChanges(true);
        showToast(`Moved to position #${newPosition} - Click Save to apply`, 'info');
    };

    const handleSaveAll = async () => {
        setSaving(true);
        try {
            const currentTrending = trendingToolsRaw.filter((t: AdminTool) => t.trendingPosition && t.trendingPosition > 0);
            const currentIds = new Set(currentTrending.map((t: AdminTool) => t.id));
            const pendingSet = new Set(pendingTrendingIds);

            const updates: Promise<void>[] = [];

            // Remove tools
            for (const tool of currentTrending) {
                if (!pendingSet.has(tool.id)) {
                    updates.push(updateTool(tool.id, { trendingPosition: 0 }));
                }
            }

            // Add/update tools
            for (const toolId of pendingTrendingIds) {
                const position = pendingPositions[toolId];
                const tool = allTools.find((t: AdminTool) => t.id === toolId);
                if (tool) {
                    if (!currentIds.has(toolId) || tool.trendingPosition !== position) {
                        updates.push(updateTool(toolId, { trendingPosition: position }));
                    }
                }
            }

            await Promise.all(updates);
            setHasChanges(false);
            showToast('Trending tools saved successfully!', 'success');
        } catch (error) {
            console.error('Failed to save trending:', error);
            showToast('Failed to save. Please try again.', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (!isLoaded) {
        return (
            <div className="min-h-screen p-6 bg-bg-primary flex items-center justify-center">
                <div className="text-text-secondary">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-3 sm:p-6 bg-bg-primary">
            <div className="max-w-[1200px] mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Trending</h1>
                        <p className="text-xs sm:text-sm text-text-tertiary mt-0.5 sm:mt-1">Manage trending tools on /trending page</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {hasChanges && (
                            <span className="text-xs text-amber-400">Unsaved changes</span>
                        )}
                        <button
                            onClick={handleSaveAll}
                            disabled={saving || !hasChanges}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${hasChanges
                                ? 'bg-accent-primary text-white hover:opacity-90'
                                : 'bg-bg-secondary text-text-tertiary border border-border'
                                } disabled:opacity-50`}
                        >
                            <Save className="w-4 h-4" />
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
                    <div className={`bg-bg-card border rounded-xl p-3 sm:p-4 text-center ${trendingTools.length >= MAX_TRENDING_TOOLS ? 'border-amber-500/50' : 'border-border'}`}>
                        <div className={`text-xl sm:text-2xl font-bold ${trendingTools.length >= MAX_TRENDING_TOOLS ? 'text-amber-500' : 'text-accent-primary'}`}>{trendingTools.length}/{MAX_TRENDING_TOOLS}</div>
                        <div className="text-[10px] sm:text-xs text-text-tertiary">Active</div>
                    </div>
                    <div className="bg-bg-card border border-border rounded-xl p-3 sm:p-4 text-center">
                        <div className="text-xl sm:text-2xl font-bold text-text-primary">{trendingTools.length}</div>
                        <div className="text-[10px] sm:text-xs text-text-tertiary">Display</div>
                    </div>
                    <div className="bg-bg-card border border-border rounded-xl p-3 sm:p-4 text-center">
                        <div className="text-xl sm:text-2xl font-bold text-accent-green">{Math.max(0, (initialTotalRef.current || availableTotal) - trendingTools.length)}</div>
                        <div className="text-[10px] sm:text-xs text-text-tertiary">Available</div>
                    </div>
                </div>

                {/* Limit Warning */}
                {trendingTools.length >= MAX_TRENDING_TOOLS && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                        <p className="text-sm text-amber-400">
                            <strong>Maximum reached!</strong> You have {trendingTools.length} trending tools. Remove one before adding more.
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {/* Current Trending */}
                    <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
                        <div className="px-3 sm:px-5 py-3 sm:py-4 border-b border-border flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-accent-primary" />
                            <h2 className="text-sm sm:text-base font-semibold text-text-primary">Current Trending</h2>
                        </div>
                        <div className="divide-y divide-border">
                            {trendingTools.length === 0 ? (
                                <div className="p-6 sm:p-8 text-center text-text-tertiary text-sm">
                                    No trending tools. Add from below.
                                </div>
                            ) : (
                                <>
                                    {trendingTools
                                        .slice((trendingPage - 1) * ITEMS_PER_PAGE, trendingPage * ITEMS_PER_PAGE)
                                        .map((tool, idx) => {
                                            const globalIdx = (trendingPage - 1) * ITEMS_PER_PAGE + idx;
                                            return (
                                                <div key={tool.id} className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2.5 sm:py-3 hover:bg-bg-secondary transition-colors">
                                                    {/* Editable Position Input */}
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max={trendingTools.length}
                                                        value={globalIdx + 1}
                                                        onChange={(e) => {
                                                            const newPos = parseInt(e.target.value);
                                                            if (!isNaN(newPos)) {
                                                                handleSetPosition(tool.id, newPos);
                                                            }
                                                        }}
                                                        className="w-10 sm:w-12 px-1 py-0.5 text-xs font-mono text-center bg-bg-tertiary border border-border rounded text-text-primary focus:outline-none focus:border-accent-primary"
                                                        title="Set position"
                                                    />
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
                                                            disabled={globalIdx === 0}
                                                            className="p-1 text-text-tertiary hover:text-text-primary disabled:opacity-30"
                                                            title="Move Up"
                                                        >
                                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleMoveDown(tool.id)}
                                                            disabled={globalIdx === trendingTools.length - 1}
                                                            className="p-1 text-text-tertiary hover:text-text-primary disabled:opacity-30"
                                                            title="Move Down"
                                                        >
                                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7" /></svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleRemoveFromTrending(tool.id)}
                                                            className="p-1 text-text-tertiary hover:text-accent-red"
                                                            title="Remove"
                                                        >
                                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                    {/* Pagination for Current Trending */}
                                    {trendingTools.length > ITEMS_PER_PAGE && (
                                        <div className="flex items-center justify-between px-3 sm:px-5 py-3 border-t border-border text-xs">
                                            <span className="text-text-tertiary">
                                                Showing {((trendingPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(trendingPage * ITEMS_PER_PAGE, trendingTools.length)} of {trendingTools.length}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setTrendingPage(p => Math.max(1, p - 1))}
                                                    disabled={trendingPage === 1}
                                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-sm text-text-secondary hover:bg-bg-secondary disabled:opacity-30 disabled:cursor-not-allowed"
                                                >
                                                    <ChevronLeft className="w-4 h-4" />
                                                    Previous
                                                </button>
                                                <span className="text-sm text-text-tertiary">
                                                    Page {trendingPage} of {Math.ceil(trendingTools.length / ITEMS_PER_PAGE)}
                                                </span>
                                                <button
                                                    onClick={() => setTrendingPage(p => Math.min(Math.ceil(trendingTools.length / ITEMS_PER_PAGE), p + 1))}
                                                    disabled={trendingPage >= Math.ceil(trendingTools.length / ITEMS_PER_PAGE)}
                                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-sm text-text-secondary hover:bg-bg-secondary disabled:opacity-30 disabled:cursor-not-allowed"
                                                >
                                                    Next
                                                    <ChevronRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
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

                        <div className={`divide-y divide-border max-h-[400px] overflow-y-auto transition-opacity duration-200 ${availLoading ? 'opacity-50' : ''}`}>
                            {availLoading && paginatedTools.length === 0 ? (
                                <div className="p-6 sm:p-8 flex items-center justify-center gap-2 text-text-tertiary text-sm">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Loading tools...
                                </div>
                            ) : paginatedTools.length === 0 ? (
                                <div className="p-6 sm:p-8 text-center text-text-tertiary text-sm">
                                    {search ? 'No tools match your search' : 'All published tools are in trending'}
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
                                            onClick={() => handleAddToTrending(tool.id)}
                                            disabled={trendingTools.length >= MAX_TRENDING_TOOLS}
                                            className="px-2 py-1 text-xs text-accent-primary bg-accent-primary-bg rounded hover:bg-accent-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            + Add
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Pagination */}
                        {apiTotalPages > 1 && (
                            <div className="flex items-center justify-between px-3 sm:px-5 py-3 border-t border-border">
                                <span className="text-sm text-text-tertiary">
                                    Page {currentPage} of {apiTotalPages} ({availableTotal} tools)
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
                                        Page {currentPage} of {apiTotalPages}
                                    </span>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(apiTotalPages, p + 1))}
                                        disabled={currentPage >= apiTotalPages}
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
