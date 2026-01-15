'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAdmin, AdminTool } from '@/context/AdminContext';
import { renderIcon } from '@/components/features/admin/AdminLayout';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Eye, Pencil, Trash2 } from 'lucide-react';

export default function ToolsListPage() {
    const router = useRouter();
    const { tools, deleteTool, categories, isLoaded } = useAdmin();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [previewTool, setPreviewTool] = useState<AdminTool | null>(null);

    const statusOptions = [
        { value: 'all', label: 'All Status' },
        { value: 'published', label: 'Published' },
        { value: 'draft', label: 'Draft' },
        { value: 'pending', label: 'Pending' },
    ];

    const categoryOptions = [
        { value: 'all', label: 'All Categories' },
        ...categories.filter(cat => cat.categoryName).map(cat => ({ value: cat.categoryName, label: cat.categoryName }))
    ];

    const filteredTools = useMemo(() => {
        return tools.filter(tool => {
            const matchesSearch = !searchQuery.trim() ||
                (tool.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                tool.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                tool.description?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'all' || tool.status === statusFilter;
            const matchesCategory = categoryFilter === 'all' || (tool.categoryName || []).includes(categoryFilter);
            return matchesSearch && matchesStatus && matchesCategory;
        });
    }, [tools, searchQuery, statusFilter, categoryFilter]);



    if (!isLoaded) {
        return (
            <div className="min-h-screen p-8 bg-bg-primary flex items-center justify-center">
                <div className="text-text-secondary">Loading...</div>
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
                        <p className="text-xs sm:text-sm text-text-tertiary mt-0.5 sm:mt-1">{tools.length} total tools</p>
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
                    <div className="flex gap-2 sm:gap-3">
                        <SearchableSelect
                            value={statusFilter}
                            onChange={setStatusFilter}
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
                                        <img src={tool.logoUrl} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-lg bg-accent-primary-bg flex items-center justify-center text-accent-primary font-bold text-sm flex-shrink-0">
                                            {tool.name[0]}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="font-medium text-text-primary truncate">{tool.name}</div>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${tool.status === 'published' ? 'bg-accent-green-bg text-accent-green' :
                                                tool.status === 'draft' ? 'bg-accent-yellow/10 text-accent-yellow' :
                                                    'bg-accent-purple-bg text-accent-purple'
                                                }`}>
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
                                        onClick={() => {
                                            if (confirm(`Delete "${tool.name}"?`)) deleteTool(tool.id);
                                        }}
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
                                                    <img src={tool.logoUrl} alt="" className="w-9 h-9 rounded-lg object-cover" />
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
                                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${tool.status === 'published' ? 'bg-accent-green-bg text-accent-green' :
                                                tool.status === 'draft' ? 'bg-accent-yellow/10 text-accent-yellow' :
                                                    'bg-accent-purple-bg text-accent-purple'
                                                }`}>
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
                                                    onClick={() => {
                                                        if (confirm(`Delete "${tool.name}"?`)) deleteTool(tool.id);
                                                    }}
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
                                        <img src={previewTool.logoUrl} alt="" className="w-20 h-20 rounded-xl object-cover" />
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
                                            <span className={`text-xs px-2 py-1 rounded-full ${previewTool.status === 'published' ? 'bg-green-500/10 text-green-500' : previewTool.status === 'draft' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-gray-500/10 text-gray-500'}`}>
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
