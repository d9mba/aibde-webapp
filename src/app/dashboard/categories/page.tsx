'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Category } from '@/context/AdminContext';
import { renderIcon } from '@/components/features/admin/AdminLayout';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmModal';
import { Pencil, Trash2 } from 'lucide-react';

const ITEMS_PER_PAGE = 25;
const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) {
        const body = await res.text();
        throw new Error(`${res.status}: ${body}`);
    }
    return res.json();
};

// Helper to slugify category name for URLs
const slugify = (str: string) => str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

function useDebounce(value: string, delay: number): string {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debouncedValue;
}

interface PaginatedResponse {
    data: Category[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export default function CategoriesPage() {
    const router = useRouter();
    const { showToast, updateToast } = useToast();
    const { confirm } = useConfirm();
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageLoading, setPageLoading] = useState(false);
    const debouncedSearch = useDebounce(search, 300);

    // Build API URL with pagination and search
    const apiUrl = useMemo(() => {
        const params = new URLSearchParams();
        params.set('page', String(currentPage));
        params.set('limit', String(ITEMS_PER_PAGE));
        if (debouncedSearch) params.set('search', debouncedSearch);
        return `/api/categories?${params.toString()}`;
    }, [currentPage, debouncedSearch]);

    // Fetch categories with server-side pagination
    const { data: response, isLoading, mutate } = useSWR<PaginatedResponse>(
        apiUrl,
        fetcher,
        {
            revalidateOnFocus: false,
            keepPreviousData: true,
            onSuccess: () => setPageLoading(false),
            onError: () => setPageLoading(false),
        }
    );

    const categories = response?.data || [];
    const pagination = response?.pagination;
    const totalPages = pagination?.totalPages || 0;

    // Page change handler - sets loading immediately
    const handlePageChange = useCallback((newPage: number) => {
        setPageLoading(true);
        setCurrentPage(newPage);
    }, []);

    // Search change handler - sets loading immediately
    const handleSearchChange = useCallback((value: string) => {
        setSearch(value);
        setCurrentPage(1);
        if (value !== search) setPageLoading(true);
    }, [search]);

    const handleAdd = async () => {
        if (!newName.trim()) return;
        const toastId = showToast('Creating category...', 'loading');
        try {
            const res = await fetch('/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ categoryName: newName.trim(), count: 0, description: newDesc.trim() }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to create category');
            }
            updateToast(toastId, `Category "${newName}" created!`, 'success');
            setNewName(''); setNewDesc('');
            mutate();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to create category';
            updateToast(toastId, message, 'error');
        }
    };

    const startEdit = (cat: Category, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingId(cat.id); setEditName(cat.categoryName); setEditDesc(cat.description || '');
    };

    const saveEdit = async (id: string, e: React.SyntheticEvent) => {
        e.stopPropagation();
        if (!editName.trim()) return;
        const toastId = showToast('Saving changes...', 'loading');
        try {
            const res = await fetch('/api/categories', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, categoryName: editName.trim(), description: editDesc.trim() }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to update category');
            }
            updateToast(toastId, 'Category updated!', 'success');
            setEditingId(null);
            mutate();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to update category';
            updateToast(toastId, message, 'error');
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
            const res = await fetch(`/api/categories?id=${cat.id}`, { method: 'DELETE' });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to delete category');
            }
            updateToast(toastId, `Category "${cat.categoryName}" deleted!`, 'success');
            mutate();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to delete category';
            updateToast(toastId, message, 'error');
        }
    };

    // Initial loading state (only on first load, not page changes)
    if (!response && isLoading) {
        return (
            <div className="p-3 sm:p-6 flex items-center justify-center min-h-[300px]">
                <div className="animate-spin w-8 h-8 border-[3px] border-accent-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="p-3 sm:p-6">

            <div className="flex justify-between items-center mb-4 sm:mb-6">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Categories</h1>
                    <p className="text-text-secondary text-xs sm:text-sm mt-0.5 sm:mt-1">
                        {pagination ? `${pagination.total} categories` : 'Loading...'}
                    </p>
                </div>
            </div>

            {/* Add New Category */}
            <div className="bg-bg-card border border-border rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
                <h3 className="font-medium text-text-primary text-sm sm:text-base mb-3">Add New Category</h3>
                <div className="flex flex-col sm:flex-row gap-2">
                    <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Category name..." className="flex-1 px-3 py-2 bg-bg-secondary border border-border rounded-xl text-sm" />
                    <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Description (optional)..." className="flex-1 px-3 py-2 bg-bg-secondary border border-border rounded-xl text-sm" />
                    <button onClick={handleAdd} className="px-4 py-2 bg-accent-primary text-white rounded-xl text-sm whitespace-nowrap">Add Category</button>
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


            {/* Data section */}
            <div className="relative">
                {pageLoading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center">
                        <div className="animate-spin w-7 h-7 border-[3px] border-accent-primary border-t-transparent rounded-full" />
                    </div>
                )}

                {/* Mobile Card View */}
                <div className="sm:hidden space-y-2" style={{ opacity: pageLoading ? 0.4 : 1, transition: 'opacity 0.2s', pointerEvents: pageLoading ? 'none' : 'auto' }}>
                    {categories.length === 0 ? (
                        <div className="bg-bg-card border border-border rounded-xl p-6 text-center text-text-tertiary text-sm">
                            {search ? 'No categories match your search' : 'No categories found'}
                        </div>
                    ) : (
                        categories.map((cat: Category) => (
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
                                        {cat.count || 0}
                                    </span>
                                </div>
                                <div className="flex items-center justify-end gap-1 mt-2 pt-2 border-t border-border" onClick={e => e.stopPropagation()}>
                                    {editingId === cat.id ? (
                                        <>
                                            <button onClick={(e) => saveEdit(cat.id, e)} className="px-3 py-1.5 bg-accent-primary text-white rounded-lg text-xs font-medium">Save</button>
                                            <button onClick={(e) => { e.stopPropagation(); setEditingId(null); }} className="px-3 py-1.5 bg-bg-secondary text-text-secondary rounded-lg text-xs">Cancel</button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={(e) => startEdit(cat, e)} className="p-2 text-text-tertiary hover:text-accent-primary rounded-lg"><Pencil className="w-4 h-4" /></button>
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
                        <tbody style={{ opacity: pageLoading ? 0.4 : 1, transition: 'opacity 0.2s' }}>
                            {categories.length === 0 ? (
                                <tr><td colSpan={4} className="px-4 py-8 text-center text-text-tertiary">{search ? 'No categories match your search' : 'No categories found'}</td></tr>
                            ) : (
                                categories.map((cat: Category) => (
                                    <tr key={cat.id} className="border-t border-border hover:bg-bg-secondary/50 cursor-pointer" onClick={() => router.push(`/dashboard/categories/${slugify(cat.categoryName)}`)}>
                                        <td className="px-4 py-3">
                                            {editingId === cat.id ? (
                                                <input autoFocus value={editName} onChange={e => setEditName(e.target.value)} onClick={e => e.stopPropagation()} onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); saveEdit(cat.id, e); } }} className="px-2 py-1 bg-bg-secondary border border-border rounded text-sm w-full" />
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
                                                {cat.count || 0} tool{(cat.count || 0) !== 1 ? 's' : ''}
                                                <span className="text-text-tertiary">→</span>
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {editingId === cat.id ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={(e) => saveEdit(cat.id, e)} className="px-3 py-1.5 bg-accent-primary text-white rounded-lg text-xs font-medium hover:bg-accent-primary/90">Save</button>
                                                    <button onClick={(e) => { e.stopPropagation(); setEditingId(null); }} className="px-3 py-1.5 bg-bg-secondary text-text-secondary border border-border rounded-lg text-xs font-medium hover:bg-bg-tertiary">Cancel</button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={(e) => startEdit(cat, e)} className="p-2 text-text-tertiary hover:text-accent-primary hover:bg-accent-primary/10 rounded-lg transition-colors" title="Edit">
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
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 px-1">
                    <span className="text-sm text-text-tertiary">
                        Page {currentPage} of {totalPages} ({pagination?.total} total)
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-sm text-text-secondary hover:bg-bg-secondary disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
                            Previous
                        </button>
                        <span className="text-sm text-text-tertiary">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage >= totalPages}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-sm text-text-secondary hover:bg-bg-secondary disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            Next
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
