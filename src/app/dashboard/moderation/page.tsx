'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useSWR, { useSWRConfig } from 'swr';
import { useAdmin, AdminTool } from '@/context/AdminContext';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmModal';
import { renderIcon } from '@/components/features/admin/AdminLayout';
import { SafeHtml } from '@/components/ui/SafeHtml';
import FullPreview from '@/components/features/admin/ToolForm/FullPreview';
import { Eye, Pencil, ChevronLeft, ChevronRight, Search, Trash2, CheckCircle2, XCircle } from 'lucide-react';

type TabType = 'pending' | 'draft' | 'published' | 'unpublished';

const ITEMS_PER_PAGE = 25;

// SWR fetcher
const fetcher = (url: string) => fetch(url).then(res => res.json());

interface PaginatedToolsResponse {
    data: AdminTool[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// Helper to format relative time
const formatTimeAgo = (dateStr: string | undefined): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffHours < 1) return 'Recently';
    if (diffHours < 24) return `Recently ${diffHours} hrs`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
};


export default function ModerationPage() {
    const router = useRouter();
    const { categories, tasks, updateTool } = useAdmin();
    const { showToast, updateToast } = useToast();
    const { confirm } = useConfirm();
    const { mutate: globalMutate } = useSWRConfig();
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [selectAllMode, setSelectAllMode] = useState<'none' | 'page' | 'all'>('none'); // Gmail-style selection
    const [activeTab, setActiveTab] = useState<TabType>('pending');
    const [previewTool, setPreviewTool] = useState<AdminTool | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [tabLoading, setTabLoading] = useState(false); // Track loading on explicit tab switch only

    // Debounce search to avoid too many API calls (500ms delay)
    useEffect(() => {
        const trimmed = searchQuery.trim();
        // Skip if unchanged
        if (trimmed === debouncedSearch) return;

        const timer = setTimeout(() => {
            setDebouncedSearch(trimmed);
            setCurrentPage(1); // Reset to page 1 when search changes
        }, 500);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery]);

    // Build API URL with pagination, status filter, and search
    const apiUrl = debouncedSearch
        ? `/api/tools?page=${currentPage}&limit=${ITEMS_PER_PAGE}&status=${activeTab}&search=${encodeURIComponent(debouncedSearch)}`
        : `/api/tools?page=${currentPage}&limit=${ITEMS_PER_PAGE}&status=${activeTab}`;

    // Helper to revalidate all tool-related SWR caches
    const revalidateAllTools = () => {
        // Revalidate all SWR caches that match /api/tools
        globalMutate((key: string) => typeof key === 'string' && key.startsWith('/api/tools'), undefined, { revalidate: true });
    };

    // Fetch tools with SWR for active tab
    const { data: toolsData, isLoading: toolsLoading, mutate } = useSWR<PaginatedToolsResponse>(
        apiUrl,
        fetcher,
        { revalidateOnFocus: false, revalidateOnMount: true, dedupingInterval: 0 }
    );

    // Fetch counts for all tabs (just first page with limit 1 to get total)
    const { data: pendingCount } = useSWR<PaginatedToolsResponse>(
        '/api/tools?page=1&limit=1&status=pending',
        fetcher,
        { revalidateOnFocus: false }
    );
    const { data: draftCount } = useSWR<PaginatedToolsResponse>(
        '/api/tools?page=1&limit=1&status=draft',
        fetcher,
        { revalidateOnFocus: false }
    );
    const { data: publishedCount } = useSWR<PaginatedToolsResponse>(
        '/api/tools?page=1&limit=1&status=published',
        fetcher,
        { revalidateOnFocus: false }
    );
    const { data: unpublishedCount } = useSWR<PaginatedToolsResponse>(
        '/api/tools?page=1&limit=1&status=unpublished',
        fetcher,
        { revalidateOnFocus: false }
    );

    // Get tools from the data (show existing data while revalidating in background)
    const tools = tabLoading ? [] : (toolsData?.data || []);
    const pagination = toolsData?.pagination;

    // No client-side filtering needed - search is server-side now
    const filteredTools = tabLoading ? [] : tools;

    // Reset page and selection when tab changes
    const handleTabChange = (tab: TabType) => {
        if (tab === activeTab) return; // Don't reload if same tab
        setTabLoading(true); // Show loading immediately
        setActiveTab(tab);
        setCurrentPage(1);
        setSearchQuery('');
        setSelectedIds(new Set()); // Clear selection when switching tabs
    };

    // Clear tabLoading when new data arrives after a tab switch
    useEffect(() => {
        if (tabLoading && !toolsLoading && toolsData) {
            setTabLoading(false);
        }
    }, [tabLoading, toolsLoading, toolsData]);

    // Only count selections that are in the current tab's filtered tools
    const currentTabSelectedIds = useMemo(() => {
        const filteredIds = new Set(filteredTools.map(t => t.id));
        return new Set([...selectedIds].filter(id => filteredIds.has(id)));
    }, [selectedIds, filteredTools]);

    const allOnPageSelected = filteredTools.length > 0 &&
        filteredTools.every(t => selectedIds.has(t.id));
    const someSelected = selectAllMode === 'all' || currentTabSelectedIds.size > 0;

    // Total count for bulk operations
    const totalSelectedCount = selectAllMode === 'all'
        ? (pagination?.total || 0)
        : (typeof currentTabSelectedIds.size === 'number' ? currentTabSelectedIds.size : 0);

    const toggleSelect = (id: string) => {
        setSelectAllMode('none'); // Clear "select all" mode when toggling individual
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const selectPage = () => {
        setSelectAllMode('page');
        setSelectedIds(new Set(filteredTools.map((t: AdminTool) => t.id)));
    };

    const selectAll = () => {
        setSelectAllMode('all');
        // For "all" mode, we don't populate selectedIds - bulk handlers will fetch all
    };

    const clearSelection = () => {
        setSelectAllMode('none');
        setSelectedIds(new Set());
    };

    // Helper to get IDs for bulk operations - fetches all IDs from server if 'select all' mode
    const getIdsForBulkOperation = async (): Promise<string[]> => {
        if (selectAllMode === 'all') {
            // Include current search query in the request to respect filtering
            const searchParam = debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : '';
            let response: Response;
            try {
                response = await fetch(`/api/tools?limit=10000&status=${activeTab}${searchParam}`);
            } catch (networkError) {
                throw new Error(`Network error fetching tools: ${networkError instanceof Error ? networkError.message : 'Unknown error'}`);
            }

            if (!response.ok) {
                throw new Error(`Failed to fetch tools: HTTP ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            // Validate response shape
            if (!data || !Array.isArray(data.data)) {
                throw new Error('Invalid response shape: expected { data: [...] }');
            }

            return data.data.map((t: AdminTool) => t.id);
        }
        return [...currentTabSelectedIds];
    };

    const handleApprove = async (toolId: string) => {
        const tool = tools.find(t => t.id === toolId);
        const toastId = showToast(`Approving "${tool?.name}"...`, 'loading');
        try {
            await updateTool(toolId, { status: 'published' });
            revalidateAllTools();
            updateToast(toastId, `"${tool?.name}" published!`, 'success');
            setSelectedIds(prev => { const next = new Set(prev); next.delete(toolId); return next; });
        } catch (err: any) {
            const message = err?.message || 'Failed to approve';
            updateToast(toastId, message, 'error');
        }
    };

    const handleReject = async (toolId: string) => {
        const tool = tools.find(t => t.id === toolId);
        const confirmed = await confirm({
            title: 'Reject Tool',
            message: `Are you sure you want to reject "${tool?.name}"? It will be moved back to draft status.`,
            confirmText: 'Reject',
            cancelText: 'Cancel',
            danger: true
        });
        if (!confirmed) return;

        const toastId = showToast(`Rejecting "${tool?.name}"...`, 'loading');
        try {
            const rejectionNote = { note: 'Rejected', createdAt: new Date().toISOString() };
            await updateTool(toolId, {
                status: 'draft',
                internalNotes: [...(tool?.internalNotes || []), rejectionNote]
            });
            revalidateAllTools();
            updateToast(toastId, `"${tool?.name}" rejected`, 'success');
            setSelectedIds(prev => { const next = new Set(prev); next.delete(toolId); return next; });
        } catch (err: any) {
            const message = err?.message || 'Failed to reject';
            updateToast(toastId, message, 'error');
        }
    };

    const handleBulkApprove = async () => {
        const count = selectAllMode === 'all' ? (pagination?.total || 0) : currentTabSelectedIds.size;
        if (count === 0) return;
        const confirmed = await confirm({
            title: 'Bulk Approve',
            message: `Approve ${count} selected tool${count > 1 ? 's' : ''}?`,
            confirmText: 'Approve All',
            cancelText: 'Cancel'
        });
        if (!confirmed) return;

        const toastId = showToast(`Approving 0/${count} tools...`, 'loading');
        try {
            const ids = await getIdsForBulkOperation();
            for (let i = 0; i < ids.length; i++) {
                await updateTool(ids[i], { status: 'published' });
                updateToast(toastId, `Approving ${i + 1}/${ids.length} tools...`, 'loading');
            }
            revalidateAllTools();
            updateToast(toastId, `${ids.length} tools published!`, 'success');
            clearSelection();
        } catch (err: any) {
            const message = err?.message || 'Failed to approve some tools';
            updateToast(toastId, message, 'error');
        }
    };

    const handleBulkReject = async () => {
        const count = selectAllMode === 'all' ? (pagination?.total || 0) : currentTabSelectedIds.size;
        if (count === 0) return;
        const confirmed = await confirm({
            title: 'Bulk Reject',
            message: `Reject ${count} selected tool${count > 1 ? 's' : ''}? They will be moved to draft.`,
            confirmText: 'Reject All',
            cancelText: 'Cancel',
            danger: true
        });
        if (!confirmed) return;

        const toastId = showToast(`Rejecting 0/${count} tools...`, 'loading');
        try {
            const ids = await getIdsForBulkOperation();
            for (let i = 0; i < ids.length; i++) {
                // Fetch existing tool to preserve internalNotes
                const toolRes = await fetch(`/api/tools/${ids[i]}`);
                if (!toolRes.ok) {
                    // Skip this tool to avoid losing existing notes
                    console.warn(`[Bulk Reject] Skipping tool ${ids[i]}: fetch failed with ${toolRes.status}`);
                    updateToast(toastId, `Rejecting ${i + 1}/${ids.length} tools (skipped ${ids[i]})...`, 'loading');
                    continue;
                }

                const toolData = await toolRes.json();
                const existingNotes: any[] = toolData?.internalNotes || [];

                const rejectionNote = { note: 'Bulk rejected', createdAt: new Date().toISOString() };
                await updateTool(ids[i], {
                    status: 'draft',
                    internalNotes: [...existingNotes, rejectionNote]
                });
                updateToast(toastId, `Rejecting ${i + 1}/${ids.length} tools...`, 'loading');
            }
            revalidateAllTools();
            updateToast(toastId, `${ids.length} tools rejected`, 'success');
            clearSelection();
        } catch (err: any) {
            const message = err?.message || 'Failed to reject some tools';
            updateToast(toastId, message, 'error');
        }
    };

    const handleDelete = async (toolId: string) => {
        const tool = tools.find(t => t.id === toolId);
        const confirmed = await confirm({
            title: 'Delete Tool Permanently',
            message: `Are you sure you want to permanently delete "${tool?.name}"? This action cannot be undone.`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            danger: true
        });
        if (!confirmed) return;

        const toastId = showToast(`Deleting "${tool?.name}"...`, 'loading');
        try {
            const response = await fetch(`/api/tools/${toolId}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to delete');
            revalidateAllTools();
            updateToast(toastId, `"${tool?.name}" deleted permanently`, 'success');
            setSelectedIds(prev => { const next = new Set(prev); next.delete(toolId); return next; });
        } catch (err: any) {
            const message = err?.message || 'Failed to delete tool';
            updateToast(toastId, message, 'error');
        }
    };

    const handleBulkDelete = async () => {
        const count = selectAllMode === 'all' ? (pagination?.total || 0) : currentTabSelectedIds.size;
        if (count === 0) return;
        const confirmed = await confirm({
            title: 'Bulk Delete',
            message: `Permanently delete ${count} selected tool${count > 1 ? 's' : ''}? This cannot be undone.`,
            confirmText: 'Delete All',
            cancelText: 'Cancel',
            danger: true
        });
        if (!confirmed) return;

        const toastId = showToast(`Deleting 0/${count} tools...`, 'loading');
        try {
            const ids = await getIdsForBulkOperation();
            let successCount = 0;
            let failedCount = 0;
            const failedIds: string[] = [];

            for (let i = 0; i < ids.length; i++) {
                const response = await fetch(`/api/tools/${ids[i]}`, { method: 'DELETE' });
                if (response.ok) {
                    successCount++;
                } else {
                    failedCount++;
                    failedIds.push(ids[i]);
                    console.error(`[Bulk Delete] Failed to delete tool ${ids[i]}:`, response.status);
                }
                updateToast(toastId, `Deleting ${i + 1}/${ids.length} tools...`, 'loading');
            }

            revalidateAllTools();

            // Show appropriate result message
            if (failedCount === 0) {
                updateToast(toastId, `${successCount} tools deleted`, 'success');
            } else if (successCount === 0) {
                updateToast(toastId, `Failed to delete ${failedCount} tools`, 'error');
            } else {
                updateToast(toastId, `Deleted ${successCount} tools, ${failedCount} failed`, 'warning');
            }

            clearSelection();
        } catch (err: any) {
            const message = err?.message || 'Failed to delete some tools';
            updateToast(toastId, message, 'error');
        }
    };

    const handleBulkUnpublish = async () => {
        const count = selectAllMode === 'all' ? (pagination?.total || 0) : currentTabSelectedIds.size;
        if (count === 0) return;
        const confirmed = await confirm({
            title: 'Bulk Unpublish',
            message: `Unpublish ${count} selected tool${count > 1 ? 's' : ''}? They will no longer be visible.`,
            confirmText: 'Unpublish All',
            cancelText: 'Cancel',
            danger: true
        });
        if (!confirmed) return;

        const toastId = showToast(`Unpublishing 0/${count} tools...`, 'loading');
        try {
            const ids = await getIdsForBulkOperation();
            for (let i = 0; i < ids.length; i++) {
                await updateTool(ids[i], { status: 'unpublished' });
                updateToast(toastId, `Unpublishing ${i + 1}/${ids.length} tools...`, 'loading');
            }
            revalidateAllTools();
            updateToast(toastId, `${ids.length} tools unpublished`, 'success');
            clearSelection();
        } catch (err: any) {
            const message = err?.message || 'Failed to unpublish some tools';
            updateToast(toastId, message, 'error');
        }
    };

    const handleBulkMoveToDraft = async () => {
        const count = selectAllMode === 'all' ? (pagination?.total || 0) : currentTabSelectedIds.size;
        if (count === 0) return;
        const confirmed = await confirm({
            title: 'Move to Draft',
            message: `Move ${count} selected tool${count > 1 ? 's' : ''} to draft?`,
            confirmText: 'Move All',
            cancelText: 'Cancel'
        });
        if (!confirmed) return;

        const toastId = showToast(`Moving 0/${count} tools to draft...`, 'loading');
        try {
            const ids = await getIdsForBulkOperation();
            for (let i = 0; i < ids.length; i++) {
                await updateTool(ids[i], { status: 'draft' });
                updateToast(toastId, `Moving ${i + 1}/${ids.length} tools to draft...`, 'loading');
            }
            revalidateAllTools();
            updateToast(toastId, `${ids.length} tools moved to draft`, 'success');
            clearSelection();
        } catch (err: any) {
            const message = err?.message || 'Failed to move some tools to draft';
            updateToast(toastId, message, 'error');
        }
    };

    const handleBulkMoveToReview = async () => {
        const count = selectAllMode === 'all' ? (pagination?.total || 0) : currentTabSelectedIds.size;
        if (count === 0) return;
        const confirmed = await confirm({
            title: 'Move to Review',
            message: `Move ${count} selected tool${count > 1 ? 's' : ''} to review queue?`,
            confirmText: 'Move All',
            cancelText: 'Cancel'
        });
        if (!confirmed) return;

        const toastId = showToast(`Moving 0/${count} tools to review...`, 'loading');
        try {
            const ids = await getIdsForBulkOperation();
            for (let i = 0; i < ids.length; i++) {
                await updateTool(ids[i], { status: 'pending' });
                updateToast(toastId, `Moving ${i + 1}/${ids.length} tools to review...`, 'loading');
            }
            revalidateAllTools();
            updateToast(toastId, `${ids.length} tools moved to review`, 'success');
            clearSelection();
        } catch (err: any) {
            const message = err?.message || 'Failed to move some tools to review';
            updateToast(toastId, message, 'error');
        }
    };

    // Only show full loading screen on initial load (when no cached data)
    if (toolsLoading && !toolsData) {
        return (
            <div className="min-h-screen p-8 bg-bg-primary flex items-center justify-center">
                <div className="text-text-secondary">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 md:p-6 bg-bg-primary">
            <div className="max-w-[1200px] mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-text-primary capitalize">{activeTab} Tools</h1>
                        <p className="text-sm text-text-tertiary mt-1">
                            {pagination ? `${pagination.total} tools` : 'Loading...'}
                        </p>
                    </div>
                    {someSelected && (
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm text-text-secondary">
                                {selectAllMode === 'all' ? `All ${totalSelectedCount}` : totalSelectedCount} selected
                            </span>
                            {activeTab === 'pending' && (
                                <>
                                    <button onClick={handleBulkReject} className="px-3 py-1.5 text-sm text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-400/10 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-400/20 transition-colors">
                                        Reject Selected
                                    </button>
                                    <button onClick={handleBulkApprove} className="px-3 py-1.5 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors">
                                        Approve Selected
                                    </button>
                                    <button onClick={handleBulkDelete} className="px-3 py-1.5 text-sm text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-400/10 rounded-lg hover:bg-red-100 dark:hover:bg-red-400/20 transition-colors">
                                        Delete Selected
                                    </button>
                                </>
                            )}
                            {activeTab === 'draft' && (
                                <>
                                    <button onClick={handleBulkMoveToReview} className="px-3 py-1.5 text-sm text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-400/10 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-400/20 transition-colors">
                                        Move to Review
                                    </button>
                                    <button onClick={handleBulkDelete} className="px-3 py-1.5 text-sm text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-400/10 rounded-lg hover:bg-red-100 dark:hover:bg-red-400/20 transition-colors">
                                        Delete Selected
                                    </button>
                                </>
                            )}
                            {activeTab === 'published' && (
                                <>
                                    <button onClick={handleBulkUnpublish} className="px-3 py-1.5 text-sm text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-400/10 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-400/20 transition-colors">
                                        Unpublish Selected
                                    </button>
                                    <button onClick={handleBulkMoveToDraft} className="px-3 py-1.5 text-sm text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-400/10 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-400/20 transition-colors">
                                        Move to Draft
                                    </button>
                                    <button onClick={handleBulkMoveToReview} className="px-3 py-1.5 text-sm text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-400/10 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-400/20 transition-colors">
                                        Move to Review
                                    </button>
                                    <button onClick={handleBulkDelete} className="px-3 py-1.5 text-sm text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-400/10 rounded-lg hover:bg-red-100 dark:hover:bg-red-400/20 transition-colors">
                                        Delete Selected
                                    </button>
                                </>
                            )}
                            {activeTab === 'unpublished' && (
                                <>
                                    <button onClick={handleBulkApprove} className="px-3 py-1.5 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors">
                                        Republish Selected
                                    </button>
                                    <button onClick={handleBulkMoveToDraft} className="px-3 py-1.5 text-sm text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-400/10 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-400/20 transition-colors">
                                        Move to Draft
                                    </button>
                                    <button onClick={handleBulkMoveToReview} className="px-3 py-1.5 text-sm text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-400/10 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-400/20 transition-colors">
                                        Move to Review
                                    </button>
                                    <button onClick={handleBulkDelete} className="px-3 py-1.5 text-sm text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-400/10 rounded-lg hover:bg-red-100 dark:hover:bg-red-400/20 transition-colors">
                                        Delete Selected
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Search Bar */}
                <div className="mb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                        <input
                            type="text"
                            placeholder="Search tools..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-bg-secondary border border-border rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
                        />
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-4 bg-bg-tertiary rounded-lg p-1 overflow-x-auto">
                    <button
                        onClick={() => handleTabChange('pending')}
                        className={`flex-1 min-w-[80px] px-3 md:px-4 py-2 text-xs md:text-sm font-medium rounded-md transition-all whitespace-nowrap ${activeTab === 'pending' ? 'bg-bg-card text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                    >
                        Pending {pendingCount?.pagination ? `(${pendingCount.pagination.total})` : ''}
                    </button>
                    <button
                        onClick={() => handleTabChange('draft')}
                        className={`flex-1 min-w-[80px] px-3 md:px-4 py-2 text-xs md:text-sm font-medium rounded-md transition-all whitespace-nowrap ${activeTab === 'draft' ? 'bg-bg-card text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                    >
                        Draft {draftCount?.pagination ? `(${draftCount.pagination.total})` : ''}
                    </button>
                    <button
                        onClick={() => handleTabChange('published')}
                        className={`flex-1 min-w-[80px] px-3 md:px-4 py-2 text-xs md:text-sm font-medium rounded-md transition-all whitespace-nowrap ${activeTab === 'published' ? 'bg-bg-card text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                    >
                        Published {publishedCount?.pagination ? `(${publishedCount.pagination.total})` : ''}
                    </button>
                    <button
                        onClick={() => handleTabChange('unpublished')}
                        className={`flex-1 min-w-[80px] px-3 md:px-4 py-2 text-xs md:text-sm font-medium rounded-md transition-all whitespace-nowrap ${activeTab === 'unpublished' ? 'bg-bg-card text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                    >
                        Unpub {unpublishedCount?.pagination ? `(${unpublishedCount.pagination.total})` : ''}
                    </button>
                </div>

                {/* Content Card */}
                <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                        <h2 className="text-base font-semibold text-text-primary">
                            {activeTab === 'pending' && 'Review Queue'}
                            {activeTab === 'draft' && 'Draft Tools'}
                            {activeTab === 'published' && 'Published Tools'}
                            {activeTab === 'unpublished' && 'Unpublished Tools'}
                        </h2>
                        {filteredTools.length > 0 && (
                            <div className="flex items-center gap-3">
                                <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={allOnPageSelected || selectAllMode === 'all'}
                                        onChange={() => allOnPageSelected || selectAllMode === 'all' ? clearSelection() : selectPage()}
                                        className="w-4 h-4 rounded border-border text-accent-primary focus:ring-accent-primary cursor-pointer"
                                    />
                                    Select All
                                </label>
                                {/* Gmail-style: when page is selected, show "Select all X" link */}
                                {allOnPageSelected && selectAllMode !== 'all' && pagination && pagination.total > filteredTools.length && (
                                    <button onClick={selectAll} className="text-sm text-accent-primary hover:underline">
                                        Select all {pagination.total}
                                    </button>
                                )}
                                {selectAllMode === 'all' && (
                                    <span className="text-sm text-accent-primary font-medium">All {pagination?.total} selected</span>
                                )}
                                {someSelected && (
                                    <>
                                        <span className="text-text-tertiary">|</span>
                                        <button onClick={clearSelection} className="text-sm text-accent-red hover:underline">
                                            Clear
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="divide-y divide-border">
                        {/* Show loading only during explicit tab switch, not during background revalidation */}
                        {(tabLoading || (toolsLoading && !toolsData)) ? (
                            <div className="p-12 text-center text-text-tertiary">
                                <div className="w-10 h-10 mx-auto mb-3 border-2 border-accent-primary border-t-transparent rounded-full animate-spin"></div>
                                <div className="font-medium">Loading...</div>
                                <p className="text-sm mt-1">Fetching tools</p>
                            </div>
                        ) : filteredTools.length === 0 ? (
                            <div className="p-12 text-center text-text-tertiary">
                                <svg className="w-10 h-10 text-accent-green mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <path d="M9 12l2 2 4-4"></path>
                                </svg>
                                <div className="font-medium">
                                    {searchQuery ? 'No matching tools'
                                        : activeTab === 'pending' ? 'All caught up!'
                                            : activeTab === 'draft' ? 'No draft tools'
                                                : activeTab === 'unpublished' ? 'No unpublished tools'
                                                    : 'No published tools'}
                                </div>
                                <p className="text-sm mt-1">
                                    {searchQuery ? 'Try a different search term'
                                        : activeTab === 'pending' ? 'No tools pending review'
                                            : activeTab === 'draft' ? 'No tools in draft status'
                                                : activeTab === 'unpublished' ? 'No tools have been unpublished'
                                                    : 'No tools have been published yet'}
                                </p>
                            </div>
                        ) : (
                            filteredTools.map((tool) => (
                                <div key={tool.id} className={`p-3 md:p-5 transition-colors ${selectedIds.has(tool.id) ? 'bg-accent-primary/5' : 'hover:bg-bg-secondary'}`}>
                                    <div className="flex items-start gap-2 md:gap-4">
                                        <input type="checkbox" checked={selectedIds.has(tool.id)} onChange={() => toggleSelect(tool.id)}
                                            className="mt-1 w-4 h-4 rounded border-border text-accent-primary focus:ring-accent-primary flex-shrink-0" />
                                        {tool.logoUrl ? (
                                            <img src={tool.logoUrl} alt="" className="w-8 h-8 md:w-12 md:h-12 rounded-lg object-contain flex-shrink-0" />
                                        ) : (
                                            <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg bg-accent-primary-bg flex items-center justify-center text-accent-primary font-bold text-sm md:text-base flex-shrink-0">
                                                {tool.name[0]}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-1 md:gap-2 mb-1">
                                                <h3 className="font-semibold text-text-primary text-sm md:text-base truncate">{tool.name}</h3>
                                                {tool.listingType === 'verified' && (
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#1d9bf0" className="flex-shrink-0">
                                                        <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" />
                                                    </svg>
                                                )}
                                                {(tool.listingType === 'featured' || tool.listingType === 'spotlight') && (
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b" className="flex-shrink-0">
                                                        <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" />
                                                    </svg>
                                                )}
                                                <span className={`text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 rounded-full flex-shrink-0 ${tool.status === 'pending' ? 'bg-blue-500/10 text-blue-500'
                                                    : tool.status === 'published' ? 'bg-green-500/10 text-green-500'
                                                        : tool.status === 'draft' ? 'bg-yellow-500/10 text-yellow-500'
                                                            : 'bg-gray-500/10 text-gray-500'
                                                    }`}>
                                                    {tool.status}
                                                </span>
                                            </div>
                                            <p className="text-xs md:text-sm text-text-secondary line-clamp-1 md:line-clamp-2">{tool.summary || tool.description}</p>
                                            <div className="flex flex-wrap items-center gap-1 md:gap-1.5 mt-1 md:mt-2 text-[10px] md:text-xs text-text-tertiary">
                                                <svg className="w-3 h-3 md:w-3.5 md:h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                                {tool.status === 'published' && (
                                                    <>
                                                        <span
                                                            className="cursor-help underline decoration-dotted"
                                                            title={`Listed: ${new Date(tool.createdAt || new Date()).toLocaleString()}${tool.updatedAt && tool.updatedAt !== tool.createdAt ? `\nUpdated: ${new Date(tool.updatedAt).toLocaleString()}` : ''}`}
                                                        >
                                                            {formatTimeAgo(tool.updatedAt || tool.createdAt) || 'Recently'}
                                                        </span>
                                                        <span className="hidden md:inline text-text-quaternary">•</span>
                                                        <span className="hidden md:inline">Listed {new Date(tool.createdAt || new Date()).toLocaleString()}</span>
                                                    </>
                                                )}
                                                {tool.status === 'pending' && (
                                                    <>
                                                        <span
                                                            className="cursor-help underline decoration-dotted"
                                                            title={`Submitted: ${new Date(tool.createdAt || new Date()).toLocaleString()}`}
                                                        >
                                                            {formatTimeAgo(tool.createdAt) || 'Recently'}
                                                        </span>
                                                        <span className="hidden md:inline text-text-quaternary">•</span>
                                                        <span className="hidden md:inline">Submitted {new Date(tool.createdAt || new Date()).toLocaleString()}</span>
                                                    </>
                                                )}
                                                {tool.status === 'draft' && (
                                                    <>
                                                        <span
                                                            className="cursor-help underline decoration-dotted"
                                                            title={`Created: ${new Date(tool.createdAt || new Date()).toLocaleString()}${tool.updatedAt && tool.updatedAt !== tool.createdAt ? `\nEdited: ${new Date(tool.updatedAt).toLocaleString()}` : ''}`}
                                                        >
                                                            {formatTimeAgo(tool.updatedAt || tool.createdAt) || 'Recently'}
                                                        </span>
                                                        <span className="hidden md:inline text-text-quaternary">•</span>
                                                        <span className="hidden md:inline">Created {new Date(tool.createdAt || new Date()).toLocaleString()}</span>
                                                    </>
                                                )}
                                                {tool.status === 'unpublished' && (
                                                    <>
                                                        <span
                                                            className="cursor-help underline decoration-dotted"
                                                            title={`Unpublished: ${new Date(tool.updatedAt || new Date()).toLocaleString()}`}
                                                        >
                                                            {formatTimeAgo(tool.updatedAt) || 'Recently'}
                                                        </span>
                                                        <span className="hidden md:inline text-text-quaternary">•</span>
                                                        <span className="hidden md:inline">Unpublished {new Date(tool.updatedAt || new Date()).toLocaleString()}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-1 flex-shrink-0">
                                            <button
                                                onClick={() => setPreviewTool(tool)}
                                                className="p-1.5 text-text-tertiary hover:text-accent-primary hover:bg-accent-primary/10 rounded-lg transition-colors"
                                                title="Quick Preview"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <Link
                                                href={`/dashboard/tools/${tool.id}`}
                                                className="p-1.5 text-text-tertiary hover:text-accent-primary hover:bg-accent-primary/10 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Link>
                                            {activeTab === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => handleReject(tool.id)}
                                                        className="p-1 text-orange-500 hover:text-orange-600 hover:bg-orange-500/10 rounded-lg transition-colors"
                                                        title="Reject"
                                                    >
                                                        <XCircle className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleApprove(tool.id)}
                                                        className="p-1 text-green-600 hover:text-green-700 hover:bg-green-500/10 rounded-lg transition-colors"
                                                        title="Approve"
                                                    >
                                                        <CheckCircle2 className="w-5 h-5" />
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                onClick={() => handleDelete(tool.id)}
                                                className="p-1.5 text-text-tertiary hover:text-accent-red hover:bg-accent-red/10 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Pagination */}
                    {pagination && pagination.totalPages > 1 && (
                        <div className="px-5 py-4 border-t border-border flex items-center justify-between">
                            <span className="text-sm text-text-tertiary">
                                Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="text-sm text-text-secondary px-2">
                                    {currentPage} / {pagination.totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                                    disabled={currentPage === pagination.totalPages}
                                    className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Preview Modal - Using shared FullPreview component */}
            {
                previewTool && (
                    <FullPreview
                        data={{
                            name: previewTool.name,
                            summary: previewTool.summary,
                            description: previewTool.description,
                            logoUrl: previewTool.logoUrl,
                            status: previewTool.status,
                            pricing: previewTool.pricing,
                            pricingLabel: previewTool.pricingLabel,
                            categoryName: previewTool.categoryName,
                            taskName: previewTool.taskName,
                            websiteUrl: previewTool.websiteUrl,
                            affiliateUrl: previewTool.affiliateUrl,
                            affiliateEnabled: previewTool.affiliateEnabled,
                            tags: previewTool.tags,
                            pros: previewTool.pros,
                            cons: previewTool.cons,
                            coreFeatures: previewTool.coreFeatures,
                            useCases: previewTool.useCases,
                            faq: previewTool.faq,
                            images: previewTool.images,
                            videos: previewTool.videos,
                            pricingTiers: previewTool.pricingTiers,
                            socialLinks: previewTool.socialLinks ? Object.fromEntries(
                                Object.entries(previewTool.socialLinks).filter(([_, v]) => v != null)
                            ) as Record<string, string> : undefined,
                        }}
                        categories={categories}
                        tasks={tasks}
                        onClose={() => setPreviewTool(null)}
                    />
                )
            }
        </div >
    );
}
