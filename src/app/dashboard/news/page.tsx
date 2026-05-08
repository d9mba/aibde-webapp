'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
    Plus,
    Search,
    FileText,
    Edit3,
    Trash2,
    Eye,
    ExternalLink,
} from 'lucide-react';
import { NewsArticle, NEWS_CATEGORIES } from '@/types/news';

export default function DashboardNewsPage() {
    const [articles, setArticles] = useState<NewsArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const pageSize = 20;

    const loadArticles = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
            if (categoryFilter && categoryFilter !== 'all') params.set('category', categoryFilter);

            const res = await fetch(`/api/news?${params}`);
            if (!res.ok) throw new Error('Failed to fetch news articles');

            const body = await res.json();
            setArticles(body.data || []);
            setTotal(body.total || 0);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load');
        } finally {
            setLoading(false);
        }
    }, [page, categoryFilter]);

    useEffect(() => { loadArticles(); }, [loadArticles]);

    async function handleDelete(slug: string) {
        if (!confirm('Delete this news article?')) return;

        const res = await fetch(`/api/news/${slug}`, { method: 'DELETE' });
        if (res.ok) loadArticles();
        else alert('Failed to delete');
    }

    const totalPages = Math.ceil(total / pageSize);

    const filtered = search
        ? articles.filter(a => a.title.toLowerCase().includes(search.toLowerCase()) || a.slug.includes(search.toLowerCase()))
        : articles;

    return (
        <div className="min-h-screen p-3 sm:p-6 bg-bg-primary">
            <div className="max-w-[1400px] mx-auto space-y-4 sm:space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-text-primary">News Articles</h1>
                        <p className="text-xs sm:text-sm text-text-tertiary mt-0.5">
                            {total} total article{total !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <Link
                        href="/dashboard/news/new"
                        className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 bg-accent-primary text-white rounded-lg text-xs sm:text-sm font-medium no-underline hover:opacity-90 transition-opacity"
                    >
                        <Plus size={16} />
                        <span className="hidden sm:inline">New Article</span>
                    </Link>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                        <input
                            type="text"
                            placeholder="Search articles..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-bg-card border border-border rounded-lg text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                        />
                    </div>
                    <select
                        value={categoryFilter}
                        onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
                        className="px-3 py-2 bg-bg-card border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                    >
                        {NEWS_CATEGORIES.map(c => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                    </select>
                </div>

                {/* Error */}
                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                        {error}
                        <button onClick={loadArticles} className="ml-2 underline">Retry</button>
                    </div>
                )}

                {/* Articles Table */}
                <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
                    {loading ? (
                        <div className="divide-y divide-border">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-3 px-5 py-3 animate-pulse">
                                    <div className="w-10 h-10 rounded-lg bg-border flex-shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-3.5 bg-border rounded w-2/3" />
                                        <div className="h-3 bg-border rounded w-1/3" />
                                    </div>
                                    <div className="h-5 w-16 bg-border rounded-full" />
                                </div>
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="p-8 text-center text-text-tertiary text-sm">
                            <FileText size={32} className="mx-auto mb-2 opacity-40" />
                            <p>No news articles yet.</p>
                            <Link href="/dashboard/news/new" className="text-accent-primary hover:underline text-sm mt-1 inline-block">
                                Create your first article
                            </Link>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {filtered.map(article => (
                                <div
                                    key={article.id}
                                    className="flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-bg-secondary transition-colors"
                                >
                                    {/* Thumbnail */}
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-bg-tertiary flex-shrink-0 overflow-hidden flex items-center justify-center">
                                        {article.heroImage || article.thumbnail ? (
                                            <img src={(article.heroImage || article.thumbnail)!} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <FileText size={20} className="text-text-tertiary" />
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-text-primary truncate">{article.title}</div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-xs text-text-tertiary">
                                                {NEWS_CATEGORIES.find(c => c.value === article.category)?.label || article.category}
                                            </span>
                                            {article.publishedAt && (
                                                <span className="text-xs text-text-tertiary">
                                                    · {new Date(article.publishedAt).toLocaleDateString()}
                                                </span>
                                            )}
                                            {article.isFeatured && (
                                                <span className="text-[10px] bg-accent-primary/10 text-accent-primary px-1.5 py-0.5 rounded ml-1">
                                                    Featured
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        <Link
                                            href={`/news/${article.slug}`}
                                            target="_blank"
                                            className="p-1.5 rounded-md hover:bg-bg-tertiary text-text-tertiary hover:text-text-primary transition-colors"
                                            title="View live"
                                        >
                                            <ExternalLink size={14} />
                                        </Link>
                                        <Link
                                            href={`/dashboard/news/${article.slug}`}
                                            className="p-1.5 rounded-md hover:bg-bg-tertiary text-text-tertiary hover:text-text-primary transition-colors"
                                            title="Edit"
                                        >
                                            <Edit3 size={14} />
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(article.slug)}
                                            className="p-1.5 rounded-md hover:bg-red-500/10 text-text-tertiary hover:text-red-500 transition-colors border-none bg-transparent cursor-pointer"
                                            title="Delete"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="px-3 py-1.5 text-sm rounded-lg bg-bg-card border border-border text-text-secondary hover:text-text-primary disabled:opacity-40 transition-colors cursor-pointer disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <span className="text-xs text-text-tertiary">
                            {page} / {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="px-3 py-1.5 text-sm rounded-lg bg-bg-card border border-border text-text-secondary hover:text-text-primary disabled:opacity-40 transition-colors cursor-pointer disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
