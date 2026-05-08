'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    Save,
    Eye,
    Trash2,
    Plus,
    X,
    Upload,
} from 'lucide-react';
import { NewsArticle, NEWS_CATEGORIES, NewsCategory, NewsSource } from '@/types/news';
import RichTextEditor from '@/components/ui/RichTextEditor';

interface NewsEditorProps {
    articleSlug?: string; // undefined = new article
}

const EMPTY_ARTICLE: Partial<NewsArticle> = {
    title: '',
    slug: '',
    summary: '',
    content: '',
    category: 'all',
    thumbnail: null,
    heroImage: null,
    sources: [],
    tags: [],
    relatedToolSlugs: [],
    isFeatured: false,
};

export default function NewsEditor({ articleSlug }: NewsEditorProps) {
    const router = useRouter();
    const [article, setArticle] = useState<Partial<NewsArticle>>(EMPTY_ARTICLE);
    const [loading, setLoading] = useState(!!articleSlug);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Inputs
    const [tagInput, setTagInput] = useState('');
    const [toolInput, setToolInput] = useState('');
    
    // Sources inputs
    const [sourceName, setSourceName] = useState('');
    const [sourceUrl, setSourceUrl] = useState('');
    const [sourceFavicon, setSourceFavicon] = useState('');

    const [uploading, setUploading] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        if (!articleSlug) return;
        async function load() {
            const res = await fetch(`/api/news/${articleSlug}`);
            if (res.ok) {
                const body = await res.json();
                setArticle(body.data);
            } else {
                setError('Failed to load article');
            }
            setLoading(false);
        }
        load();
    }, [articleSlug]);

    function handleTitleChange(title: string) {
        const updates: Partial<NewsArticle> = { title };
        if (!articleSlug || !article.slug) {
            updates.slug = title
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .trim();
        }
        setArticle(prev => ({ ...prev, ...updates }));
        setIsDirty(true);
    }

    async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>, field: 'heroImage' | 'thumbnail') {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', 'news');

            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            if (!res.ok) throw new Error('Upload failed');

            const { url } = await res.json();
            setArticle(prev => ({ ...prev, [field]: url }));
            setIsDirty(true);
        } catch {
            setError('Image upload failed');
        } finally {
            setUploading(false);
        }
    }

    const handleEditorImageInsert = useCallback(async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'news');

        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!res.ok) throw new Error('Upload failed');

        const { url } = await res.json();
        return url;
    }, []);

    async function handleSave() {
        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            // Need to auto-calculate readTimeMinutes based on content length
            // rough heuristic: ~200 words per minute
            const wordCount = (article.content || '').split(/\s+/).length;
            const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

            const payload = {
                ...article,
                readTimeMinutes
            };

            const url = articleSlug ? `/api/news/${articleSlug}` : '/api/news';
            const method = articleSlug ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const body = await res.json();
                throw new Error(body.error || 'Failed to save');
            }

            const body = await res.json();
            setSuccess('Saved successfully!');
            setIsDirty(false);

            if (!articleSlug) {
                router.push(`/dashboard/news/${body.data.slug}`);
            } else {
                setArticle(body.data);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save');
        } finally {
            setSaving(false);
        }
    }

    function addTag() {
        const tag = tagInput.trim();
        if (!tag || (article.tags || []).includes(tag)) return;
        setArticle(prev => ({ ...prev, tags: [...(prev.tags || []), tag] }));
        setTagInput('');
        setIsDirty(true);
    }

    function addTool() {
        const slug = toolInput.trim();
        if (!slug || (article.relatedToolSlugs || []).includes(slug)) return;
        setArticle(prev => ({ ...prev, relatedToolSlugs: [...(prev.relatedToolSlugs || []), slug] }));
        setToolInput('');
        setIsDirty(true);
    }

    function addSource() {
        if (!sourceUrl.trim()) return;
        
        let name = sourceName.trim();
        let favicon = sourceFavicon.trim();

        try {
            const urlObj = new URL(sourceUrl.trim());
            
            if (!name) {
                // Extract domain name (e.g., 'techcrunch.com' -> 'Techcrunch')
                let domain = urlObj.hostname.replace(/^www\./i, '');
                const parts = domain.split('.');
                if (parts.length > 1) {
                    // Try to avoid tlds like co.uk by grabbing the part before the last if length is 2
                    // or handling typical domains. For simplicity, grab the part right before the tld.
                    // If it's something like domain.co.uk, it might grab 'co', but we'll stick to a simple heuristic
                    domain = parts.length > 2 && parts[parts.length - 2] === 'co' 
                        ? parts[parts.length - 3] 
                        : parts[parts.length - 2];
                } else {
                    domain = parts[0];
                }
                name = domain.charAt(0).toUpperCase() + domain.slice(1);
            }

            if (!favicon) {
                favicon = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=128`;
            }
        } catch (e) {
            // Ignore invalid URL
        }

        if (!name) return; // Cannot add source without a name

        const newSource: NewsSource = {
            name,
            url: sourceUrl.trim(),
            favicon
        };

        setArticle(prev => ({ ...prev, sources: [...(prev.sources || []), newSource] }));
        setSourceName('');
        setSourceUrl('');
        setSourceFavicon('');
        setIsDirty(true);
    }

    function removeSource(index: number) {
        setArticle(prev => ({ ...prev, sources: (prev.sources || []).filter((_, i) => i !== index) }));
        setIsDirty(true);
    }

    if (loading) {
        return (
            <div className="min-h-screen p-6 bg-bg-primary flex items-center justify-center">
                <div className="animate-pulse text-text-tertiary">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-3 sm:p-6 bg-bg-primary">
            <div className="max-w-[1000px] mx-auto space-y-4 sm:space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard/news" className="text-text-tertiary hover:text-text-primary transition-colors">
                            <ArrowLeft size={20} />
                        </Link>
                        <h1 className="text-xl sm:text-2xl font-bold text-text-primary">
                            {articleSlug ? 'Edit Article' : 'New Article'}
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        {article.slug && (
                            <Link
                                href={`/news/${article.slug}`}
                                target="_blank"
                                className="flex items-center gap-1 px-3 py-2 bg-bg-card border border-border rounded-lg text-xs text-text-secondary hover:text-text-primary transition-colors no-underline"
                            >
                                <Eye size={14} />
                                <span className="hidden sm:inline">View Live</span>
                            </Link>
                        )}
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-1 px-3 py-2 bg-accent-primary text-white rounded-lg text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
                        >
                            <Save size={14} />
                            <span>{saving ? 'Saving...' : 'Save Article'}</span>
                        </button>
                    </div>
                </div>

                {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{error}</div>}
                {success && <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">{success}</div>}

                <div className="space-y-4">
                    {/* Basic Info */}
                    <div className="bg-bg-card border border-border rounded-xl p-4 space-y-3">
                        <label className="text-xs font-medium text-text-tertiary uppercase tracking-wide">Title & Settings</label>
                        <input
                            type="text"
                            value={article.title || ''}
                            onChange={e => handleTitleChange(e.target.value)}
                            placeholder="Article Title..."
                            className="w-full px-3 py-2.5 bg-bg-primary border border-border rounded-lg text-base text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                        />
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1">
                                <label className="text-xs text-text-tertiary">Slug</label>
                                <input
                                    type="text"
                                    value={article.slug || ''}
                                    onChange={e => { setArticle(p => ({ ...p, slug: e.target.value })); setIsDirty(true); }}
                                    className="w-full mt-1 px-3 py-2 bg-bg-primary border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                                />
                            </div>
                            <div className="sm:w-48">
                                <label className="text-xs text-text-tertiary">Category</label>
                                <select
                                    value={article.category || 'all'}
                                    onChange={e => { setArticle(p => ({ ...p, category: e.target.value as NewsCategory })); setIsDirty(true); }}
                                    className="w-full mt-1 px-3 py-2 bg-bg-primary border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                                >
                                    {NEWS_CATEGORIES.map(cat => (
                                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <input
                                type="checkbox"
                                id="isFeatured"
                                checked={article.isFeatured || false}
                                onChange={e => { setArticle(p => ({ ...p, isFeatured: e.target.checked })); setIsDirty(true); }}
                                className="w-4 h-4 text-accent-primary bg-bg-primary border-border rounded focus:ring-accent-primary"
                            />
                            <label htmlFor="isFeatured" className="text-sm text-text-primary cursor-pointer">
                                Mark as Featured Article
                            </label>
                        </div>
                    </div>

                    {/* Images */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Hero Image */}
                        <div className="bg-bg-card border border-border rounded-xl p-4 space-y-3">
                            <label className="text-xs font-medium text-text-tertiary uppercase tracking-wide">Hero Image</label>
                            {article.heroImage ? (
                                <div className="relative">
                                    <img src={article.heroImage} alt="Hero" className="w-full h-32 object-cover rounded-lg" />
                                    <button onClick={() => setArticle(p => ({ ...p, heroImage: null }))} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-md">
                                        <X size={14} />
                                    </button>
                                </div>
                            ) : (
                                <label className="flex items-center justify-center gap-2 h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-accent-primary transition-colors">
                                    <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'heroImage')} className="hidden" />
                                    <Upload size={20} className="text-text-tertiary" />
                                    <span className="text-sm text-text-tertiary">{uploading ? 'Uploading...' : 'Upload Hero Image'}</span>
                                </label>
                            )}
                        </div>

                        {/* Thumbnail */}
                        <div className="bg-bg-card border border-border rounded-xl p-4 space-y-3">
                            <label className="text-xs font-medium text-text-tertiary uppercase tracking-wide">Thumbnail (Optional)</label>
                            {article.thumbnail ? (
                                <div className="relative">
                                    <img src={article.thumbnail} alt="Thumbnail" className="w-full h-32 object-cover rounded-lg" />
                                    <button onClick={() => setArticle(p => ({ ...p, thumbnail: null }))} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-md">
                                        <X size={14} />
                                    </button>
                                </div>
                            ) : (
                                <label className="flex items-center justify-center gap-2 h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-accent-primary transition-colors">
                                    <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'thumbnail')} className="hidden" />
                                    <Upload size={20} className="text-text-tertiary" />
                                    <span className="text-sm text-text-tertiary">{uploading ? 'Uploading...' : 'Upload Thumbnail'}</span>
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="bg-bg-card border border-border rounded-xl p-4 space-y-3">
                        <label className="text-xs font-medium text-text-tertiary uppercase tracking-wide">AI Summary</label>
                        <textarea
                            value={article.summary || ''}
                            onChange={e => { setArticle(p => ({ ...p, summary: e.target.value })); setIsDirty(true); }}
                            placeholder="Brief AI summary..."
                            rows={3}
                            className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary resize-y"
                        />
                    </div>

                    {/* Content */}
                    <div className="bg-bg-card border border-border rounded-xl p-4 space-y-3">
                        <label className="text-xs font-medium text-text-tertiary uppercase tracking-wide">Full Content</label>
                        <RichTextEditor
                            value={article.content || ''}
                            onChange={content => { setArticle(p => ({ ...p, content })); setIsDirty(true); }}
                            placeholder="Write the full article content here..."
                            onImageInsert={handleEditorImageInsert}
                        />
                    </div>

                    {/* Taxonomy */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Tags */}
                        <div className="bg-bg-card border border-border rounded-xl p-4 space-y-3">
                            <label className="text-xs font-medium text-text-tertiary uppercase tracking-wide">Tags</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={tagInput}
                                    onChange={e => setTagInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                    placeholder="e.g. gpt-4, startup"
                                    className="flex-1 px-3 py-2 bg-bg-primary border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                                />
                                <button onClick={addTag} className="px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-sm text-text-secondary">
                                    <Plus size={16} />
                                </button>
                            </div>
                            {(article.tags || []).length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {article.tags!.map(tag => (
                                        <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent-primary/10 text-accent-primary rounded-full text-xs">
                                            {tag}
                                            <button onClick={() => { setArticle(p => ({ ...p, tags: p.tags?.filter(t => t !== tag) })); setIsDirty(true); }} className="hover:text-red-400 cursor-pointer bg-transparent border-none">
                                                <X size={10} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Related Tools */}
                        <div className="bg-bg-card border border-border rounded-xl p-4 space-y-3">
                            <label className="text-xs font-medium text-text-tertiary uppercase tracking-wide">Related Tools</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={toolInput}
                                    onChange={e => setToolInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTool())}
                                    placeholder="Tool slug..."
                                    className="flex-1 px-3 py-2 bg-bg-primary border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                                />
                                <button onClick={addTool} className="px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-sm text-text-secondary">
                                    <Plus size={16} />
                                </button>
                            </div>
                            {(article.relatedToolSlugs || []).length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {article.relatedToolSlugs!.map(slug => (
                                        <span key={slug} className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full text-xs">
                                            {slug}
                                            <button onClick={() => { setArticle(p => ({ ...p, relatedToolSlugs: p.relatedToolSlugs?.filter(s => s !== slug) })); setIsDirty(true); }} className="hover:text-red-400 cursor-pointer bg-transparent border-none">
                                                <X size={10} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sources */}
                    <div className="bg-bg-card border border-border rounded-xl p-4 space-y-3">
                        <label className="text-xs font-medium text-text-tertiary uppercase tracking-wide">Sources</label>
                        
                        {(article.sources || []).length > 0 && (
                            <div className="space-y-2 mb-4">
                                {article.sources!.map((source, i) => (
                                    <div key={i} className="flex items-center justify-between p-2.5 bg-bg-primary border border-border rounded-lg">
                                        <div className="flex items-center gap-3">
                                            {source.favicon ? (
                                                <img src={source.favicon} alt="" className="w-5 h-5 rounded-sm object-cover" />
                                            ) : (
                                                <div className="w-5 h-5 bg-border rounded-sm" />
                                            )}
                                            <div>
                                                <div className="text-sm font-medium text-text-primary">{source.name}</div>
                                                <div className="text-xs text-text-tertiary truncate max-w-xs">{source.url}</div>
                                            </div>
                                        </div>
                                        <button onClick={() => removeSource(i)} className="p-1 text-text-tertiary hover:text-red-400 border-none bg-transparent cursor-pointer">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                            <div className="sm:col-span-3">
                                <input
                                    type="text"
                                    value={sourceName}
                                    onChange={e => setSourceName(e.target.value)}
                                    placeholder="Source Name"
                                    className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-sm"
                                />
                            </div>
                            <div className="sm:col-span-4">
                                <input
                                    type="url"
                                    value={sourceUrl}
                                    onChange={e => setSourceUrl(e.target.value)}
                                    placeholder="URL"
                                    className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-sm"
                                />
                            </div>
                            <div className="sm:col-span-3">
                                <input
                                    type="url"
                                    value={sourceFavicon}
                                    onChange={e => setSourceFavicon(e.target.value)}
                                    placeholder="Favicon URL (Optional)"
                                    className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-sm"
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <button
                                    onClick={addSource}
                                    disabled={!sourceUrl.trim()}
                                    className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-sm text-text-secondary disabled:opacity-50"
                                >
                                    <Plus size={16} /> Add
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
