'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useAdmin, AdminTool } from '@/context/AdminContext';
import { useTools } from '@/hooks/useTools';
import { useToast } from '@/components/ui/Toast';
import { Search, ChevronLeft, ChevronRight, AlertTriangle, Save, Loader2 } from 'lucide-react';

const ITEMS_PER_PAGE = 25;
const MAX_SPOTLIGHT_TOOLS = 8; // Maximum spotlight tools allowed

interface SpotlightChange {
    toolId: string;
    action: 'add' | 'remove' | 'reorder';
    position?: number;
}

export default function SpotlightPage() {
    const { updateTool, settings, toolsMutated } = useAdmin();
    const { showToast } = useToast();
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [saving, setSaving] = useState(false);

    // Fetch spotlight tools (small set) and available tools (paginated)
    const { tools: spotlightToolsRaw, loading: spotLoading } = useTools({
        spotlight: true, status: 'published', all: true, deps: toolsMutated, fields: 'card',
    });
    const { tools: availableToolsRaw, loading: availLoading, totalPages, totalCount: availableTotal } = useTools({
        status: 'published', limit: ITEMS_PER_PAGE, page: currentPage,
        search, deps: toolsMutated, fields: 'card',
    });

    // Only block the full page on initial spotlight tools load, not on available tools search
    const isLoaded = !spotLoading;

    // Capture initial total so "Available" stat stays constant during search
    const initialTotalRef = useRef<number>(0);
    useEffect(() => {
        if (availableTotal != null && initialTotalRef.current === 0) {
            initialTotalRef.current = availableTotal;
        }
    }, [availableTotal]);
    // Reset initial total when tools are mutated so it refreshes
    useEffect(() => {
        initialTotalRef.current = 0;
    }, [toolsMutated]);

    // Local state for pending changes
    const [pendingSpotlightIds, setPendingSpotlightIds] = useState<string[]>([]);
    const [pendingPositions, setPendingPositions] = useState<Record<string, number>>({});
    const [hasChanges, setHasChanges] = useState(false);
    // Cache tool objects so they persist across pagination
    const pendingToolsCacheRef = useRef<Map<string, AdminTool>>(new Map());

    // Initialize from current data
    useEffect(() => {
        const currentSpotlights = spotlightToolsRaw
            .filter(t => t.spotlightEnabled && t.spotlightPosition && t.status === 'published')
            .sort((a, b) => (a.spotlightPosition ?? 999) - (b.spotlightPosition ?? 999));

        const ids = currentSpotlights.map(t => t.id);
        const positions: Record<string, number> = {};
        currentSpotlights.forEach(t => {
            positions[t.id] = t.spotlightPosition ?? 0;
        });

        if (pendingSpotlightIds.length === 0) {
            setPendingSpotlightIds(ids);
            setPendingPositions(positions);
        }
    }, [spotlightToolsRaw]);

    // Current spotlight tools based on pending changes
    const allTools = useMemo(() => {
        return [...spotlightToolsRaw, ...availableToolsRaw];
    }, [spotlightToolsRaw, availableToolsRaw]);

    // Keep cache populated when allTools changes (separate from useMemo to keep memo pure)
    useEffect(() => {
        allTools.forEach(t => pendingToolsCacheRef.current.set(t.id, t));
    }, [allTools]);

    const spotlightTools = useMemo(() => {
        return pendingSpotlightIds
            .map(id => pendingToolsCacheRef.current.get(id) || allTools.find(t => t.id === id))
            .filter((t): t is AdminTool => t !== undefined)
            .sort((a, b) => (pendingPositions[a.id] ?? 999) - (pendingPositions[b.id] ?? 999));
    }, [allTools, pendingSpotlightIds, pendingPositions]);

    const availableTools = useMemo(() => {
        return availableToolsRaw.filter(t => !pendingSpotlightIds.includes(t.id));
    }, [availableToolsRaw, pendingSpotlightIds]);

    const availableCount = Math.max(0, (initialTotalRef.current ?? availableTotal ?? 0) - spotlightTools.length);

    // Filter available tools by search
    const filteredAvailableTools = useMemo(() => {
        if (!search) return availableTools;
        const searchLower = search.toLowerCase();
        return availableTools.filter(t =>
            (t.name || '').toLowerCase().includes(searchLower) ||
            (t.categoryName || []).some(cat => (cat || '').toLowerCase().includes(searchLower))
        );
    }, [availableTools, search]);

    // Server-side pagination is handled by useTools — no client-side slicing needed
    const paginatedTools = filteredAvailableTools;

    const handleSearch = (value: string) => {
        setSearch(value);
        setCurrentPage(1);
    };

    const handleRemoveFromSpotlight = (toolId: string) => {
        const tool = allTools.find(t => t.id === toolId);
        setPendingSpotlightIds(prev => prev.filter(id => id !== toolId));
        setPendingPositions(prev => {
            const updated = { ...prev };
            delete updated[toolId];
            return updated;
        });
        setHasChanges(true);
        showToast(`Removed "${tool?.name || 'Tool'}" - Click Save to apply`, 'info');
    };

    const handleAddToSpotlight = (toolId: string) => {
        if (pendingSpotlightIds.length >= MAX_SPOTLIGHT_TOOLS) {
            showToast(`Maximum ${MAX_SPOTLIGHT_TOOLS} spotlight tools allowed! Remove one before adding.`, 'error');
            return;
        }
        const tool = allTools.find((t: AdminTool) => t.id === toolId);
        if (tool) pendingToolsCacheRef.current.set(toolId, tool);
        const maxPos = Math.max(...Object.values(pendingPositions), 0);
        setPendingSpotlightIds(prev => [...prev, toolId]);
        setPendingPositions(prev => ({ ...prev, [toolId]: maxPos + 1 }));
        setHasChanges(true);
        showToast(`Added "${tool?.name || 'Tool'}" - Click Save to apply`, 'info');
    };

    const handleMoveUp = (toolId: string) => {
        const idx = spotlightTools.findIndex(t => t.id === toolId);
        if (idx > 0) {
            const tool = spotlightTools[idx];
            const prevTool = spotlightTools[idx - 1];
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
        const idx = spotlightTools.findIndex(t => t.id === toolId);
        if (idx < spotlightTools.length - 1) {
            const tool = spotlightTools[idx];
            const nextTool = spotlightTools[idx + 1];
            setPendingPositions(prev => ({
                ...prev,
                [tool.id]: prev[nextTool.id],
                [nextTool.id]: prev[tool.id]
            }));
            setHasChanges(true);
            showToast('Moved down - Click Save to apply', 'info');
        }
    };

    const handleSaveAll = async () => {
        // Show warning if at max capacity before saving
        if (pendingSpotlightIds.length >= MAX_SPOTLIGHT_TOOLS) {
            showToast(`Saving with maximum ${MAX_SPOTLIGHT_TOOLS} spotlight tools.`, 'warning');
        }

        setSaving(true);
        try {
            // Get current DB state
            const currentSpotlights = spotlightToolsRaw.filter((t: AdminTool) => t.spotlightEnabled);
            const currentIds = new Set(currentSpotlights.map((t: AdminTool) => t.id));
            const pendingSet = new Set(pendingSpotlightIds);

            const updates: Promise<void>[] = [];

            // Remove tools that were in spotlight but no longer are
            for (const tool of currentSpotlights) {
                if (!pendingSet.has(tool.id)) {
                    // Keep featured when removing from spotlight
                    updates.push(updateTool(tool.id, { spotlightEnabled: false, spotlightPosition: undefined }));
                }
            }

            // Add/update tools in spotlight
            for (const toolId of pendingSpotlightIds) {
                const position = pendingPositions[toolId];
                const tool = pendingToolsCacheRef.current.get(toolId) || allTools.find((t: AdminTool) => t.id === toolId);
                if (tool) {
                    if (!currentIds.has(toolId)) {
                        // New spotlight
                        updates.push(updateTool(toolId, { isFeatured: true, spotlightEnabled: true, spotlightPosition: position }));
                    } else if (tool.spotlightPosition !== position) {
                        // Position changed
                        updates.push(updateTool(toolId, { spotlightPosition: position }));
                    }
                }
            }

            await Promise.all(updates);
            setHasChanges(false);
            showToast('Spotlight saved successfully!', 'success');
        } catch (error) {
            console.error('Failed to save spotlight:', error);
            showToast('Failed to save. Please try again.', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (!isLoaded) {
        return (
            <div className="min-h-screen p-8 bg-bg-primary flex items-center justify-center">
                <div className="flex items-center gap-3 text-text-secondary">
                    <span className="w-5 h-5 border-2 border-border border-t-accent-primary rounded-full animate-spin"></span>
                    Loading spotlight tools...
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-3 sm:p-6 bg-bg-primary">
            <div className="max-w-[1200px] mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Spotlight</h1>
                        <p className="text-xs sm:text-sm text-text-tertiary mt-0.5 sm:mt-1">Manage featured tools on homepage</p>
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
                    <div className={`bg-bg-card border rounded-xl p-3 sm:p-4 text-center ${spotlightTools.length >= MAX_SPOTLIGHT_TOOLS ? 'border-amber-500/50' : 'border-border'}`}>
                        <div className={`text-xl sm:text-2xl font-bold ${spotlightTools.length >= MAX_SPOTLIGHT_TOOLS ? 'text-amber-500' : 'text-accent-primary'}`}>{spotlightTools.length}/{MAX_SPOTLIGHT_TOOLS}</div>
                        <div className="text-[10px] sm:text-xs text-text-tertiary">Active</div>
                    </div>
                    <div className="bg-bg-card border border-border rounded-xl p-3 sm:p-4 text-center">
                        <div className="text-xl sm:text-2xl font-bold text-text-primary">{settings.spotlightCount}</div>
                        <div className="text-[10px] sm:text-xs text-text-tertiary">Display</div>
                    </div>
                    <div className="bg-bg-card border border-border rounded-xl p-3 sm:p-4 text-center">
                        <div className="text-xl sm:text-2xl font-bold text-accent-green">{availableCount}</div>
                        <div className="text-[10px] sm:text-xs text-text-tertiary">Available</div>
                    </div>
                </div>

                {/* Limit Warning */}
                {spotlightTools.length >= MAX_SPOTLIGHT_TOOLS && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                        <p className="text-sm text-amber-400">
                            <strong>Maximum reached!</strong> You have {spotlightTools.length} spotlight tools. Remove one before adding more.
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {/* Available Tools (Left) */}
                    <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
                        <div className="px-3 sm:px-5 py-3 sm:py-4 border-b border-border flex items-center gap-2">
                            <svg className="w-4 h-4 text-text-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
                            <h2 className="text-sm sm:text-base font-semibold text-text-primary">Add to Spotlight</h2>
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
                                            disabled={spotlightTools.length >= MAX_SPOTLIGHT_TOOLS}
                                            className="px-2 py-1 text-xs text-accent-primary bg-accent-primary-bg rounded hover:bg-accent-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                    Page {currentPage} of {totalPages} ({availableTotal} tools)
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

                    {/* Current Spotlight (Right) */}
                    <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
                        <div className="px-3 sm:px-5 py-3 sm:py-4 border-b border-border flex items-center gap-2">
                            <svg className="w-4 h-4 text-accent-yellow" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                            <h2 className="text-sm sm:text-base font-semibold text-text-primary">Current Spotlight</h2>
                        </div>
                        <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
                            {spotlightTools.length === 0 ? (
                                <div className="p-6 sm:p-8 text-center text-text-tertiary text-sm">
                                    No spotlight tools yet
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
                </div>
            </div>
        </div>
    );
}
