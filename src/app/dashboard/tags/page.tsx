'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin, Tag } from '@/context/AdminContext';
import { renderIcon } from '@/components/features/admin/AdminLayout';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmModal';
import { ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react';

const ITEMS_PER_PAGE = 25;

export default function TagsPage() {
    const router = useRouter();
    const { tags, tools, addTag, updateTag, deleteTag } = useAdmin();
    const { showToast, updateToast } = useToast();
    const { confirm } = useConfirm();
    const [newName, setNewName] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    // Count tools that have this tag in their tags array
    const tagCounts = tags.reduce((acc: Record<string, number>, tag: Tag) => {
        acc[tag.id] = tools.filter((t) => t.tags?.includes(tag.tagName)).length;
        return acc;
    }, {} as Record<string, number>);

    const filteredTags = useMemo(() => {
        return tags.filter((tag: Tag) =>
            (tag.tagName || '').toLowerCase().includes(search.toLowerCase())
        );
    }, [tags, search]);

    // Pagination
    const totalPages = Math.ceil(filteredTags.length / ITEMS_PER_PAGE);
    const paginatedTags = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredTags.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredTags, currentPage]);

    // Reset to page 1 when search changes
    const handleSearch = (value: string) => {
        setSearch(value);
        setCurrentPage(1);
    };

    const handleAdd = async () => {
        if (!newName.trim()) return;
        const toastId = showToast('Creating tag...', 'loading');
        try {
            await addTag({ tagName: newName.trim(), count: 0 });
            updateToast(toastId, `Tag "#${newName}" created!`, 'success');
            setNewName('');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to create tag';
            updateToast(toastId, message, 'error');
        }
    };

    const startEdit = (tag: Tag, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingId(tag.id); setEditName(tag.tagName);
    };

    const saveEdit = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!editName.trim()) return;
        const toastId = showToast('Saving changes...', 'loading');
        try {
            await updateTag(id, { tagName: editName.trim() });
            updateToast(toastId, 'Tag updated!', 'success');
            setEditingId(null);
        } catch (err) {
            updateToast(toastId, 'Failed to update tag', 'error');
        }
    };

    const handleDelete = async (tag: Tag, e: React.MouseEvent) => {
        e.stopPropagation();
        const confirmed = await confirm({
            title: 'Delete Tag',
            message: `Are you sure you want to delete "#${tag.tagName}"? This action cannot be undone.`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            danger: true
        });
        if (!confirmed) return;
        const toastId = showToast('Deleting tag...', 'loading');
        try {
            await deleteTag(tag.id);
            updateToast(toastId, `Tag "#${tag.tagName}" deleted!`, 'success');
        } catch (err) {
            updateToast(toastId, 'Failed to delete tag', 'error');
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Tags</h1>
                    <p className="text-text-secondary text-sm mt-1">{tags.length} tags across {tools.length} tools</p>
                </div>
            </div>

            {/* Add New Tag */}
            <div className="bg-bg-card border border-border rounded-xl p-4 mb-6">
                <h3 className="font-medium text-text-primary mb-3">Add New Tag</h3>
                <div className="flex gap-2">
                    <div className="flex items-center px-3 py-2 bg-bg-secondary border border-border rounded-xl text-sm text-accent-primary font-medium">
                        #
                    </div>
                    <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Tag name..." className="flex-1 px-3 py-2 bg-bg-secondary border border-border rounded-xl text-sm" onKeyDown={e => e.key === 'Enter' && handleAdd()} />
                    <button onClick={handleAdd} className="px-4 py-2 bg-accent-primary text-white rounded-xl text-sm font-medium hover:bg-accent-primary/90 transition-colors">Add Tag</button>
                </div>
            </div>

            {/* Search */}
            <div className="mb-4">
                <div className="relative max-w-sm">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">{renderIcon('search', 16)}</span>
                    <input value={search} onChange={e => handleSearch(e.target.value)} placeholder="Search tags..."
                        className="w-full pl-9 pr-3 py-2.5 bg-bg-secondary border border-border rounded-xl text-sm text-text-primary" />
                </div>
            </div>

            {/* Tags Table */}
            <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead className="bg-bg-secondary">
                        <tr>
                            <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">Tag</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">Tools</th>
                            <th className="text-right px-4 py-3 text-sm font-medium text-text-secondary">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedTags.length === 0 ? (
                            <tr><td colSpan={3} className="px-4 py-8 text-center text-text-tertiary">{search ? 'No tags match your search' : 'No tags found'}</td></tr>
                        ) : (
                            paginatedTags.map((tag: Tag) => (
                                <tr key={tag.id} className="border-t border-border hover:bg-bg-secondary/50 cursor-pointer" onClick={() => router.push(`/dashboard/tags/${encodeURIComponent(tag.tagName)}`)}>
                                    <td className="px-4 py-3">
                                        {editingId === tag.id ? (
                                            <div className="flex items-center gap-1">
                                                <span className="text-accent-primary font-medium">#</span>
                                                <input autoFocus value={editName} onChange={e => setEditName(e.target.value)} onClick={e => e.stopPropagation()} onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); saveEdit(tag.id, e as unknown as React.MouseEvent); } }} className="px-2 py-1 bg-bg-secondary border border-border rounded text-sm" />
                                            </div>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-1 bg-accent-primary/10 text-accent-primary rounded-lg text-sm font-medium">#{tag.tagName}</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-text-secondary text-sm">
                                        <span className="inline-flex items-center gap-1">
                                            {tagCounts[tag.id] || 0} tool{(tagCounts[tag.id] || 0) !== 1 ? 's' : ''}
                                            <span className="text-text-tertiary">→</span>
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {editingId === tag.id ? (
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={(e) => saveEdit(tag.id, e)} className="px-3 py-1.5 bg-accent-primary text-white rounded-lg text-xs font-medium hover:bg-accent-primary/90">Save</button>
                                                <button onClick={(e) => { e.stopPropagation(); setEditingId(null); }} className="px-3 py-1.5 bg-bg-secondary text-text-secondary border border-border rounded-lg text-xs font-medium hover:bg-bg-tertiary">Cancel</button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={(e) => startEdit(tag, e)} className="p-2 text-text-tertiary hover:text-accent-primary hover:bg-accent-primary/10 rounded-lg transition-colors" title="Edit">
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button onClick={(e) => handleDelete(tag, e)} className="p-2 text-text-tertiary hover:text-accent-red hover:bg-accent-red/10 rounded-lg transition-colors" title="Delete">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 px-1">
                    <span className="text-sm text-text-tertiary">
                        Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredTags.length)} of {filteredTags.length}
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
                            Page {currentPage} of {totalPages}
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
    );
}
