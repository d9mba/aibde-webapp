'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useAdmin, AdminTool } from '@/context/AdminContext';
import { useTools } from '@/hooks/useTools';
import { useToast } from '@/components/ui/Toast';
import { Search, ChevronLeft, ChevronRight, Save, Rocket, Loader2 } from 'lucide-react';

const ITEMS_PER_PAGE = 25;

export default function FastListingsPage() {
    const { updateTool, toolsMutated } = useAdmin();
    const { showToast } = useToast();
    const [search, setSearch] = useState('');
    const [fastSearch, setFastSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [fastPage, setFastPage] = useState(1);
    const [saving, setSaving] = useState(false);

    // Fetch fast tools (small set) and available tools (paginated)
    const { tools: fastToolsRaw, loading: fastLoading } = useTools({
        listing: 'fast', status: 'published', all: true, deps: toolsMutated, fields: 'card',
    });
    const { tools: availableToolsRaw, loading: availLoading, totalCount: availableTotal } = useTools({
        status: 'published', limit: ITEMS_PER_PAGE, page: currentPage,
        search, deps: toolsMutated, fields: 'card',
    });
    // Count auto-fast tools (spotlight + featured + verified are automatically fast-listed)
    // Use limit:1 to fetch only the count, not all rows
    const { totalCount: spotlightCount } = useTools({
        spotlight: true, status: 'published', limit: 1, deps: toolsMutated, fields: 'card',
    });
    const { totalCount: featuredCount } = useTools({
        featured: true, status: 'published', limit: 1, deps: toolsMutated, fields: 'card',
    });
    const { totalCount: verifiedCount } = useTools({
        listing: 'verified', status: 'published', limit: 1, deps: toolsMutated, fields: 'card',
    });
    // NOTE: autoFastCount is approximate — tools matching multiple flags (e.g., both
    // spotlight and featured) are counted twice. We only fetch counts (limit:1), not
    // IDs, to keep the dashboard lightweight. The overlap is typically small.
    // The Available calc uses Math.max(0, ...) to prevent negative display values.
    const autoFastCount = (spotlightCount || 0) + (featuredCount || 0) + (verifiedCount || 0);

    // Only block the full page on initial fast tools load, not on available tools search
    const isLoaded = !fastLoading;

    // Capture initial total so "Available" stat stays constant during search
    const [initialTotal, setInitialTotal] = useState<number | null>(null);
    useEffect(() => {
        if (availableTotal != null && initialTotal === null) {
            setInitialTotal(availableTotal);
        }
    }, [availableTotal, initialTotal]);
    // Reset initial total when tools are mutated so it refreshes
    useEffect(() => {
        setInitialTotal(null);
    }, [toolsMutated]);
    const allTools = useMemo(() => {
        const fastIds = new Set(fastToolsRaw.map(t => t.id));
        const uniqueAvailable = availableToolsRaw.filter(t => !fastIds.has(t.id));
        return [...fastToolsRaw, ...uniqueAvailable];
    }, [fastToolsRaw, availableToolsRaw]);

    // Local state for pending changes
    const [pendingFastIds, setPendingFastIds] = useState<string[]>([]);
    const [hasChanges, setHasChanges] = useState(false);
    // Cache full AdminTool objects so they persist when paginating away
    const pendingToolsCacheRef = useRef<Map<string, AdminTool>>(new Map());

    // Initialize from current data (refreshes when fast tools change)
    useEffect(() => {
        if (fastLoading || hasChanges) return;
        const currentFast = fastToolsRaw.filter((t: AdminTool) => t.listingType === 'fast');
        const ids = currentFast.map(t => t.id);
        currentFast.forEach(t => pendingToolsCacheRef.current.set(t.id, t));
        setPendingFastIds(ids);
    }, [fastToolsRaw, fastLoading, hasChanges]);

    // Current fast tools based on pending changes
    const allFastTools = useMemo(() => {
        return pendingFastIds
            .map(id => allTools.find(t => t.id === id) || pendingToolsCacheRef.current.get(id))
            .filter((t): t is AdminTool => t !== undefined);
    }, [allTools, pendingFastIds]);

    // Helper to get existing listing type label for a tool
    const getExistingListingLabel = (tool: AdminTool): string | null => {
        if (tool.spotlightEnabled) return 'Spotlight';
        if (tool.isFeatured || tool.listingType === 'featured') return 'Featured';
        if (tool.listingType === 'verified') return 'Verified';
        return null;
    };

    // Regular (non-fast) tools from paginated API results
    const regularTools = useMemo(() => {
        return availableToolsRaw.filter((t: AdminTool) =>
            !pendingFastIds.includes(t.id) &&
            t.listingType !== 'fast'
        );
    }, [availableToolsRaw, pendingFastIds]);

    // Count of tools that can actually be added (no existing listing type)
    const availableCount = useMemo(() => {
        return regularTools.filter(t => !getExistingListingLabel(t)).length;
    }, [regularTools]);

    // Filter fast tools by search
    const filteredFastTools = useMemo(() => {
        if (!fastSearch) return allFastTools;
        const searchLower = fastSearch.toLowerCase();
        return allFastTools.filter((t: AdminTool) =>
            (t.name || '').toLowerCase().includes(searchLower) ||
            (t.categoryName || []).some((cat: string) => (cat || '').toLowerCase().includes(searchLower))
        );
    }, [allFastTools, fastSearch]);

    // Filter regular tools by search
    const filteredRegularTools = useMemo(() => {
        if (!search) return regularTools;
        const searchLower = search.toLowerCase();
        return regularTools.filter(t =>
            (t.name || '').toLowerCase().includes(searchLower) ||
            (t.categoryName || []).some(cat => (cat || '').toLowerCase().includes(searchLower))
        );
    }, [regularTools, search]);

    // Pagination for fast tools
    const fastTotalPages = Math.ceil(filteredFastTools.length / ITEMS_PER_PAGE);
    const fastStartIndex = (fastPage - 1) * ITEMS_PER_PAGE;
    const paginatedFastTools = filteredFastTools.slice(fastStartIndex, fastStartIndex + ITEMS_PER_PAGE);

    // Pagination for regular tools (use server-reported total for page count)
    const totalPages = Math.max(1, Math.ceil((availableTotal ?? 0) / ITEMS_PER_PAGE));
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    // Backend already applies limit/page
    const paginatedTools = filteredRegularTools;

    const handleSearch = (value: string) => {
        setSearch(value);
        setCurrentPage(1);
    };

    const handleFastSearch = (value: string) => {
        setFastSearch(value);
        setFastPage(1);
    };

    const handleAddToFast = (toolId: string) => {
        const tool = availableToolsRaw.find(t => t.id === toolId) || allTools.find(t => t.id === toolId);
        if (tool) pendingToolsCacheRef.current.set(toolId, tool);
        setPendingFastIds(prev => prev.includes(toolId) ? prev : [...prev, toolId]);
        setHasChanges(true);
        showToast(`Added "${tool?.name || 'Tool'}" - Click Save to apply`, 'info');
    };

    const handleRemoveFromFast = (toolId: string) => {
        const tool = allTools.find(t => t.id === toolId);
        setPendingFastIds(prev => prev.filter(id => id !== toolId));
        setHasChanges(true);
        showToast(`Removed "${tool?.name || 'Tool'}" - Click Save to apply`, 'info');
    };

    const handleSaveAll = async () => {
        showToast('Saving fast listing changes...', 'info');
        setSaving(true);
        try {
            const currentFast = fastToolsRaw.filter(t => t.listingType === 'fast');
            const currentIds = new Set(currentFast.map(t => t.id));
            const pendingSet = new Set(pendingFastIds);

            const updates: Promise<void>[] = [];

            // Remove tools that were fast but no longer are
            for (const tool of currentFast) {
                if (!pendingSet.has(tool.id)) {
                    updates.push(updateTool(tool.id, { listingType: 'free' }));
                }
            }

            // Add tools that are now fast
            for (const toolId of pendingFastIds) {
                if (!currentIds.has(toolId)) {
                    updates.push(updateTool(toolId, { listingType: 'fast' }));
                }
            }

            await Promise.all(updates);
            setHasChanges(false);
            showToast('Fast listings saved successfully!', 'success');
        } catch (error) {
            console.error('Failed to save:', error);
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
                    Loading fast listings...
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
                        <h1 className="text-xl sm:text-2xl font-bold text-text-primary flex items-center gap-2">
                            <Rocket className="w-6 h-6 text-accent-green" />
                            Fast Listings
                        </h1>
                        <p className="text-xs sm:text-sm text-text-tertiary mt-0.5 sm:mt-1">Tools with expedited listing review</p>
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
                    <div className="bg-bg-card border border-border rounded-xl p-3 sm:p-4 text-center">
                        <div className="text-xl sm:text-2xl font-bold text-accent-green">{allFastTools.length}</div>
                        <div className="text-[10px] sm:text-xs text-text-tertiary">Fast Listings</div>
                    </div>
                    <div className="bg-bg-card border border-border rounded-xl p-3 sm:p-4 text-center">
                        <div className="text-xl sm:text-2xl font-bold text-accent-primary">{autoFastCount}</div>
                        <div className="text-[10px] sm:text-xs text-text-tertiary">Auto (Higher Tiers)</div>
                    </div>
                    <div className="bg-bg-card border border-border rounded-xl p-3 sm:p-4 text-center">
                        <div className="text-xl sm:text-2xl font-bold text-text-tertiary">{Math.max(0, (initialTotal ?? availableTotal ?? 0) - allFastTools.length - autoFastCount)}</div>
                        <div className="text-[10px] sm:text-xs text-text-tertiary">Available</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {/* Add to Fast (Left) */}
                    <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
                        <div className="px-3 sm:px-5 py-3 sm:py-4 border-b border-border flex items-center gap-2">
                            <svg className="w-4 h-4 text-text-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
                            <h2 className="text-sm sm:text-base font-semibold text-text-primary">Add to Fast Listings</h2>
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
                                    aria-label="Search tools"
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
                                    {search ? 'No tools match your search' : 'All tools already have a listing type'}
                                </div>
                            ) : (
                                paginatedTools.map((tool) => {
                                    const existingLabel = getExistingListingLabel(tool);
                                    return (
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
                                            {existingLabel ? (
                                                <span className="px-2 py-1 text-xs text-text-tertiary bg-bg-tertiary rounded">
                                                    {existingLabel}
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => handleAddToFast(tool.id)}
                                                    className="px-2 py-1 text-xs text-accent-primary bg-accent-primary-bg rounded hover:bg-accent-primary/20"
                                                >
                                                    + Add
                                                </button>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-3 sm:px-5 py-3 border-t border-border">
                                <span className="text-sm text-text-tertiary">
                                    {(availableTotal ?? 0) === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + paginatedTools.length, availableTotal ?? 0)} of {availableTotal ?? 0}
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

                    {/* Currently Fast (Right) */}
                    <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
                        <div className="px-3 sm:px-5 py-3 sm:py-4 border-b border-border flex items-center gap-2">
                            <Rocket className="w-4 h-4 text-accent-green" />
                            <h2 className="text-sm sm:text-base font-semibold text-text-primary">Current Fast Listings</h2>
                        </div>

                        {/* Search Input */}
                        <div className="px-3 sm:px-5 py-2.5 sm:py-3 border-b border-border">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                                <input
                                    type="text"
                                    value={fastSearch}
                                    onChange={e => handleFastSearch(e.target.value)}
                                    placeholder="Search fast listings..."
                                    aria-label="Search fast listings"
                                    className="w-full pl-10 pr-4 py-2 bg-bg-secondary border border-border rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-text-tertiary"
                                />
                            </div>
                        </div>

                        <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
                            {paginatedFastTools.length === 0 ? (
                                <div className="p-6 sm:p-8 text-center text-text-tertiary text-sm">
                                    {fastSearch ? 'No fast listings match your search' : 'No fast listings yet'}
                                </div>
                            ) : (
                                paginatedFastTools.map((tool: AdminTool) => (
                                    <div key={tool.id} className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2.5 sm:py-3 hover:bg-bg-secondary transition-colors">
                                        {tool.logoUrl ? (
                                            <img src={tool.logoUrl} alt="" className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-contain" />
                                        ) : (
                                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-accent-green/10 flex items-center justify-center text-accent-green text-xs font-bold">
                                                {(tool.name || 'T')[0]}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-text-primary text-sm truncate flex items-center gap-1.5">
                                                {tool.name}
                                                <Rocket className="w-3.5 h-3.5 text-accent-green" />
                                            </div>
                                            <div className="text-xs text-text-tertiary truncate">{(tool.categoryName || []).slice(0, 2).join(', ') || '-'}</div>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveFromFast(tool.id)}
                                            className="p-1 text-text-tertiary hover:text-accent-red"
                                            title="Remove"
                                            aria-label="Remove from fast listings"
                                        >
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Pagination */}
                        {fastTotalPages > 1 && (
                            <div className="flex items-center justify-between px-3 sm:px-5 py-3 border-t border-border">
                                <span className="text-sm text-text-tertiary">
                                    {fastStartIndex + 1}-{Math.min(fastStartIndex + ITEMS_PER_PAGE, filteredFastTools.length)} of {filteredFastTools.length}
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setFastPage(p => Math.max(1, p - 1))}
                                        disabled={fastPage === 1}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-sm text-text-secondary hover:bg-bg-secondary disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                        Previous
                                    </button>
                                    <span className="text-sm text-text-tertiary">
                                        {fastPage}/{fastTotalPages}
                                    </span>
                                    <button
                                        onClick={() => setFastPage(p => Math.min(fastTotalPages, p + 1))}
                                        disabled={fastPage >= fastTotalPages}
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
