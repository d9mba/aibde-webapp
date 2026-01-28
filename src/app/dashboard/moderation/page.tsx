'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useSWR, { useSWRConfig } from 'swr';
import { useAdmin, AdminTool } from '@/context/AdminContext';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmModal';
import { renderIcon } from '@/components/features/admin/AdminLayout';
import { SafeHtml } from '@/components/ui/SafeHtml';
import FullPreview from '@/components/features/admin/ToolForm/FullPreview';
import { Eye, Pencil, ChevronLeft, ChevronRight, Search } from 'lucide-react';

type TabType = 'pending' | 'draft' | 'published';

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
    const [activeTab, setActiveTab] = useState<TabType>('pending');
    const [previewTool, setPreviewTool] = useState<AdminTool | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');

    // Build API URL with pagination and status filter
    const apiUrl = `/api/tools?page=${currentPage}&limit=${ITEMS_PER_PAGE}&status=${activeTab}`;

    // Helper to revalidate all tool-related SWR caches
    const revalidateAllTools = () => {
        // Revalidate all SWR caches that match /api/tools
        globalMutate((key: string) => typeof key === 'string' && key.startsWith('/api/tools'), undefined, { revalidate: true });
    };

    // Fetch tools with SWR for active tab
    const { data: toolsData, error: toolsError, isLoading: toolsLoading, mutate } = useSWR<PaginatedToolsResponse>(
        apiUrl,
        fetcher,
        { revalidateOnFocus: false, keepPreviousData: true }
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

    const tools = toolsData?.data || [];
    const pagination = toolsData?.pagination;

    // Client-side search filter
    const filteredTools = useMemo(() => {
        if (!searchQuery.trim()) return tools;
        return tools.filter(tool =>
            tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tool.summary?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [tools, searchQuery]);

    // Reset page when tab changes
    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab);
        setCurrentPage(1);
        setSearchQuery('');
    };

    const allSelected = filteredTools.length > 0 && selectedIds.size === filteredTools.length;
    const someSelected = selectedIds.size > 0;

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        if (allSelected) setSelectedIds(new Set());
        else setSelectedIds(new Set(filteredTools.map((t: AdminTool) => t.id)));
    };

    const handleApprove = async (toolId: string) => {
        const tool = tools.find(t => t.id === toolId);
        const toastId = showToast(`Approving "${tool?.name}"...`, 'loading');
        try {
            await updateTool(toolId, { status: 'published' });
            revalidateAllTools();
            updateToast(toastId, `"${tool?.name}" published!`, 'success');
            setSelectedIds(prev => { const next = new Set(prev); next.delete(toolId); return next; });
        } catch (err) {
            updateToast(toastId, 'Failed to approve', 'error');
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
        } catch (err) {
            updateToast(toastId, 'Failed to reject', 'error');
        }
    };

    const handleBulkApprove = async () => {
        if (selectedIds.size === 0) return;
        const confirmed = await confirm({
            title: 'Bulk Approve',
            message: `Approve ${selectedIds.size} selected tool${selectedIds.size > 1 ? 's' : ''}?`,
            confirmText: 'Approve All',
            cancelText: 'Cancel'
        });
        if (!confirmed) return;

        const toastId = showToast(`Approving ${selectedIds.size} tools...`, 'loading');
        try {
            for (const id of selectedIds) {
                await updateTool(id, { status: 'published' });
            }
            revalidateAllTools();
            updateToast(toastId, `${selectedIds.size} tools published!`, 'success');
            setSelectedIds(new Set());
        } catch (err) {
            updateToast(toastId, 'Failed to approve some tools', 'error');
        }
    };

    const handleBulkReject = async () => {
        if (selectedIds.size === 0) return;
        const confirmed = await confirm({
            title: 'Bulk Reject',
            message: `Reject ${selectedIds.size} selected tool${selectedIds.size > 1 ? 's' : ''}? They will be moved to draft.`,
            confirmText: 'Reject All',
            cancelText: 'Cancel',
            danger: true
        });
        if (!confirmed) return;

        const toastId = showToast(`Rejecting ${selectedIds.size} tools...`, 'loading');
        try {
            for (const id of selectedIds) {
                const tool = tools.find(t => t.id === id);
                const rejectionNote = { note: 'Bulk rejected', createdAt: new Date().toISOString() };
                await updateTool(id, {
                    status: 'draft',
                    internalNotes: [...(tool?.internalNotes || []), rejectionNote]
                });
            }
            revalidateAllTools();
            updateToast(toastId, `${selectedIds.size} tools rejected`, 'success');
            setSelectedIds(new Set());
        } catch (err) {
            updateToast(toastId, 'Failed to reject some tools', 'error');
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
        <div className="min-h-screen p-6 bg-bg-primary">
            <div className="max-w-[1200px] mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-text-primary">Moderation</h1>
                        <p className="text-sm text-text-tertiary mt-1">
                            {pagination ? `${pagination.total} ${activeTab} tools` : 'Loading...'}
                        </p>
                    </div>
                    {someSelected && activeTab === 'pending' && (
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-text-secondary">{selectedIds.size} selected</span>
                            <button onClick={handleBulkReject} className="px-3 py-1.5 text-sm text-accent-red bg-accent-red-bg rounded-lg hover:bg-accent-red/20 transition-colors">
                                Reject Selected
                            </button>
                            <button onClick={handleBulkApprove} className="px-3 py-1.5 text-sm text-white bg-accent-green rounded-lg hover:opacity-90 transition-opacity">
                                Approve Selected
                            </button>
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
                <div className="flex gap-1 mb-4 bg-bg-tertiary rounded-lg p-1">
                    <button
                        onClick={() => handleTabChange('pending')}
                        className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'pending' ? 'bg-bg-card text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                    >
                        Pending {pendingCount?.pagination ? `(${pendingCount.pagination.total})` : ''}
                    </button>
                    <button
                        onClick={() => handleTabChange('draft')}
                        className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'draft' ? 'bg-bg-card text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                    >
                        Draft {draftCount?.pagination ? `(${draftCount.pagination.total})` : ''}
                    </button>
                    <button
                        onClick={() => handleTabChange('published')}
                        className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'published' ? 'bg-bg-card text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                    >
                        Published {publishedCount?.pagination ? `(${publishedCount.pagination.total})` : ''}
                    </button>
                </div>

                {/* Content Card */}
                <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                        <h2 className="text-base font-semibold text-text-primary">
                            {activeTab === 'pending' && 'Review Queue'}
                            {activeTab === 'draft' && 'Draft Tools'}
                            {activeTab === 'published' && 'Published Tools'}
                        </h2>
                        {activeTab === 'pending' && filteredTools.length > 0 && (
                            <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                                <input type="checkbox" checked={allSelected} onChange={toggleAll}
                                    className="w-4 h-4 rounded border-border text-accent-primary focus:ring-accent-primary" />
                                Select All
                            </label>
                        )}
                    </div>
                    <div className="divide-y divide-border">
                        {filteredTools.length === 0 ? (
                            <div className="p-12 text-center text-text-tertiary">
                                <svg className="w-10 h-10 text-accent-green mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <path d="M9 12l2 2 4-4"></path>
                                </svg>
                                <div className="font-medium">
                                    {searchQuery ? 'No matching tools' : activeTab === 'pending' ? 'All caught up!' : 'No published tools'}
                                </div>
                                <p className="text-sm mt-1">
                                    {searchQuery ? 'Try a different search term' : activeTab === 'pending' ? 'No tools pending review' : 'No tools have been published yet'}
                                </p>
                            </div>
                        ) : (
                            filteredTools.map((tool) => (
                                <div key={tool.id} className={`p-5 transition-colors ${selectedIds.has(tool.id) ? 'bg-accent-primary/5' : 'hover:bg-bg-secondary'}`}>
                                    <div className="flex items-start gap-4">
                                        {activeTab === 'pending' && (
                                            <input type="checkbox" checked={selectedIds.has(tool.id)} onChange={() => toggleSelect(tool.id)}
                                                className="mt-1 w-4 h-4 rounded border-border text-accent-primary focus:ring-accent-primary" />
                                        )}
                                        {tool.logoUrl ? (
                                            <img src={tool.logoUrl} alt="" className="w-12 h-12 rounded-lg object-contain" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-lg bg-accent-primary-bg flex items-center justify-center text-accent-primary font-bold">
                                                {tool.name[0]}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-semibold text-text-primary">{tool.name}</h3>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${tool.status === 'pending' ? 'bg-accent-purple-bg text-accent-purple'
                                                    : tool.status === 'published' ? 'bg-accent-green-bg text-accent-green'
                                                        : 'bg-accent-yellow/10 text-accent-yellow'
                                                    }`}>
                                                    {tool.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-text-secondary line-clamp-2">{tool.summary || tool.description}</p>
                                            <div className="flex items-center gap-1.5 mt-2 text-xs text-text-tertiary">
                                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                                {tool.status === 'published' ? (
                                                    <>
                                                        <span>{formatTimeAgo(tool.updatedAt || tool.createdAt) || 'Recently'}</span>
                                                        <span className="text-text-quaternary">•</span>
                                                        <span>Listed {new Date(tool.createdAt || new Date()).toLocaleString()}</span>
                                                        {tool.updatedAt && tool.updatedAt !== tool.createdAt && (
                                                            <>
                                                                <span className="text-text-quaternary">•</span>
                                                                <span>Updated {new Date(tool.updatedAt).toLocaleString()}</span>
                                                            </>
                                                        )}
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>{formatTimeAgo(tool.createdAt) || 'Recently'}</span>
                                                        <span className="text-text-quaternary">•</span>
                                                        <span>Submitted {new Date(tool.createdAt || new Date()).toLocaleString()}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
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
                                                    <button onClick={() => handleReject(tool.id)}
                                                        className="flex items-center gap-1 px-2 py-1 text-[10px] text-accent-red bg-accent-red-bg rounded hover:bg-accent-red/20 transition-colors">
                                                        Reject
                                                    </button>
                                                    <button onClick={() => handleApprove(tool.id)}
                                                        className="flex items-center gap-1 px-2 py-1 text-[10px] text-white bg-accent-green rounded hover:opacity-90 transition-opacity">
                                                        Approve
                                                    </button>
                                                </>
                                            )}
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
            {previewTool && (
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
            )}
        </div>
    );
}
