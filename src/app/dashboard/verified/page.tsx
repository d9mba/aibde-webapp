'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAdmin, AdminTool } from '@/context/AdminContext';
import { useToast } from '@/components/ui/Toast';
import { Search, ChevronLeft, ChevronRight, Save, BadgeCheck } from 'lucide-react';

const ITEMS_PER_PAGE = 25;

export default function VerifiedPage() {
    const { tools, updateTool, isLoaded } = useAdmin();
    const { showToast } = useToast();
    const [search, setSearch] = useState('');
    const [verifiedSearch, setVerifiedSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [verifiedPage, setVerifiedPage] = useState(1);
    const [saving, setSaving] = useState(false);

    // Local state for pending changes
    const [pendingVerifiedIds, setPendingVerifiedIds] = useState<string[]>([]);
    const [hasChanges, setHasChanges] = useState(false);

    // Initialize from current data
    useEffect(() => {
        const currentVerified = tools.filter((t: AdminTool) => t.listingType === 'verified');
        const ids = currentVerified.map(t => t.id);

        if (pendingVerifiedIds.length === 0 && ids.length > 0) {
            setPendingVerifiedIds(ids);
        }
    }, [tools]);

    // Current verified tools based on pending changes
    const allVerifiedTools = useMemo(() => {
        return pendingVerifiedIds
            .map(id => tools.find(t => t.id === id))
            .filter((t): t is AdminTool => t !== undefined);
    }, [tools, pendingVerifiedIds]);

    // Helper to get existing listing type label for a tool
    const getExistingListingLabel = (tool: AdminTool): string | null => {
        if (tool.spotlightEnabled) return 'Spotlight';
        if (tool.isFeatured || tool.listingType === 'featured') return 'Featured';
        if (tool.listingType === 'fast') return 'Fast';
        return null;
    };

    // Regular (non-verified) tools - show all published except verified
    const regularTools = useMemo(() => {
        return tools.filter((t: AdminTool) =>
            !pendingVerifiedIds.includes(t.id) &&
            t.status === 'published' &&
            t.listingType !== 'verified'
        );
    }, [tools, pendingVerifiedIds]);

    // Count of tools that can actually be added (no existing listing type)
    const availableCount = useMemo(() => {
        return regularTools.filter(t => !getExistingListingLabel(t)).length;
    }, [regularTools]);

    // Filter verified tools by search
    const filteredVerifiedTools = useMemo(() => {
        if (!verifiedSearch) return allVerifiedTools;
        const searchLower = verifiedSearch.toLowerCase();
        return allVerifiedTools.filter((t: AdminTool) =>
            (t.name || '').toLowerCase().includes(searchLower) ||
            (t.categoryName || []).some((cat: string) => (cat || '').toLowerCase().includes(searchLower))
        );
    }, [allVerifiedTools, verifiedSearch]);

    // Filter regular tools by search
    const filteredRegularTools = useMemo(() => {
        if (!search) return regularTools;
        const searchLower = search.toLowerCase();
        return regularTools.filter(t =>
            (t.name || '').toLowerCase().includes(searchLower) ||
            (t.categoryName || []).some(cat => (cat || '').toLowerCase().includes(searchLower))
        );
    }, [regularTools, search]);

    // Pagination for verified tools
    const verifiedTotalPages = Math.ceil(filteredVerifiedTools.length / ITEMS_PER_PAGE);
    const verifiedStartIndex = (verifiedPage - 1) * ITEMS_PER_PAGE;
    const paginatedVerifiedTools = filteredVerifiedTools.slice(verifiedStartIndex, verifiedStartIndex + ITEMS_PER_PAGE);

    // Pagination for regular tools
    const totalPages = Math.ceil(filteredRegularTools.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedTools = filteredRegularTools.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const handleSearch = (value: string) => {
        setSearch(value);
        setCurrentPage(1);
    };

    const handleVerifiedSearch = (value: string) => {
        setVerifiedSearch(value);
        setVerifiedPage(1);
    };

    const handleAddToVerified = (toolId: string) => {
        const tool = tools.find(t => t.id === toolId);
        setPendingVerifiedIds(prev => [...prev, toolId]);
        setHasChanges(true);
        showToast(`Added "${tool?.name || 'Tool'}" - Click Save to apply`, 'info');
    };

    const handleRemoveFromVerified = (toolId: string) => {
        const tool = tools.find(t => t.id === toolId);
        setPendingVerifiedIds(prev => prev.filter(id => id !== toolId));
        setHasChanges(true);
        showToast(`Removed "${tool?.name || 'Tool'}" - Click Save to apply`, 'info');
    };

    const handleSaveAll = async () => {
        showToast('Saving verified changes...', 'info');
        setSaving(true);
        try {
            const currentVerified = tools.filter(t => t.listingType === 'verified');
            const currentIds = new Set(currentVerified.map(t => t.id));
            const pendingSet = new Set(pendingVerifiedIds);

            const updates: Promise<void>[] = [];

            // Remove tools that were verified but no longer are
            for (const tool of currentVerified) {
                if (!pendingSet.has(tool.id)) {
                    updates.push(updateTool(tool.id, { listingType: 'free' }));
                }
            }

            // Add tools that are now verified
            for (const toolId of pendingVerifiedIds) {
                if (!currentIds.has(toolId)) {
                    updates.push(updateTool(toolId, { listingType: 'verified' }));
                }
            }

            await Promise.all(updates);
            setHasChanges(false);
            showToast('Verified tools saved successfully!', 'success');
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
                    Loading verified tools...
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
                            <BadgeCheck className="w-6 h-6 text-accent-green" />
                            Verified Tools
                        </h1>
                        <p className="text-xs sm:text-sm text-text-tertiary mt-0.5 sm:mt-1">Tools with verified badge (blue checkmark)</p>
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
                        <div className="text-xl sm:text-2xl font-bold text-accent-green">{allVerifiedTools.length}</div>
                        <div className="text-[10px] sm:text-xs text-text-tertiary">Verified</div>
                    </div>
                    <div className="bg-bg-card border border-border rounded-xl p-3 sm:p-4 text-center">
                        <div className="text-xl sm:text-2xl font-bold text-text-tertiary">{availableCount}</div>
                        <div className="text-[10px] sm:text-xs text-text-tertiary">Available</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {/* Add to Verified (Left) */}
                    <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
                        <div className="px-3 sm:px-5 py-3 sm:py-4 border-b border-border flex items-center gap-2">
                            <svg className="w-4 h-4 text-text-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
                            <h2 className="text-sm sm:text-base font-semibold text-text-primary">Add to Verified</h2>
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
                                    {search ? 'No tools match your search' : 'All tools are already verified'}
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
                                                    onClick={() => handleAddToVerified(tool.id)}
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

                    {/* Currently Verified (Right) */}
                    <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
                        <div className="px-3 sm:px-5 py-3 sm:py-4 border-b border-border flex items-center gap-2">
                            <BadgeCheck className="w-4 h-4 text-accent-green" />
                            <h2 className="text-sm sm:text-base font-semibold text-text-primary">Currently Verified</h2>
                        </div>

                        {/* Search Input */}
                        <div className="px-3 sm:px-5 py-2.5 sm:py-3 border-b border-border">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                                <input
                                    type="text"
                                    value={verifiedSearch}
                                    onChange={e => handleVerifiedSearch(e.target.value)}
                                    placeholder="Search verified..."
                                    className="w-full pl-10 pr-4 py-2 bg-bg-secondary border border-border rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-text-tertiary"
                                />
                            </div>
                        </div>

                        <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
                            {paginatedVerifiedTools.length === 0 ? (
                                <div className="p-6 sm:p-8 text-center text-text-tertiary text-sm">
                                    {verifiedSearch ? 'No verified tools match your search' : 'No verified tools yet'}
                                </div>
                            ) : (
                                paginatedVerifiedTools.map((tool: AdminTool) => (
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
                                                <BadgeCheck className="w-3.5 h-3.5 text-accent-green" />
                                            </div>
                                            <div className="text-xs text-text-tertiary truncate">{(tool.categoryName || []).slice(0, 2).join(', ') || '-'}</div>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveFromVerified(tool.id)}
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
                        {verifiedTotalPages > 1 && (
                            <div className="flex items-center justify-between px-3 sm:px-5 py-3 border-t border-border">
                                <span className="text-sm text-text-tertiary">
                                    {verifiedStartIndex + 1}-{Math.min(verifiedStartIndex + ITEMS_PER_PAGE, filteredVerifiedTools.length)} of {filteredVerifiedTools.length}
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setVerifiedPage(p => Math.max(1, p - 1))}
                                        disabled={verifiedPage === 1}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-sm text-text-secondary hover:bg-bg-secondary disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                        Previous
                                    </button>
                                    <span className="text-sm text-text-tertiary">
                                        {verifiedPage}/{verifiedTotalPages}
                                    </span>
                                    <button
                                        onClick={() => setVerifiedPage(p => Math.min(verifiedTotalPages, p + 1))}
                                        disabled={verifiedPage >= verifiedTotalPages}
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
