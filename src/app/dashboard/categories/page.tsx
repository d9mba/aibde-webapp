'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/context/AdminContext';
import { Category, AdminTool } from '@/context/AdminContext';
import { renderIcon } from '@/components/features/admin/AdminLayout';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmModal';
import { Pencil, Trash2 } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

// Helper to slugify category name for URLs
const slugify = (str: string) => str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

export default function CategoriesPage() {
    const router = useRouter();
    const { categories, tools, addCategory, updateCategory, deleteCategory } = useAdmin();
    const { showToast, updateToast } = useToast();
    const { confirm } = useConfirm();
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const categoryCounts = categories.reduce((acc: Record<string, number>, cat: Category) => {
        acc[cat.id] = tools.filter((t: AdminTool) => (t.categoryName || []).includes(cat.categoryName)).length;
        return acc;
    }, {} as Record<string, number>);

    const filteredCategories = categories.filter((cat: Category) =>
        cat.categoryName.toLowerCase().includes(search.toLowerCase()) ||
        (cat.description || '').toLowerCase().includes(search.toLowerCase())
    );

    // Pagination
    const totalPages = Math.ceil(filteredCategories.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedCategories = filteredCategories.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    // Reset to page 1 when search changes
    const handleSearchChange = (value: string) => {
        setSearch(value);
        setCurrentPage(1);
    };

    const handleAdd = async () => {
        if (!newName.trim()) return;
        const toastId = showToast('Creating category...', 'loading');
        try {
            await addCategory({ categoryName: newName.trim(), count: 0, description: newDesc.trim() });
            updateToast(toastId, `Category "${newName}" created!`, 'success');
            setNewName(''); setNewDesc('');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to create category';
            updateToast(toastId, message, 'error');
        }
    };

    const startEdit = (cat: Category, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingId(cat.id); setEditName(cat.categoryName); setEditDesc(cat.description || '');
    };

    const saveEdit = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!editName.trim()) return;
        const toastId = showToast('Saving changes...', 'loading');
        try {
            await updateCategory(id, { categoryName: editName.trim(), description: editDesc.trim() });
            updateToast(toastId, 'Category updated!', 'success');
            setEditingId(null);
        } catch (err) {
            updateToast(toastId, 'Failed to update category', 'error');
        }
    };

    const handleDelete = async (cat: Category, e: React.MouseEvent) => {
        e.stopPropagation();
        const confirmed = await confirm({
            title: 'Delete Category',
            message: `Are you sure you want to delete "${cat.categoryName}"? This action cannot be undone.`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            danger: true
        });
        if (!confirmed) return;
        const toastId = showToast('Deleting category...', 'loading');
        try {
            await deleteCategory(cat.id);
            updateToast(toastId, `Category "${cat.categoryName}" deleted!`, 'success');
        } catch (err) {
            updateToast(toastId, 'Failed to delete category', 'error');
        }
    };

    return (
        <div className="p-3 sm:p-6">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Categories</h1>
                    <p className="text-text-secondary text-xs sm:text-sm mt-0.5 sm:mt-1">{categories.length} categories across {tools.length} tools</p>
                </div>
            </div>

            {/* Add New Category */}
            <div className="bg-bg-card border border-border rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
                <h3 className="font-medium text-text-primary text-sm sm:text-base mb-3">Add New Category</h3>
                <div className="flex flex-col sm:flex-row gap-2">
                    <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Category name..." className="flex-1 px-3 py-2 bg-bg-secondary border border-border rounded-xl text-sm" />
                    <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Description (optional)..." className="flex-1 px-3 py-2 bg-bg-secondary border border-border rounded-xl text-sm" />
                    <button onClick={handleAdd} className="px-4 py-2 bg-accent-blue text-white rounded-xl text-sm whitespace-nowrap">Add Category</button>
                </div>
            </div>

            {/* Search */}
            <div className="mb-4">
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">{renderIcon('search', 16)}</span>
                    <input value={search} onChange={e => handleSearchChange(e.target.value)} placeholder="Search categories..."
                        className="w-full sm:max-w-sm pl-9 pr-3 py-2 sm:py-2.5 bg-bg-secondary border border-border rounded-xl text-sm text-text-primary" />
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="sm:hidden space-y-2">
                {paginatedCategories.length === 0 ? (
                    <div className="bg-bg-card border border-border rounded-xl p-6 text-center text-text-tertiary text-sm">
                        {search ? 'No categories match your search' : 'No categories found'}
                    </div>
                ) : (
                    paginatedCategories.map((cat: Category) => (
                        <div
                            key={cat.id}
                            className="bg-bg-card border border-border rounded-xl p-3 active:bg-bg-secondary"
                            onClick={() => router.push(`/dashboard/categories/${slugify(cat.categoryName)}`)}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    {editingId === cat.id ? (
                                        <input autoFocus value={editName} onChange={e => setEditName(e.target.value)} onClick={e => e.stopPropagation()} className="px-2 py-1 bg-bg-secondary border border-border rounded text-sm w-full mb-1" />
                                    ) : (
                                        <div className="font-medium text-text-primary truncate">{cat.categoryName}</div>
                                    )}
                                    {editingId === cat.id ? (
                                        <input value={editDesc} onChange={e => setEditDesc(e.target.value)} onClick={e => e.stopPropagation()} className="px-2 py-1 bg-bg-secondary border border-border rounded text-sm w-full" placeholder="Description..." />
                                    ) : (
                                        <div className="text-xs text-text-tertiary line-clamp-1 mt-0.5">{cat.description || 'No description'}</div>
                                    )}
                                </div>
                                <span className="text-xs px-2 py-0.5 bg-bg-tertiary text-text-secondary rounded-full flex-shrink-0">
                                    {categoryCounts[cat.id] || 0}
                                </span>
                            </div>
                            <div className="flex items-center justify-end gap-1 mt-2 pt-2 border-t border-border" onClick={e => e.stopPropagation()}>
                                {editingId === cat.id ? (
                                    <>
                                        <button onClick={(e) => saveEdit(cat.id, e)} className="px-3 py-1.5 bg-accent-blue text-white rounded-lg text-xs font-medium">Save</button>
                                        <button onClick={(e) => { e.stopPropagation(); setEditingId(null); }} className="px-3 py-1.5 bg-bg-secondary text-text-secondary rounded-lg text-xs">Cancel</button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={(e) => startEdit(cat, e)} className="p-2 text-text-tertiary hover:text-accent-blue rounded-lg"><Pencil className="w-4 h-4" /></button>
                                        <button onClick={(e) => handleDelete(cat, e)} className="p-2 text-text-tertiary hover:text-accent-red rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block bg-bg-card border border-border rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead className="bg-bg-secondary">
                        <tr>
                            <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">Name</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">Description</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">Tools</th>
                            <th className="text-right px-4 py-3 text-sm font-medium text-text-secondary">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedCategories.length === 0 ? (
                            <tr><td colSpan={4} className="px-4 py-8 text-center text-text-tertiary">{search ? 'No categories match your search' : 'No categories found'}</td></tr>
                        ) : (
                            paginatedCategories.map((cat: Category) => (
                                <tr key={cat.id} className="border-t border-border hover:bg-bg-secondary/50 cursor-pointer" onClick={() => router.push(`/dashboard/categories/${slugify(cat.categoryName)}`)}>
                                    <td className="px-4 py-3">
                                        {editingId === cat.id ? (
                                            <input autoFocus value={editName} onChange={e => setEditName(e.target.value)} onClick={e => e.stopPropagation()} onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); saveEdit(cat.id, e as unknown as React.MouseEvent); } }} className="px-2 py-1 bg-bg-secondary border border-border rounded text-sm w-full" />
                                        ) : (
                                            <span className="font-medium text-text-primary">{cat.categoryName}</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-text-secondary text-sm">
                                        {editingId === cat.id ? (
                                            <input value={editDesc} onChange={e => setEditDesc(e.target.value)} onClick={e => e.stopPropagation()} className="px-2 py-1 bg-bg-secondary border border-border rounded text-sm w-full" />
                                        ) : (
                                            cat.description || '-'
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-text-secondary text-sm">
                                        <span className="inline-flex items-center gap-1">
                                            {categoryCounts[cat.id] || 0} tool{(categoryCounts[cat.id] || 0) !== 1 ? 's' : ''}
                                            <span className="text-text-tertiary">→</span>
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {editingId === cat.id ? (
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={(e) => saveEdit(cat.id, e)} className="px-3 py-1.5 bg-accent-blue text-white rounded-lg text-xs font-medium hover:bg-accent-blue/90">Save</button>
                                                <button onClick={(e) => { e.stopPropagation(); setEditingId(null); }} className="px-3 py-1.5 bg-bg-secondary text-text-secondary border border-border rounded-lg text-xs font-medium hover:bg-bg-tertiary">Cancel</button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={(e) => startEdit(cat, e)} className="p-2 text-text-tertiary hover:text-accent-blue hover:bg-accent-blue/10 rounded-lg transition-colors" title="Edit">
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button onClick={(e) => handleDelete(cat, e)} className="p-2 text-text-tertiary hover:text-accent-red hover:bg-accent-red/10 rounded-lg transition-colors" title="Delete">
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
            <div className="flex items-center justify-center gap-2 mt-4">
                <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-border text-text-secondary hover:bg-bg-secondary disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium ${currentPage === page ? 'bg-accent-blue text-white' : 'border border-border text-text-secondary hover:bg-bg-secondary'}`}
                    >
                        {page}
                    </button>
                ))}
                <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-border text-text-secondary hover:bg-bg-secondary disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                </button>
            </div>
        </div>
    );
}
