'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAdmin, AdminTool } from '@/context/AdminContext';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmModal';
import { renderIcon } from '@/components/features/admin/AdminLayout';
import { Eye, Pencil } from 'lucide-react';

type TabType = 'pending' | 'approved' | 'rejected' | 'updated';

// Helper to format relative time
const formatTimeAgo = (dateStr: string | undefined): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
};

export default function ModerationPage() {
    const router = useRouter();
    const { tools, updateTool, isLoaded } = useAdmin();
    const { showToast, updateToast } = useToast();
    const { confirm } = useConfirm();
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [activeTab, setActiveTab] = useState<TabType>('pending');
    const [previewTool, setPreviewTool] = useState<AdminTool | null>(null);

    const pendingTools = useMemo(() => {
        return tools.filter(t => t.status === 'pending' || t.status === 'draft');
    }, [tools]);

    // Recently approved (published) - sorted by releasedAt
    const recentlyApproved = useMemo(() => {
        return tools
            .filter(t => t.status === 'published')
            .sort((a, b) => new Date(b.releasedAt || 0).getTime() - new Date(a.releasedAt || 0).getTime())
            .slice(0, 20);
    }, [tools]);

    // Recently rejected (drafts with rejection notes)
    const recentlyRejected = useMemo(() => {
        return tools
            .filter(t => t.status === 'draft' && t.internalNotes?.some(n => n.note.toLowerCase().includes('reject')))
            .sort((a, b) => new Date(b.releasedAt || 0).getTime() - new Date(a.releasedAt || 0).getTime())
            .slice(0, 20);
    }, [tools]);

    // Recently updated (all published tools sorted by release time)
    const recentlyUpdated = useMemo(() => {
        return tools
            .filter(t => t.status === 'published')
            .sort((a, b) => new Date(b.releasedAt || 0).getTime() - new Date(a.releasedAt || 0).getTime())
            .slice(0, 20);
    }, [tools]);

    const allSelected = pendingTools.length > 0 && selectedIds.size === pendingTools.length;
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
        else setSelectedIds(new Set(pendingTools.map(t => t.id)));
    };

    const handleApprove = async (toolId: string) => {
        const tool = tools.find(t => t.id === toolId);
        const toastId = showToast(`Approving "${tool?.name}"...`, 'loading');
        try {
            await updateTool(toolId, { status: 'published' });
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
            updateToast(toastId, `${selectedIds.size} tools rejected`, 'success');
            setSelectedIds(new Set());
        } catch (err) {
            updateToast(toastId, 'Failed to reject some tools', 'error');
        }
    };

    if (!isLoaded) {
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
                        <p className="text-sm text-text-tertiary mt-1">{pendingTools.length} tools pending review</p>
                    </div>
                    {someSelected && (
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

                {/* Tabs */}
                <div className="flex gap-1 mb-4 bg-bg-tertiary rounded-lg p-1">
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'pending' ? 'bg-bg-card text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                    >
                        Pending ({pendingTools.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('approved')}
                        className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'approved' ? 'bg-bg-card text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                    >
                        Recently Approved ({recentlyApproved.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('rejected')}
                        className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'rejected' ? 'bg-bg-card text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                    >
                        Rejected ({recentlyRejected.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('updated')}
                        className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'updated' ? 'bg-bg-card text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                    >
                        Recently Updated ({recentlyUpdated.length})
                    </button>
                </div>

                {/* Content Card */}
                <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                        <h2 className="text-base font-semibold text-text-primary">
                            {activeTab === 'pending' && 'Review Queue'}
                            {activeTab === 'approved' && 'Recently Approved'}
                            {activeTab === 'rejected' && 'Recently Rejected'}
                            {activeTab === 'updated' && 'Recently Updated'}
                        </h2>
                        {activeTab === 'pending' && pendingTools.length > 0 && (
                            <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                                <input type="checkbox" checked={allSelected} onChange={toggleAll}
                                    className="w-4 h-4 rounded border-border text-accent-blue focus:ring-accent-blue" />
                                Select All
                            </label>
                        )}
                    </div>
                    <div className="divide-y divide-border">
                        {/* Pending Tab */}
                        {activeTab === 'pending' && (
                            <>
                                {pendingTools.length === 0 ? (
                                    <div className="p-12 text-center text-text-tertiary">
                                        <svg className="w-10 h-10 text-accent-green mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <path d="M9 12l2 2 4-4"></path>
                                        </svg>
                                        <div className="font-medium">All caught up!</div>
                                        <p className="text-sm mt-1">No tools pending review</p>
                                    </div>
                                ) : (
                                    pendingTools.map((tool) => (
                                        <div key={tool.id} className={`p-5 transition-colors ${selectedIds.has(tool.id) ? 'bg-accent-blue/5' : 'hover:bg-bg-secondary'}`}>
                                            <div className="flex items-start gap-4">
                                                <input type="checkbox" checked={selectedIds.has(tool.id)} onChange={() => toggleSelect(tool.id)}
                                                    className="mt-1 w-4 h-4 rounded border-border text-accent-blue focus:ring-accent-blue" />
                                                {tool.logoUrl ? (
                                                    <img src={tool.logoUrl} alt="" className="w-12 h-12 rounded-lg object-cover" />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-lg bg-accent-blue-bg flex items-center justify-center text-accent-blue font-bold">
                                                        {tool.name[0]}
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-semibold text-text-primary">{tool.name}</h3>
                                                        <span className={`text-xs px-2 py-0.5 rounded-full ${tool.status === 'pending' ? 'bg-accent-purple-bg text-accent-purple' : 'bg-accent-yellow/10 text-accent-yellow'}`}>
                                                            {tool.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-text-secondary line-clamp-2">{tool.summary || tool.description}</p>
                                                    <div className="flex items-center gap-1.5 mt-2 text-xs text-text-tertiary">
                                                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                                        <span>{formatTimeAgo(tool.releasedAt || tool.createdAt) || 'Recently'}</span>
                                                        <span className="text-text-quaternary">•</span>
                                                        <span>{new Date(tool.releasedAt || tool.createdAt || new Date()).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => setPreviewTool(tool)}
                                                        className="p-1.5 text-text-tertiary hover:text-accent-blue hover:bg-accent-blue/10 rounded-lg transition-colors"
                                                        title="Quick Preview"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <Link
                                                        href={`/dashboard/tools/${tool.id}`}
                                                        className="p-1.5 text-text-tertiary hover:text-accent-blue hover:bg-accent-blue/10 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </Link>
                                                    <button onClick={() => handleReject(tool.id)}
                                                        className="flex items-center gap-1 px-2 py-1 text-[10px] text-accent-red bg-accent-red-bg rounded hover:bg-accent-red/20 transition-colors">
                                                        Reject
                                                    </button>
                                                    <button onClick={() => handleApprove(tool.id)}
                                                        className="flex items-center gap-1 px-2 py-1 text-[10px] text-white bg-accent-green rounded hover:opacity-90 transition-opacity">
                                                        Approve
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </>
                        )}

                        {/* Recently Approved / Rejected / Updated Tabs */}
                        {(activeTab === 'approved' || activeTab === 'rejected' || activeTab === 'updated') && (
                            <>
                                {(() => {
                                    const displayTools = activeTab === 'approved' ? recentlyApproved : activeTab === 'rejected' ? recentlyRejected : recentlyUpdated;
                                    if (displayTools.length === 0) {
                                        return (
                                            <div className="p-12 text-center text-text-tertiary">
                                                <svg className="w-10 h-10 text-text-tertiary mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                                                </svg>
                                                <div className="font-medium">No tools here</div>
                                                <p className="text-sm mt-1">
                                                    {activeTab === 'approved' && 'No recently approved tools'}
                                                    {activeTab === 'rejected' && 'No recently rejected tools'}
                                                    {activeTab === 'updated' && 'No recently updated tools'}
                                                </p>
                                            </div>
                                        );
                                    }
                                    return displayTools.map((tool) => (
                                        <div key={tool.id} className="p-5 hover:bg-bg-secondary transition-colors">
                                            <div className="flex items-start gap-4">
                                                {tool.logoUrl ? (
                                                    <img src={tool.logoUrl} alt="" className="w-12 h-12 rounded-lg object-cover" />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-lg bg-accent-blue-bg flex items-center justify-center text-accent-blue font-bold">
                                                        {tool.name[0]}
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-semibold text-text-primary">{tool.name}</h3>
                                                        <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'approved' ? 'bg-accent-green-bg text-accent-green' :
                                                            activeTab === 'rejected' ? 'bg-accent-red-bg text-accent-red' :
                                                                'bg-accent-blue-bg text-accent-blue'
                                                            }`}>
                                                            {activeTab === 'approved' ? 'published' : activeTab === 'rejected' ? 'rejected' : 'updated'}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-text-secondary line-clamp-2">{tool.summary || tool.description}</p>
                                                    <div className="flex items-center gap-1.5 mt-2 text-xs text-text-tertiary">
                                                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                                        <span>{formatTimeAgo(tool.releasedAt || tool.createdAt) || 'Recently'}</span>
                                                        <span className="text-text-quaternary">•</span>
                                                        <span>{new Date(tool.releasedAt || tool.createdAt || new Date()).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => setPreviewTool(tool)}
                                                        className="p-1.5 text-text-tertiary hover:text-accent-blue hover:bg-accent-blue/10 rounded-lg transition-colors"
                                                        title="Quick Preview"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <Link
                                                        href={`/dashboard/tools/${tool.id}`}
                                                        className="p-1.5 text-text-tertiary hover:text-accent-blue hover:bg-accent-blue/10 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    ));
                                })()}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Preview Modal */}
            {previewTool && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setPreviewTool(null)}>
                    <div className="bg-bg-card border border-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        {/* Header with Logo and Name */}
                        <div className="p-6 border-b border-border">
                            <div className="flex items-start gap-4">
                                {previewTool.logoUrl ? (
                                    <img src={previewTool.logoUrl} alt="" className="w-20 h-20 rounded-xl object-cover" />
                                ) : (
                                    <div className="w-20 h-20 bg-accent-blue/20 rounded-xl flex items-center justify-center text-3xl font-bold text-accent-blue">
                                        {previewTool.name[0]}
                                    </div>
                                )}
                                <div className="flex-1">
                                    <h2 className="text-2xl font-bold text-text-primary">{previewTool.name}</h2>
                                    {previewTool.summary && (
                                        <p className="text-text-secondary mt-1">{previewTool.summary}</p>
                                    )}
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                        <span className={`text-xs px-2 py-1 rounded-full ${previewTool.status === 'published' ? 'bg-green-500/10 text-green-500' : previewTool.status === 'draft' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-purple-500/10 text-purple-500'}`}>
                                            {previewTool.status}
                                        </span>
                                        <span className="text-xs px-2 py-1 bg-accent-blue/10 text-accent-blue rounded-full">{previewTool.pricingLabel || previewTool.pricing}</span>
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
                            {previewTool.description && (
                                <div>
                                    <h3 className="text-sm font-medium text-text-tertiary mb-1">Description</h3>
                                    <div className="text-text-primary text-sm leading-relaxed rich-text" dangerouslySetInnerHTML={{ __html: previewTool.description }} />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                {(previewTool.categoryName || []).length > 0 && (
                                    <div>
                                        <h3 className="text-xs font-medium text-text-tertiary mb-1">Category</h3>
                                        <p className="text-sm text-text-primary">{previewTool.categoryName.join(', ')}</p>
                                    </div>
                                )}
                                {(previewTool.taskName || []).length > 0 && (
                                    <div>
                                        <h3 className="text-xs font-medium text-text-tertiary mb-1">Task</h3>
                                        <p className="text-sm text-text-primary">{previewTool.taskName.join(', ')}</p>
                                    </div>
                                )}
                            </div>

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

                            {previewTool.websiteUrl && (
                                <div>
                                    <h3 className="text-xs font-medium text-text-tertiary mb-1">Website</h3>
                                    <a href={previewTool.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-accent-blue hover:underline flex items-center gap-1">
                                        {previewTool.websiteUrl}
                                        <span className="inline-flex">{renderIcon('external-link', 12)}</span>
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="border-t border-border p-4 flex gap-3">
                            <button onClick={() => { setPreviewTool(null); router.push(`/app/${previewTool.slug}`); }}
                                className="flex-1 px-4 py-2.5 bg-accent-blue text-white rounded-xl text-sm font-medium hover:bg-accent-blue/90 flex items-center justify-center gap-2">
                                <span className="inline-flex">{renderIcon('link', 16)}</span> Open Tool Page
                            </button>
                            <button onClick={() => { setPreviewTool(null); router.push(`/dashboard/tools/${previewTool.id}`); }}
                                className="flex-1 px-4 py-2.5 bg-bg-secondary border border-border text-text-primary rounded-xl text-sm font-medium hover:bg-bg-tertiary flex items-center justify-center gap-2">
                                <span className="inline-flex">{renderIcon('edit', 16)}</span> Edit Tool
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
