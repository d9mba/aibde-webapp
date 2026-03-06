'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { useAdmin, AdminTool } from '@/context/AdminContext';
import { renderIcon } from '@/components/features/admin/AdminLayout';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Eye, Pencil, Trash2, ChevronLeft, ChevronRight, Upload, Download, Square, CheckSquare, RefreshCw } from 'lucide-react';
import { getStatusClass } from '@/lib/formatters';
import { useConfirm } from '@/components/ui/ConfirmModal';
import BulkImportModal from './components/BulkImportModal';
import BulkUpdateModal from './components/BulkUpdateModal';
import ExportToolsModal from './components/ExportToolsModal';
import { SafeHtml } from '@/components/ui/SafeHtml';

// SWR fetcher
const fetcher = (url: string) => fetch(url).then(res => res.json());

// Pagination response type
interface PaginatedToolsResponse {
    data: AdminTool[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export default function ToolsListPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { deleteTool } = useAdmin();
    const { confirm } = useConfirm();
    const [searchQuery, setSearchQuery] = useState('');
    // Read initial status from URL query param
    const initialStatus = searchParams.get('status') || 'all';
    const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [previewTool, setPreviewTool] = useState<AdminTool | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [missingDataFilter, setMissingDataFilter] = useState<string>('all');
    const [showBulkImport, setShowBulkImport] = useState(false);
    const [showBulkUpdate, setShowBulkUpdate] = useState(false);
    const [showExport, setShowExport] = useState(false);
    const [exportTool, setExportTool] = useState<AdminTool | null>(null);
    const [selectedTools, setSelectedTools] = useState<Set<string>>(new Set());
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const ITEMS_PER_PAGE = 25;

    // Toggle single tool selection
    const toggleToolSelection = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSet = new Set(selectedTools);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedTools(newSet);
    };

    // Toggle all tools on current page
    const toggleSelectAll = () => {
        if (selectedTools.size === tools.length) {
            setSelectedTools(new Set());
        } else {
            setSelectedTools(new Set(tools.map(t => t.id)));
        }
    };

    // Clear selection when page changes
    useEffect(() => {
        setSelectedTools(new Set());
    }, [currentPage, statusFilter, categoryFilter, missingDataFilter, debouncedSearch]);

    // Update status filter when URL changes
    useEffect(() => {
        const urlStatus = searchParams.get('status') || 'all';
        if (urlStatus !== statusFilter) {
            setStatusFilter(urlStatus);
            setCurrentPage(1);
        }
    }, [searchParams]);

    // Debounced search for server-side search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (debouncedSearch !== searchQuery) {
                setDebouncedSearch(searchQuery);
                if (searchQuery.trim()) {
                    setCurrentPage(1); // Reset to first page only when actually searching
                }
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, debouncedSearch]);

    // Build API URL with pagination, status filter, search, AND client filters
    const apiUrl = useMemo(() => {
        const params = new URLSearchParams();
        params.set('page', currentPage.toString());
        params.set('limit', ITEMS_PER_PAGE.toString());
        if (statusFilter !== 'all') params.set('status', statusFilter);
        if (categoryFilter !== 'all') params.set('category', categoryFilter);
        if (missingDataFilter !== 'all') params.set('missing', missingDataFilter);
        if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
        return `/api/tools?${params.toString()}`;
    }, [currentPage, statusFilter, categoryFilter, missingDataFilter, debouncedSearch]);

    // Fetch tools with SWR
    const { data: toolsData, error: toolsError, isLoading: toolsLoading, isValidating, mutate } = useSWR<PaginatedToolsResponse>(
        apiUrl,
        fetcher,
        { revalidateOnFocus: false, keepPreviousData: true }
    );

    const tools = toolsData?.data || [];
    const pagination = toolsData?.pagination;

    // No client-side filtering needed - all filtering is now server-side

    const statusOptions = [
        { value: 'all', label: 'All Status' },
        { value: 'published', label: 'Published' },
        { value: 'draft', label: 'Draft' },
        { value: 'pending', label: 'Pending' },
        { value: 'unpublished', label: 'Unpublished' },
        { value: 'scheduled', label: 'Scheduled' },
    ];

    // Fetch categories for filter dropdown
    const { data: catResponse } = useSWR<{ data: { id: string; categoryName: string }[] }>(
        '/api/categories?limit=500',
        (url: string) => fetch(url).then(r => r.json()),
        { revalidateOnFocus: false }
    );
    const categoryOptions = [
        { value: 'all', label: 'All Categories' },
        ...Array.from(new Set((catResponse?.data || []).filter((cat: { categoryName: string }) => cat.categoryName).map((cat: { categoryName: string }) => cat.categoryName)))
            .map(name => ({ value: name as string, label: name as string }))
    ];

    const missingDataOptions = [
        { value: 'all', label: 'All Tools' },
        // Basic Info
        { value: 'no-logo', label: 'Missing Logo' },
        { value: 'no-summary', label: 'Missing Summary' },
        { value: 'no-description', label: 'Missing Description' },
        { value: 'no-website', label: 'Missing Website URL' },
        { value: 'no-contact', label: 'Missing Contact Info' },
        // Classification
        { value: 'no-category', label: 'Missing Category' },
        { value: 'no-task', label: 'Missing Task' },
        { value: 'no-tags', label: 'Missing Tags' },
        // Content
        { value: 'no-features', label: 'Missing Features' },
        { value: 'no-use-cases', label: 'Missing Use Cases' },
        { value: 'no-pros-cons', label: 'Missing Pros/Cons' },
        { value: 'no-faq', label: 'Missing FAQ' },
        // Pricing & Media
        { value: 'no-pricing-tiers', label: 'Missing Pricing Tiers' },
        { value: 'no-images', label: 'Missing Images' },
        { value: 'no-videos', label: 'Missing Videos' },
        // Social & Links
        { value: 'no-social', label: 'Missing Social Links' },
        { value: 'no-app-store', label: 'Missing App Store Links' },
        // Dates
        { value: 'no-release-date', label: 'Missing Release Date' },
    ];

    // Handle delete with cache invalidation
    const handleDelete = async (toolId: string, toolName: string) => {
        const confirmed = await confirm({
            title: 'Delete Tool',
            message: `Are you sure you want to delete "${toolName}"? This action cannot be undone.`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            danger: true
        });
        if (confirmed) {
            await deleteTool(toolId);
            mutate(); // Refresh data
        }
    };

    // Reset page when filters change
    const handleStatusChange = (value: string) => {
        setStatusFilter(value);
        setCurrentPage(1);
    };

    const handleCategoryChange = (value: string) => {
        setCategoryFilter(value);
        setCurrentPage(1);
    };

    const handleMissingDataChange = (value: string) => {
        setMissingDataFilter(value);
        setCurrentPage(1);
    };



    if (toolsLoading && !toolsData) {
        return (
            <div className="min-h-screen p-8 bg-bg-primary flex items-center justify-center">
                <div className="text-text-secondary">Loading tools...</div>
            </div>
        );
    }

    if (toolsError) {
        return (
            <div className="min-h-screen p-8 bg-bg-primary flex items-center justify-center">
                <div className="text-accent-red">Failed to load tools</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-3 sm:p-6 bg-bg-primary">
            <div className="max-w-[1400px] mx-auto relative">
                {/* Page-level loading overlay */}
                {isValidating && toolsData && (
                    <div className="absolute inset-0 bg-bg-primary/60 z-10 flex items-center justify-center rounded-xl">
                        <div className="animate-spin w-8 h-8 border-[3px] border-accent-primary border-t-transparent rounded-full" />
                    </div>
                )}
                {/* Header */}
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Tools</h1>
                        <p className="text-xs sm:text-sm text-text-tertiary mt-0.5 sm:mt-1">
                            {pagination
                                ? `${pagination.total} total tools (Page ${pagination.page} of ${pagination.totalPages})`
                                : `${tools.length} tools`
                            }
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {selectedTools.size > 0 && (
                            <button
                                onClick={() => { setExportTool(null); setShowExport(true); }}
                                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-accent-primary text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-accent-primary/90 transition-colors"
                            >
                                <Download size={16} />
                                <span>Export {selectedTools.size}</span>
                            </button>
                        )}
                        <button
                            onClick={() => { setExportTool(null); setSelectedTools(new Set(tools.map(t => t.id))); setShowExport(true); }}
                            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-bg-secondary border border-border text-text-primary rounded-lg text-xs sm:text-sm font-medium hover:bg-bg-tertiary transition-colors"
                            title="Export all tools"
                        >
                            <Download size={16} />
                            <span className="hidden sm:inline">Export All</span>
                        </button>
                        <button
                            onClick={() => setShowBulkImport(true)}
                            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-bg-secondary border border-border text-text-primary rounded-lg text-xs sm:text-sm font-medium hover:bg-bg-tertiary transition-colors"
                            title="Import new tools from CSV"
                        >
                            <Upload size={16} />
                            <span className="hidden sm:inline">Import</span>
                        </button>
                        <button
                            onClick={() => setShowBulkUpdate(true)}
                            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-bg-secondary border border-border text-text-primary rounded-lg text-xs sm:text-sm font-medium hover:bg-bg-tertiary transition-colors"
                            title="Bulk update existing tools or add new ones via CSV"
                        >
                            <RefreshCw size={16} />
                            <span className="hidden sm:inline">Update</span>
                        </button>
                        <Link
                            href="/dashboard/tools/new"
                            prefetch={false}
                            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-accent-primary text-white rounded-lg text-xs sm:text-sm font-medium no-underline hover:opacity-90 transition-opacity"
                        >
                            <span className="flex items-center">{renderIcon('plus', 16)}</span>
                            <span className="hidden sm:inline">Add Tool</span>
                        </Link>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-3 mb-4 p-3 sm:p-4 bg-bg-card border border-border rounded-xl">
                    <div className="relative flex-1 min-w-0 sm:min-w-[200px] sm:max-w-sm">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">{renderIcon('search', 16)}</span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search tools..."
                            className="w-full pl-9 pr-4 py-2 sm:py-2.5 text-sm bg-bg-secondary border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                        <SearchableSelect
                            value={statusFilter}
                            onChange={handleStatusChange}
                            options={statusOptions}
                            placeholder="Status"
                            searchPlaceholder="Search status..."
                            className="flex-1 sm:min-w-[130px]"
                            showSearch={false}
                        />
                        <SearchableSelect
                            value={categoryFilter}
                            onChange={handleCategoryChange}
                            options={categoryOptions}
                            placeholder="Category"
                            searchPlaceholder="Search categories..."
                            className="flex-1 sm:min-w-[150px]"
                        />
                        <SearchableSelect
                            value={missingDataFilter}
                            onChange={handleMissingDataChange}
                            options={missingDataOptions}
                            placeholder="Missing Data"
                            searchPlaceholder="Search filters..."
                            className="flex-1 sm:min-w-[180px]"
                        />
                    </div>
                </div>


                {/* Mobile Card View */}
                <div className={`sm:hidden space-y-3 transition-opacity ${isValidating ? 'opacity-50' : ''}`}>
                    {tools.length === 0 ? (
                        <div className="bg-bg-card border border-border rounded-xl p-6 text-center text-text-tertiary">
                            No tools found. <Link href="/dashboard/tools/new" prefetch={false} className="text-accent-primary hover:underline">Add your first tool</Link>
                        </div>
                    ) : (
                        tools.map((tool) => (
                            <div
                                key={tool.id}
                                className="bg-bg-card border border-border rounded-xl p-3 active:bg-bg-secondary transition-colors"
                                onClick={() => setPreviewTool(tool)}
                            >
                                <div className="flex items-start gap-3">
                                    {tool.logoUrl ? (
                                        <img src={tool.logoUrl} alt="" className="w-10 h-10 rounded-lg object-contain flex-shrink-0" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-lg bg-accent-primary-bg flex items-center justify-center text-accent-primary font-bold text-sm flex-shrink-0">
                                            {tool.name[0]}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="font-medium text-text-primary truncate">{tool.name}</div>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${getStatusClass(tool.status || 'draft')}`}>
                                                {tool.status}
                                            </span>
                                        </div>
                                        <div className="text-xs text-text-tertiary line-clamp-1 mt-0.5">{tool.summary}</div>
                                        <div className="flex items-center gap-2 mt-2">
                                            {(tool.categoryName || []).length > 0 && (
                                                <span className="text-[10px] px-1.5 py-0.5 bg-bg-tertiary text-text-secondary rounded">
                                                    {tool.categoryName[0]}
                                                </span>
                                            )}
                                            <span className="text-[10px] text-text-tertiary capitalize">{tool.pricing}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-end gap-1 mt-2 pt-2 border-t border-border" onClick={(e) => e.stopPropagation()}>
                                    <button
                                        onClick={() => setPreviewTool(tool)}
                                        className="p-2 text-text-tertiary hover:text-accent-primary hover:bg-accent-primary/10 rounded-lg transition-colors"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    <Link
                                        href={`/dashboard/tools/${tool.id}`}
                                        prefetch={false}
                                        className="p-2 text-text-tertiary hover:text-accent-primary hover:bg-accent-primary/10 rounded-lg transition-colors"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </Link>
                                    <button
                                        onClick={() => { setExportTool(tool); setShowExport(true); }}
                                        className="p-2 text-text-tertiary hover:text-accent-primary hover:bg-accent-primary/10 rounded-lg transition-colors"
                                        title="Export"
                                    >
                                        <Download className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(tool.id, tool.name)}
                                        className="p-2 text-text-tertiary hover:text-accent-red hover:bg-accent-red/10 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Desktop Table */}
                <div className={`hidden sm:block bg-bg-card border border-border rounded-xl overflow-hidden transition-opacity ${isValidating ? 'opacity-50' : ''}`}>
                    <table className="w-full">
                        <thead className="bg-bg-secondary border-b border-border">
                            <tr>
                                <th className="px-3 py-3 text-center w-10">
                                    <button
                                        onClick={toggleSelectAll}
                                        className="p-1 hover:bg-bg-tertiary rounded transition-colors"
                                        title={selectedTools.size === tools.length ? 'Deselect all' : 'Select all'}
                                    >
                                        {selectedTools.size === tools.length && tools.length > 0 ? (
                                            <CheckSquare size={18} className="text-accent-primary" />
                                        ) : (
                                            <Square size={18} className="text-text-tertiary" />
                                        )}
                                    </button>
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Tool</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Category</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Pricing</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wide">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {tools.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-text-tertiary">
                                        No tools found. <Link href="/dashboard/tools/new" prefetch={false} className="text-accent-primary hover:underline">Add your first tool</Link>
                                    </td>
                                </tr>
                            ) : (
                                tools.map((tool) => (
                                    <tr
                                        key={tool.id}
                                        className={`hover:bg-bg-secondary cursor-pointer transition-colors ${selectedTools.has(tool.id) ? 'bg-accent-primary/5' : ''}`}
                                        onClick={() => setPreviewTool(tool)}
                                    >
                                        <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={(e) => toggleToolSelection(tool.id, e)}
                                                className="p-1 hover:bg-bg-tertiary rounded transition-colors"
                                            >
                                                {selectedTools.has(tool.id) ? (
                                                    <CheckSquare size={18} className="text-accent-primary" />
                                                ) : (
                                                    <Square size={18} className="text-text-tertiary" />
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                {tool.logoUrl ? (
                                                    <img src={tool.logoUrl} alt="" className="w-9 h-9 rounded-lg object-contain" />
                                                ) : (
                                                    <div className="w-9 h-9 rounded-lg bg-accent-primary-bg flex items-center justify-center text-accent-primary font-bold text-sm">
                                                        {tool.name[0]}
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-medium text-text-primary">{tool.name}</div>
                                                    <div className="text-xs text-text-tertiary truncate max-w-[200px]">{tool.summary}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-text-secondary">
                                            {(tool.categoryName || []).length > 0 ? tool.categoryName.join(', ') : '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusClass(tool.status || 'draft')}`}>
                                                {tool.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-text-secondary capitalize">{tool.pricing}</td>
                                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => setPreviewTool(tool)}
                                                    className="p-2 text-text-tertiary hover:text-accent-primary hover:bg-accent-primary/10 rounded-lg transition-colors"
                                                    title="Preview"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <Link
                                                    href={`/dashboard/tools/${tool.id}`}
                                                    prefetch={false}
                                                    className="p-2 text-text-tertiary hover:text-accent-primary hover:bg-accent-primary/10 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </Link>
                                                <button
                                                    onClick={() => { setExportTool(tool); setShowExport(true); }}
                                                    className="p-2 text-text-tertiary hover:text-accent-primary hover:bg-accent-primary/10 rounded-lg transition-colors"
                                                    title="Export"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(tool.id, tool.name)}
                                                    className="p-2 text-text-tertiary hover:text-accent-red hover:bg-accent-red/10 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 p-3 sm:p-4 bg-bg-card border border-border rounded-xl">
                        <div className="text-sm text-text-secondary">
                            Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-text-secondary bg-bg-secondary border border-border rounded-lg hover:bg-bg-tertiary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Previous
                            </button>
                            <span className="px-3 py-2 text-sm font-medium text-text-primary bg-accent-primary/10 rounded-lg flex items-center gap-2">
                                {isValidating && (
                                    <span className="animate-spin w-3.5 h-3.5 border-2 border-accent-primary border-t-transparent rounded-full" />
                                )}
                                {currentPage} / {pagination.totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                                disabled={currentPage === pagination.totalPages}
                                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-text-secondary bg-bg-secondary border border-border rounded-lg hover:bg-bg-tertiary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Next
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div >

            {/* Quick Preview Modal */}
            {
                previewTool && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setPreviewTool(null)}>
                        <div className="bg-bg-card border border-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                            {/* Header with Logo and Name */}
                            <div className="p-6 border-b border-border">
                                <div className="flex items-start gap-4">
                                    {previewTool.logoUrl ? (
                                        <img src={previewTool.logoUrl} alt="" className="w-20 h-20 rounded-xl object-contain" />
                                    ) : (
                                        <div className="w-20 h-20 bg-accent-primary/20 rounded-xl flex items-center justify-center text-3xl font-bold text-accent-primary">
                                            {previewTool.name[0]}
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <h2 className="text-2xl font-bold text-text-primary">{previewTool.name}</h2>
                                        {/* Summary under name */}
                                        {previewTool.summary && (
                                            <p className="text-text-secondary mt-1">{previewTool.summary}</p>
                                        )}
                                        <div className="flex flex-wrap items-center gap-2 mt-2">
                                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusClass(previewTool.status || 'draft')}`}>
                                                {previewTool.status}
                                            </span>
                                            <span className="text-xs px-2 py-1 bg-accent-primary/10 text-accent-primary rounded-full">{previewTool.pricingLabel}</span>
                                            {previewTool.isFeatured && <span className="text-xs px-2 py-1 bg-yellow-500/10 text-yellow-600 rounded-full">Featured</span>}
                                        </div>
                                    </div>
                                    <button onClick={() => setPreviewTool(null)} className="text-text-tertiary hover:text-text-primary">
                                        {renderIcon('close', 20)}
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-4">
                                {/* Full Description */}
                                {previewTool.description && (
                                    <div>
                                        <h3 className="text-sm font-medium text-text-tertiary mb-1">Description</h3>
                                        <SafeHtml
                                            html={previewTool.description}
                                            className="text-text-primary text-sm leading-relaxed rich-text"
                                        />
                                    </div>
                                )}

                                {/* Details Grid */}
                                {/* Details Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    {(previewTool.categoryName?.length > 0 || previewTool.category) && (
                                        <div>
                                            <h3 className="text-xs font-medium text-text-tertiary mb-1">Categories</h3>
                                            <p className="text-sm text-text-primary">
                                                {previewTool.categoryName?.length > 0
                                                    ? previewTool.categoryName.join(', ')
                                                    : previewTool.category}
                                            </p>
                                        </div>
                                    )}
                                    {(previewTool.taskName?.length > 0 || previewTool.task) && (
                                        <div>
                                            <h3 className="text-xs font-medium text-text-tertiary mb-1">Tasks</h3>
                                            <p className="text-sm text-text-primary">
                                                {previewTool.taskName?.length > 0
                                                    ? previewTool.taskName.join(', ')
                                                    : previewTool.task}
                                            </p>
                                        </div>
                                    )}
                                    {previewTool.pricing && (
                                        <div>
                                            <h3 className="text-xs font-medium text-text-tertiary mb-1">Pricing</h3>
                                            <p className="text-sm text-text-primary capitalize">{previewTool.pricing}</p>
                                        </div>
                                    )}
                                    {previewTool.rating !== undefined && previewTool.rating !== null && (
                                        <div>
                                            <h3 className="text-xs font-medium text-text-tertiary mb-1">Rating</h3>
                                            <p className="text-sm text-text-primary">{previewTool.rating} / 5</p>
                                        </div>
                                    )}
                                    {previewTool.saveCount !== undefined && (
                                        <div>
                                            <h3 className="text-xs font-medium text-text-tertiary mb-1">Saves</h3>
                                            <p className="text-sm text-text-primary">{previewTool.saveCount.toLocaleString()}</p>
                                        </div>
                                    )}
                                    {previewTool.launchedAgo && (
                                        <div>
                                            <h3 className="text-xs font-medium text-text-tertiary mb-1">Launched</h3>
                                            <p className="text-sm text-text-primary">{previewTool.launchedAgo}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Website URL - At Top */}
                                {previewTool.websiteUrl && (
                                    <div>
                                        <h3 className="text-xs font-medium text-text-tertiary mb-1">Website</h3>
                                        <a href={previewTool.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-accent-primary hover:underline flex items-center gap-1">
                                            {previewTool.websiteUrl}
                                            <span className="inline-flex">{renderIcon('external-link', 12)}</span>
                                        </a>
                                    </div>
                                )}

                                {/* Core Features & Use Cases - Side by Side */}
                                {((previewTool.coreFeatures && previewTool.coreFeatures.length > 0) || (previewTool.useCases && previewTool.useCases.length > 0)) && (
                                    <div className="grid grid-cols-2 gap-4">
                                        {previewTool.coreFeatures && previewTool.coreFeatures.length > 0 && (
                                            <div>
                                                <h3 className="text-xs font-medium text-text-tertiary mb-2">Core Features</h3>
                                                <ul className="space-y-1">
                                                    {previewTool.coreFeatures.slice(0, 5).map((feature: string, i: number) => (
                                                        <li key={i} className="text-xs text-text-secondary">• {feature}</li>
                                                    ))}
                                                </ul>
                                                {previewTool.coreFeatures.length > 5 && (
                                                    <p className="text-xs text-accent-primary mt-1">+{previewTool.coreFeatures.length - 5} more</p>
                                                )}
                                            </div>
                                        )}
                                        {previewTool.useCases && previewTool.useCases.length > 0 && (
                                            <div>
                                                <h3 className="text-xs font-medium text-text-tertiary mb-2">Use Cases</h3>
                                                <ul className="space-y-1">
                                                    {previewTool.useCases.slice(0, 5).map((useCase: string, i: number) => (
                                                        <li key={i} className="text-xs text-text-secondary">• {useCase}</li>
                                                    ))}
                                                </ul>
                                                {previewTool.useCases.length > 5 && (
                                                    <p className="text-xs text-accent-primary mt-1">+{previewTool.useCases.length - 5} more</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Tags */}
                                {previewTool.tags && previewTool.tags.length > 0 && (
                                    <div>
                                        <h3 className="text-xs font-medium text-text-tertiary mb-2">Tags</h3>
                                        <div className="flex flex-wrap gap-1">
                                            {previewTool.tags.slice(0, 10).map((tag: string) => (
                                                <span key={tag} className="text-xs px-2 py-1 bg-bg-secondary text-text-secondary rounded">{tag}</span>
                                            ))}
                                            {previewTool.tags.length > 10 && (
                                                <span className="text-xs text-accent-primary self-center">+{previewTool.tags.length - 10} more</span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Pros & Cons */}
                                {(previewTool.pros?.length || previewTool.cons?.length) && (
                                    <div className="grid grid-cols-2 gap-4">
                                        {previewTool.pros && previewTool.pros.length > 0 && (
                                            <div>
                                                <h3 className="text-xs font-medium text-green-500 mb-2">Pros</h3>
                                                <ul className="space-y-1">
                                                    {previewTool.pros.slice(0, 5).map((pro: string, i: number) => (
                                                        <li key={i} className="text-xs text-text-secondary">• {pro}</li>
                                                    ))}
                                                </ul>
                                                {previewTool.pros.length > 5 && (
                                                    <p className="text-xs text-accent-primary mt-1">+{previewTool.pros.length - 5} more</p>
                                                )}
                                            </div>
                                        )}
                                        {previewTool.cons && previewTool.cons.length > 0 && (
                                            <div>
                                                <h3 className="text-xs font-medium text-red-500 mb-2">Cons</h3>
                                                <ul className="space-y-1">
                                                    {previewTool.cons.slice(0, 5).map((con: string, i: number) => (
                                                        <li key={i} className="text-xs text-text-secondary">• {con}</li>
                                                    ))}
                                                </ul>
                                                {previewTool.cons.length > 5 && (
                                                    <p className="text-xs text-accent-primary mt-1">+{previewTool.cons.length - 5} more</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* FAQ */}
                                {previewTool.faq && previewTool.faq.length > 0 && (
                                    <div>
                                        <h3 className="text-xs font-medium text-text-tertiary mb-2">FAQ</h3>
                                        <div className="space-y-2">
                                            {previewTool.faq.map((item: { question: string; answer: string }, i: number) => (
                                                <div key={i} className="p-2 bg-bg-secondary rounded-lg">
                                                    <p className="text-xs font-medium text-text-primary">{item.question}</p>
                                                    <p className="text-xs text-text-secondary mt-1">{item.answer}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Images */}
                                {previewTool.images && previewTool.images.length > 0 && (
                                    <div>
                                        <h3 className="text-xs font-medium text-text-tertiary mb-2">Screenshots ({previewTool.images.length})</h3>
                                        <div className="flex gap-2 overflow-x-auto">
                                            {previewTool.images.slice(0, 4).map((img: string, i: number) => (
                                                <img key={i} src={img} alt="" className="w-24 h-16 object-cover rounded-lg flex-shrink-0" />
                                            ))}
                                            {previewTool.images.length > 4 && (
                                                <span className="text-xs text-text-tertiary self-center">+{previewTool.images.length - 4} more</span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Videos */}
                                {previewTool.videos && previewTool.videos.length > 0 && (
                                    <div>
                                        <h3 className="text-xs font-medium text-text-tertiary mb-1">Videos</h3>
                                        <p className="text-sm text-text-secondary">{previewTool.videos.length} video(s)</p>
                                    </div>
                                )}

                                {/* App Store Links */}
                                {(previewTool.playStoreUrl || previewTool.appStoreUrl) && (
                                    <div className="grid grid-cols-2 gap-4">
                                        {previewTool.playStoreUrl && (
                                            <div>
                                                <h3 className="text-xs font-medium text-text-tertiary mb-1">Play Store</h3>
                                                <a href={previewTool.playStoreUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-accent-primary hover:underline truncate block">
                                                    {previewTool.playStoreUrl}
                                                </a>
                                            </div>
                                        )}
                                        {previewTool.appStoreUrl && (
                                            <div>
                                                <h3 className="text-xs font-medium text-text-tertiary mb-1">App Store</h3>
                                                <a href={previewTool.appStoreUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-accent-primary hover:underline truncate block">
                                                    {previewTool.appStoreUrl}
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Contact Info */}
                                {(previewTool.contactName || previewTool.contactEmail) && (
                                    <div className="p-3 bg-bg-secondary rounded-lg">
                                        <h3 className="text-xs font-medium text-text-tertiary mb-2">Contact Information</h3>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            {previewTool.contactName && (
                                                <div><span className="text-text-tertiary">Name:</span> <span className="text-text-primary">{previewTool.contactName}</span></div>
                                            )}
                                            {previewTool.contactEmail && (
                                                <div><span className="text-text-tertiary">Email:</span> <span className="text-text-primary">{previewTool.contactEmail}</span></div>
                                            )}
                                            {previewTool.contactCompany && (
                                                <div><span className="text-text-tertiary">Company:</span> <span className="text-text-primary">{previewTool.contactCompany}</span></div>
                                            )}
                                            {previewTool.contactMobile && (
                                                <div><span className="text-text-tertiary">Mobile:</span> <span className="text-text-primary">{previewTool.contactMobile}</span></div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="border-t border-border p-4 flex gap-3">
                                {previewTool.appUsername && (
                                    <button onClick={() => { setPreviewTool(null); router.push(`/app/${previewTool.appUsername}`); }}
                                        className="flex-1 px-4 py-2.5 bg-accent-primary text-white rounded-xl text-sm font-medium hover:bg-accent-primary/90 flex items-center justify-center gap-2">
                                        <span className="inline-flex">{renderIcon('link', 16)}</span> Open Tool Page
                                    </button>
                                )}
                                <button onClick={() => { setPreviewTool(null); router.push(`/dashboard/tools/${previewTool.id}`); }}
                                    className="flex-1 px-4 py-2.5 bg-bg-secondary border border-border text-text-primary rounded-xl text-sm font-medium hover:bg-bg-tertiary flex items-center justify-center gap-2">
                                    <span className="inline-flex">{renderIcon('edit', 16)}</span> Edit Tool
                                </button>
                            </div>
                        </div>
                    </div >
                )
            }

            {/* Bulk Import Modal */}
            <BulkImportModal
                isOpen={showBulkImport}
                onClose={() => setShowBulkImport(false)}
                onImportComplete={() => mutate()}
            />

            {/* Bulk Update Modal */}
            <BulkUpdateModal
                isOpen={showBulkUpdate}
                onClose={() => setShowBulkUpdate(false)}
                onUpdateComplete={() => mutate()}
            />

            {/* Export Tools Modal */}
            <ExportToolsModal
                isOpen={showExport}
                onClose={() => { setShowExport(false); setExportTool(null); setSelectedTools(new Set()); }}
                tools={exportTool ? [exportTool] : tools.filter(t => selectedTools.has(t.id))}
            />
        </div >
    );
}

