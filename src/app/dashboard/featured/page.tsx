'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useAdmin, AdminTool } from '@/context/AdminContext';
import { useTools } from '@/hooks/useTools';
import { useToast } from '@/components/ui/Toast';
import { Search, ChevronLeft, ChevronRight, Save, Loader2 } from 'lucide-react';

const ITEMS_PER_PAGE = 25;

export default function FeaturedPage() {
    const { updateTool, toolsMutated } = useAdmin();
    const { showToast } = useToast();
    const [search, setSearch] = useState('');
    const [featuredSearch, setFeaturedSearch] = useState('');
    // Page state owned by useTools via availablePage/setAvailablePage
    const [featuredPage, setFeaturedPage] = useState(1);
    const [saving, setSaving] = useState(false);

    // Fetch featured tools (small set) and available tools (paginated)
    const { tools: featuredTools, loading: featuredLoading, refetch: refetchFeatured } = useTools({
        featured: true, status: 'published', all: true, deps: toolsMutated, fields: 'card',
    });
    const { tools: availableToolsRaw, loading: availableLoading, totalCount: availableTotal,
        page: availablePage, totalPages: apiTotalPages, setPage: setAvailablePage,
    } = useTools({
        status: 'published', limit: ITEMS_PER_PAGE,
        search, deps: toolsMutated, fields: 'card',
    });

    // Only block the full page on initial featured tools load, not on available tools search
    const isLoaded = !featuredLoading;

    // Capture initial total so "Available" stat stays constant during search
    const [initialTotal, setInitialTotal] = useState(0);
    useEffect(() => {
        if (availableTotal > 0 && initialTotal === 0) {
            setInitialTotal(availableTotal);
        }
    }, [availableTotal, initialTotal]);
    // Reset initial total when tools are mutated so it refreshes
    useEffect(() => {
        setInitialTotal(0);
    }, [toolsMutated]);

    // Local state for pending changes
    const [pendingFeaturedIds, setPendingFeaturedIds] = useState<string[]>([]);
    const [hasChanges, setHasChanges] = useState(false);
    // Cache full AdminTool objects so they persist when paginating away
    const pendingToolsCacheRef = useRef<Map<string, AdminTool>>(new Map());

    // Spotlight tools (always featured, can't be removed from featured directly)
    const spotlightTools = useMemo(() => featuredTools.filter((t: AdminTool) => t.spotlightEnabled), [featuredTools]);

    // Initialize from current data (once)
    const featuredInitializedRef = useRef(false);
    useEffect(() => {
        if (featuredInitializedRef.current) return;
        const currentFeatured = featuredTools.filter((t: AdminTool) => t.isFeatured || t.listingType === 'featured');
        const ids = currentFeatured.map(t => t.id);

        setPendingFeaturedIds(ids);
        featuredInitializedRef.current = true;
    }, [featuredTools]);

    // Current featured tools based on pending changes
    const allFeaturedTools = useMemo(() => {
        return pendingFeaturedIds
            .map(id => featuredTools.find(t => t.id === id) || availableToolsRaw.find(t => t.id === id) || pendingToolsCacheRef.current.get(id))
            .filter((t): t is AdminTool => t !== undefined);
    }, [featuredTools, availableToolsRaw, pendingFeaturedIds]);

    // Regular (non-featured) tools from server-paginated results
    const regularTools = useMemo(() => {
        return availableToolsRaw.filter((t: AdminTool) => !pendingFeaturedIds.includes(t.id) && !t.spotlightEnabled);
    }, [availableToolsRaw, pendingFeaturedIds]);

    // Filter featured tools by search
    const filteredFeaturedTools = useMemo(() => {
        if (!featuredSearch) return allFeaturedTools;
        const searchLower = featuredSearch.toLowerCase();
        return allFeaturedTools.filter((t: AdminTool) =>
            (t.name || '').toLowerCase().includes(searchLower) ||
            (t.categoryName || []).some((cat: string) => (cat || '').toLowerCase().includes(searchLower))
        );
    }, [allFeaturedTools, featuredSearch]);

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

    // Pagination for regular tools — use server pagination
    const totalPages = apiTotalPages;
    const totalCount = availableTotal ?? filteredRegularTools.length;
    const startIndex = (availablePage - 1) * ITEMS_PER_PAGE;
    const paginatedTools = filteredRegularTools;

    const handleSearch = (value: string) => {
        setSearch(value);
        setAvailablePage(1);
    };

    const handleFeaturedSearch = (value: string) => {
        setFeaturedSearch(value);
        setFeaturedPage(1);
    };

    const handleAddToFeatured = (toolId: string) => {
        const tool = availableToolsRaw.find(t => t.id === toolId);
        if (tool) pendingToolsCacheRef.current.set(toolId, tool);
        setPendingFeaturedIds(prev => [...prev, toolId]);
        setHasChanges(true);
        showToast(`Added "${tool?.name || 'Tool'}" - Click Save to apply`, 'info');
    };

    const handleRemoveFromFeatured = (toolId: string) => {
        const tool = featuredTools.find(t => t.id === toolId) || availableToolsRaw.find(t => t.id === toolId);
        // Don't allow removing spotlight tools
        if (tool?.spotlightEnabled) {
            showToast('Cannot remove spotlight tools from featured. Remove from Spotlight first.', 'error');
            return;
        }
        setPendingFeaturedIds(prev => prev.filter(id => id !== toolId));
        setHasChanges(true);
        showToast(`Removed "${tool?.name || 'Tool'}" - Click Save to apply`, 'info');
    };

    const handleSaveAll = async () => {
        showToast('Saving featured changes...', 'info');
        setSaving(true);
        try {
            const currentFeatured = featuredTools.filter((t: AdminTool) => (t.isFeatured || t.listingType === 'featured') && !t.spotlightEnabled);
            const currentIds = new Set(currentFeatured.map((t: AdminTool) => t.id));
            const pendingSet = new Set(pendingFeaturedIds);

            const updates: Promise<void>[] = [];

            // Remove tools that were featured but no longer are (except spotlights)
            for (const tool of currentFeatured) {
                if (!pendingSet.has(tool.id) && !tool.spotlightEnabled) {
                    // Only update if actually changed
                    if (tool.isFeatured || tool.listingType === 'featured') {
                        updates.push(updateTool(tool.id, { isFeatured: false, listingType: 'free' }));
                    }
                }
            }

            // Add tools that are now featured
            for (const toolId of pendingFeaturedIds) {
                const tool = featuredTools.find((t: AdminTool) => t.id === toolId) || availableToolsRaw.find((t: AdminTool) => t.id === toolId);
                if (tool && !currentIds.has(toolId) && !tool.spotlightEnabled) {
                    updates.push(updateTool(toolId, { isFeatured: true, listingType: 'featured' }));
                }
            }

            await Promise.all(updates);
            setHasChanges(false);
            showToast('Featured tools saved successfully!', 'success');
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
                    Loading featured tools...
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
                        <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Featured Tools</h1>
                        <p className="text-xs sm:text-sm text-text-tertiary mt-0.5 sm:mt-1">Boosted tools appear more frequently in search and lists</p>
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
                <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-4 sm:mb-6">
                    <div className="bg-bg-card border border-border rounded-xl p-3 sm:p-4 text-center">
                        <div className="text-xl sm:text-2xl font-bold text-accent-primary">{allFeaturedTools.length}</div>
                        <div className="text-[10px] sm:text-xs text-text-tertiary">Featured</div>
                    </div>
                    <div className="bg-bg-card border border-border rounded-xl p-3 sm:p-4 text-center">
                        <div className="text-xl sm:text-2xl font-bold text-accent-green">{Math.max(0, (initialTotal || availableTotal) - allFeaturedTools.length)}</div>
                        <div className="text-[10px] sm:text-xs text-text-tertiary">Available</div>
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

                        <div className={`divide-y divide-border max-h-[400px] overflow-y-auto transition-opacity duration-200 ${availableLoading ? 'opacity-50' : ''}`}>
                            {availableLoading && paginatedTools.length === 0 ? (
                                <div className="p-6 sm:p-8 flex items-center justify-center gap-2 text-text-tertiary text-sm">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Loading tools...
                                </div>
                            ) : paginatedTools.length === 0 ? (
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
                                            onClick={() => handleAddToFeatured(tool.id)}
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
                                    {startIndex + 1}-{Math.min(startIndex + paginatedTools.length, totalCount)} of {totalCount}
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setAvailablePage(Math.max(1, availablePage - 1))}
                                        disabled={availablePage === 1}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-sm text-text-secondary hover:bg-bg-secondary disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                        Previous
                                    </button>
                                    <span className="text-sm text-text-tertiary">
                                        {availablePage}/{totalPages}
                                    </span>
                                    <button
                                        onClick={() => setAvailablePage(Math.min(totalPages, availablePage + 1))}
                                        disabled={availablePage >= totalPages}
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
                                paginatedFeaturedTools.map((tool: AdminTool) => (
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
                                                {tool.spotlightEnabled && (
                                                    <span className="px-1.5 py-0.5 text-[10px] font-medium bg-amber-500/20 text-amber-400 rounded">Spotlight</span>
                                                )}
                                            </div>
                                            <div className="text-xs text-text-tertiary truncate">{(tool.categoryName || []).slice(0, 2).join(', ') || '-'}</div>
                                        </div>
                                        {tool.spotlightEnabled ? (
                                            <span className="text-[10px] text-text-tertiary">via Spotlight</span>
                                        ) : (
                                            <button
                                                onClick={() => handleRemoveFromFeatured(tool.id)}
                                                className="p-1 text-text-tertiary hover:text-accent-red"
                                                title="Remove"
                                            >
                                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                                            </button>
                                        )}
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
