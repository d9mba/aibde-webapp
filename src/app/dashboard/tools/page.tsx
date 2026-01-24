'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { useAdmin, AdminTool } from '@/context/AdminContext';
import { renderIcon } from '@/components/features/admin/AdminLayout';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Eye, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { getStatusClass } from '@/lib/formatters';
import { useConfirm } from '@/components/ui/ConfirmModal';

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
    const { deleteTool, categories, isLoaded } = useAdmin();
    const { confirm } = useConfirm();
    const [searchQuery, setSearchQuery] = useState('');
    // Read initial status from URL query param
    const initialStatus = searchParams.get('status') || 'all';
    const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [previewTool, setPreviewTool] = useState<AdminTool | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [missingDataFilter, setMissingDataFilter] = useState<string>('all');
    const ITEMS_PER_PAGE = 25;

    // Update status filter when URL changes
    useEffect(() => {
        const urlStatus = searchParams.get('status') || 'all';
        if (urlStatus !== statusFilter) {
            setStatusFilter(urlStatus);
            setCurrentPage(1);
        }
    }, [searchParams]);

    // Debounced search for server-side search
    const [debouncedSearch, setDebouncedSearch] = useState('');
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

    // Build API URL with pagination, status filter, and search
    const apiUrl = useMemo(() => {
        const params = new URLSearchParams();
        params.set('page', currentPage.toString());
        params.set('limit', ITEMS_PER_PAGE.toString());
        if (statusFilter !== 'all') params.set('status', statusFilter);
        if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
        return `/api/tools?${params.toString()}`;
    }, [currentPage, statusFilter, debouncedSearch]);

    // Fetch tools with SWR
    const { data: toolsData, error: toolsError, isLoading: toolsLoading, mutate } = useSWR<PaginatedToolsResponse>(
        apiUrl,
        fetcher,
        { revalidateOnFocus: false, keepPreviousData: true }
    );

    const tools = toolsData?.data || [];
    const pagination = toolsData?.pagination;

    const statusOptions = [
        { value: 'all', label: 'All Status' },
        { value: 'published', label: 'Published' },
        { value: 'draft', label: 'Draft' },
        { value: 'pending', label: 'Pending' },
        { value: 'unpublished', label: 'Unpublished' },
        { value: 'scheduled', label: 'Scheduled' },
    ];

    const categoryOptions = [
        { value: 'all', label: 'All Categories' },
        ...categories.filter(cat => cat.categoryName).map(cat => ({ value: cat.categoryName, label: cat.categoryName }))
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

    // Client-side filtering (for category and missing data - search is now server-side)
    const filteredTools = useMemo(() => {
        return tools.filter(tool => {
            // Search is now handled server-side via API
            const matchesCategory = categoryFilter === 'all' || (tool.categoryName || []).includes(categoryFilter);

            // Missing data filter
            let matchesMissingData = true;
            if (missingDataFilter !== 'all') {
                switch (missingDataFilter) {
                    case 'no-logo':
                        matchesMissingData = !tool.logoUrl || tool.logoUrl.trim() === '';
                        break;
                    case 'no-summary':
                        matchesMissingData = !tool.summary || tool.summary.trim() === '';
                        break;
                    case 'no-description':
                        matchesMissingData = !tool.description || tool.description.trim() === '';
                        break;
                    case 'no-website':
                        matchesMissingData = !tool.websiteUrl || tool.websiteUrl.trim() === '';
                        break;
                    case 'no-contact':
                        matchesMissingData = !tool.contactEmail && !tool.contactMobile && !tool.contactName;
                        break;
                    case 'no-category':
                        matchesMissingData = !tool.categoryName || tool.categoryName.length === 0;
                        break;
                    case 'no-task':
                        matchesMissingData = !tool.taskName || tool.taskName.length === 0;
                        break;
                    case 'no-tags':
                        matchesMissingData = !tool.tags || tool.tags.length === 0;
                        break;
                    case 'no-features':
                        matchesMissingData = !tool.coreFeatures || tool.coreFeatures.length === 0;
                        break;
                    case 'no-use-cases':
                        matchesMissingData = !tool.useCases || tool.useCases.length === 0;
                        break;
                    case 'no-pros-cons':
                        matchesMissingData = (!tool.pros || tool.pros.length === 0) && (!tool.cons || tool.cons.length === 0);
                        break;
                    case 'no-faq':
                        matchesMissingData = !tool.faq || tool.faq.length === 0;
                        break;
                    case 'no-pricing-tiers':
                        matchesMissingData = !tool.pricingTiers || tool.pricingTiers.length === 0;
                        break;
                    case 'no-images':
                        matchesMissingData = !tool.images || tool.images.length === 0;
                        break;
                    case 'no-videos':
                        matchesMissingData = !tool.videos || tool.videos.length === 0;
                        break;
                    case 'no-social':
                        matchesMissingData = !tool.socialLinks || Object.values(tool.socialLinks).every(v => !v);
                        break;
                    case 'no-app-store':
                        matchesMissingData = !tool.playStoreUrl && !tool.appStoreUrl;
                        break;
                    case 'no-release-date':
                        matchesMissingData = !tool.releasedAt || tool.releasedAt.trim() === '';
                        break;
                }
            }

            return matchesCategory && matchesMissingData;
        });
    }, [tools, categoryFilter, missingDataFilter]);

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
            <div className="max-w-[1400px] mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Tools</h1>
                        <p className="text-xs sm:text-sm text-text-tertiary mt-0.5 sm:mt-1">
                            {missingDataFilter !== 'all'
                                ? `${filteredTools.length} tools ${missingDataOptions.find(o => o.value === missingDataFilter)?.label || ''}`
                                : pagination
                                    ? `${pagination.total} total tools (Page ${pagination.page} of ${pagination.totalPages})`
                                    : `${tools.length} tools`
                            }
                        </p>
                    </div>
                    <Link
                        href="/dashboard/tools/new"
                        prefetch={false}
                        className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-accent-primary text-white rounded-lg text-xs sm:text-sm font-medium no-underline hover:opacity-90 transition-opacity"
                    >
                        <span className="flex items-center">{renderIcon('plus', 16)}</span>
                        <span className="hidden sm:inline">Add Tool</span>
                    </Link>
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
                            onChange={setCategoryFilter}
                            options={categoryOptions}
                            placeholder="Category"
                            searchPlaceholder="Search categories..."
                            className="flex-1 sm:min-w-[150px]"
                        />
                        <SearchableSelect
                            value={missingDataFilter}
                            onChange={(value) => {
                                setMissingDataFilter(value);
                                setCurrentPage(1);
                            }}
                            options={missingDataOptions}
                            placeholder="Missing Data"
                            searchPlaceholder="Search filters..."
                            className="flex-1 sm:min-w-[180px]"
                        />
                    </div>
                </div>


                {/* Mobile Card View */}
                <div className="sm:hidden space-y-3">
                    {filteredTools.length === 0 ? (
                        <div className="bg-bg-card border border-border rounded-xl p-6 text-center text-text-tertiary">
                            No tools found. <Link href="/dashboard/tools/new" prefetch={false} className="text-accent-primary hover:underline">Add your first tool</Link>
                        </div>
                    ) : (
                        filteredTools.map((tool) => (
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
                <div className="hidden sm:block bg-bg-card border border-border rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-bg-secondary border-b border-border">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Tool</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Category</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Pricing</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wide">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredTools.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-12 text-center text-text-tertiary">
                                        No tools found. <Link href="/dashboard/tools/new" prefetch={false} className="text-accent-primary hover:underline">Add your first tool</Link>
                                    </td>
                                </tr>
                            ) : (
                                filteredTools.map((tool) => (
                                    <tr
                                        key={tool.id}
                                        className="hover:bg-bg-secondary cursor-pointer transition-colors"
                                        onClick={() => setPreviewTool(tool)}
                                    >
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
                            <span className="px-3 py-2 text-sm font-medium text-text-primary bg-accent-primary/10 rounded-lg">
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
                                        <div
                                            className="text-text-primary text-sm leading-relaxed rich-text"
                                            dangerouslySetInnerHTML={{ __html: previewTool.description }}
                                        />
                                    </div>
                                )}

                                {/* Details Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    {previewTool.category && (
                                        <div>
                                            <h3 className="text-xs font-medium text-text-tertiary mb-1">Category</h3>
                                            <p className="text-sm text-text-primary">{previewTool.category}</p>
                                        </div>
                                    )}
                                    {previewTool.task && (
                                        <div>
                                            <h3 className="text-xs font-medium text-text-tertiary mb-1">Task</h3>
                                            <p className="text-sm text-text-primary">{previewTool.task}</p>
                                        </div>
                                    )}
                                    {previewTool.saveCount !== undefined && (
                                        <div>
                                            <h3 className="text-xs font-medium text-text-tertiary mb-1">Saves</h3>
                                            <p className="text-sm text-text-primary">{previewTool.saveCount.toLocaleString()}</p>
                                        </div>
                                    )}
                                    {previewTool.releasedAgo && (
                                        <div>
                                            <h3 className="text-xs font-medium text-text-tertiary mb-1">Released</h3>
                                            <p className="text-sm text-text-primary">{previewTool.releasedAgo}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Tags */}
                                {previewTool.tags && previewTool.tags.length > 0 && (
                                    <div>
                                        <h3 className="text-xs font-medium text-text-tertiary mb-2">Tags</h3>
                                        <div className="flex flex-wrap gap-1">
                                            {previewTool.tags.map((tag: string) => (
                                                <span key={tag} className="text-xs px-2 py-1 bg-bg-secondary text-text-secondary rounded">{tag}</span>
                                            ))}
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
                                                    {previewTool.pros.map((pro: string, i: number) => (
                                                        <li key={i} className="text-xs text-text-secondary">• {pro}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {previewTool.cons && previewTool.cons.length > 0 && (
                                            <div>
                                                <h3 className="text-xs font-medium text-red-500 mb-2">Cons</h3>
                                                <ul className="space-y-1">
                                                    {previewTool.cons.map((con: string, i: number) => (
                                                        <li key={i} className="text-xs text-text-secondary">• {con}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Website URL */}
                                {previewTool.websiteUrl && (
                                    <div>
                                        <h3 className="text-xs font-medium text-text-tertiary mb-1">Website</h3>
                                        <a href={previewTool.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-accent-primary hover:underline flex items-center gap-1">
                                            {previewTool.websiteUrl}
                                            <span className="inline-flex">{renderIcon('external-link', 12)}</span>
                                        </a>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="border-t border-border p-4 flex gap-3">
                                <button onClick={() => { setPreviewTool(null); router.push(`/app/${previewTool.slug}`); }}
                                    className="flex-1 px-4 py-2.5 bg-accent-primary text-white rounded-xl text-sm font-medium hover:bg-accent-primary/90 flex items-center justify-center gap-2">
                                    <span className="inline-flex">{renderIcon('link', 16)}</span> Open Tool Page
                                </button>
                                <button onClick={() => { setPreviewTool(null); router.push(`/dashboard/tools/${previewTool.id}`); }}
                                    className="flex-1 px-4 py-2.5 bg-bg-secondary border border-border text-text-primary rounded-xl text-sm font-medium hover:bg-bg-tertiary flex items-center justify-center gap-2">
                                    <span className="inline-flex">{renderIcon('edit', 16)}</span> Edit Tool
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
