'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    Save,
    Eye,
    Trash2,
    Plus,
    X,
    Image as ImageIcon,
    Upload,
} from 'lucide-react';
import { BlogPost, BLOG_CATEGORIES, BlogCategory } from '@/types/blog';

interface BlogEditorProps {
    postId?: string; // undefined = new post
}

const EMPTY_POST: Partial<BlogPost> = {
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    category: 'guides',
    tags: [],
    relatedTools: [],
    faq: [],
    status: 'draft',
    metaTitle: '',
    metaDescription: '',
    focusKeywords: [],
    coverImage: null,
    images: [],
};

export default function BlogEditor({ postId }: BlogEditorProps) {
    const router = useRouter();
    const [post, setPost] = useState<Partial<BlogPost>>(EMPTY_POST);
    const [loading, setLoading] = useState(!!postId);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // FAQ input state
    const [faqQuestion, setFaqQuestion] = useState('');
    const [faqAnswer, setFaqAnswer] = useState('');

    // Tag input state
    const [tagInput, setTagInput] = useState('');

    // Keyword input state
    const [keywordInput, setKeywordInput] = useState('');

    // Related tool input
    const [toolInput, setToolInput] = useState('');

    // Image upload state
    const [uploading, setUploading] = useState(false);

    // Load existing post
    useEffect(() => {
        if (!postId) return;
        async function load() {
            const res = await fetch(`/api/blog/${postId}`);
            if (res.ok) {
                const body = await res.json();
                setPost(body.data);
            } else {
                setError('Failed to load post');
            }
            setLoading(false);
        }
        load();
    }, [postId]);

    // Auto-generate slug from title
    function handleTitleChange(title: string) {
        const updates: Partial<BlogPost> = { title };
        if (!postId || !post.slug) {
            updates.slug = title
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .trim();
        }
        setPost(prev => ({ ...prev, ...updates }));
    }

    async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>, type: 'cover' | 'inline') {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', 'blog');

            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            if (!res.ok) throw new Error('Upload failed');

            const { url } = await res.json();

            if (type === 'cover') {
                setPost(prev => ({ ...prev, coverImage: url }));
            } else {
                setPost(prev => ({ ...prev, images: [...(prev.images || []), url] }));
                // Insert image markdown into content
                setPost(prev => ({
                    ...prev,
                    content: `${prev.content || ''}\n\n<img src="${url}" alt="" />\n\n`,
                }));
            }
        } catch {
            setError('Image upload failed');
        } finally {
            setUploading(false);
        }
    }

    async function handleSave(publishStatus?: 'draft' | 'published') {
        setSaving(true);
        setError(null);
        setSuccess(null);

        const payload = { ...post };
        if (publishStatus) payload.status = publishStatus;

        try {
            const url = postId ? `/api/blog/${postId}` : '/api/blog';
            const method = postId ? 'PUT' : 'POST';
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
            setSuccess(publishStatus === 'published' ? 'Published!' : 'Saved!');

            if (!postId) {
                router.push(`/dashboard/blog/${body.data.id}`);
            } else {
                setPost(body.data);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save');
        } finally {
            setSaving(false);
        }
    }

    function addFaq() {
        if (!faqQuestion.trim() || !faqAnswer.trim()) return;
        setPost(prev => ({
            ...prev,
            faq: [...(prev.faq || []), { question: faqQuestion.trim(), answer: faqAnswer.trim() }],
        }));
        setFaqQuestion('');
        setFaqAnswer('');
    }

    function removeFaq(index: number) {
        setPost(prev => ({
            ...prev,
            faq: (prev.faq || []).filter((_, i) => i !== index),
        }));
    }

    function addTag() {
        const tag = tagInput.trim();
        if (!tag || (post.tags || []).includes(tag)) return;
        setPost(prev => ({ ...prev, tags: [...(prev.tags || []), tag] }));
        setTagInput('');
    }

    function addKeyword() {
        const kw = keywordInput.trim();
        if (!kw || (post.focusKeywords || []).includes(kw)) return;
        setPost(prev => ({ ...prev, focusKeywords: [...(prev.focusKeywords || []), kw] }));
        setKeywordInput('');
    }

    function addRelatedTool() {
        const slug = toolInput.trim();
        if (!slug || (post.relatedTools || []).includes(slug)) return;
        setPost(prev => ({ ...prev, relatedTools: [...(prev.relatedTools || []), slug] }));
        setToolInput('');
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
                        <Link href="/dashboard/blog" className="text-text-tertiary hover:text-text-primary transition-colors">
                            <ArrowLeft size={20} />
                        </Link>
                        <h1 className="text-xl sm:text-2xl font-bold text-text-primary">
                            {postId ? 'Edit Post' : 'New Post'}
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        {post.status === 'published' && post.slug && (
                            <Link
                                href={`/blog/${post.slug}`}
                                target="_blank"
                                className="flex items-center gap-1 px-3 py-2 bg-bg-card border border-border rounded-lg text-xs text-text-secondary hover:text-text-primary transition-colors no-underline"
                            >
                                <Eye size={14} />
                                <span className="hidden sm:inline">View</span>
                            </Link>
                        )}
                        <button
                            onClick={() => handleSave('draft')}
                            disabled={saving}
                            className="flex items-center gap-1 px-3 py-2 bg-bg-card border border-border rounded-lg text-xs text-text-secondary hover:text-text-primary transition-colors cursor-pointer disabled:opacity-50"
                        >
                            <Save size={14} />
                            <span className="hidden sm:inline">Save Draft</span>
                        </button>
                        <button
                            onClick={() => handleSave('published')}
                            disabled={saving}
                            className="flex items-center gap-1 px-3 py-2 bg-accent-primary text-white rounded-lg text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
                        >
                            <span>{saving ? 'Saving...' : 'Publish'}</span>
                        </button>
                    </div>
                </div>

                {/* Alerts */}
                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{error}</div>
                )}
                {success && (
                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">{success}</div>
                )}

                {/* Main Content */}
                <div className="space-y-4">
                    {/* Title */}
                    <div className="bg-bg-card border border-border rounded-xl p-4 space-y-3">
                        <label className="text-xs font-medium text-text-tertiary uppercase tracking-wide">Title</label>
                        <input
                            type="text"
                            value={post.title || ''}
                            onChange={e => handleTitleChange(e.target.value)}
                            placeholder="Best AI Tools for Content Writing in 2026"
                            className="w-full px-3 py-2.5 bg-bg-primary border border-border rounded-lg text-base text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                        />
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <label className="text-xs text-text-tertiary">Slug</label>
                                <input
                                    type="text"
                                    value={post.slug || ''}
                                    onChange={e => setPost(prev => ({ ...prev, slug: e.target.value }))}
                                    className="w-full mt-1 px-3 py-2 bg-bg-primary border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                                />
                            </div>
                            <div className="w-40">
                                <label className="text-xs text-text-tertiary">Category</label>
                                <select
                                    value={post.category || 'guides'}
                                    onChange={e => setPost(prev => ({ ...prev, category: e.target.value as BlogCategory }))}
                                    className="w-full mt-1 px-3 py-2 bg-bg-primary border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                                >
                                    {BLOG_CATEGORIES.map(cat => (
                                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Cover Image */}
                    <div className="bg-bg-card border border-border rounded-xl p-4 space-y-3">
                        <label className="text-xs font-medium text-text-tertiary uppercase tracking-wide">Cover Image</label>
                        {post.coverImage ? (
                            <div className="relative">
                                <img src={post.coverImage} alt="Cover" className="w-full h-48 object-cover rounded-lg" />
                                <button
                                    onClick={() => setPost(prev => ({ ...prev, coverImage: null }))}
                                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-md cursor-pointer"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ) : (
                            <label className="flex items-center justify-center gap-2 h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-accent-primary transition-colors">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={e => handleImageUpload(e, 'cover')}
                                    className="hidden"
                                />
                                <Upload size={20} className="text-text-tertiary" />
                                <span className="text-sm text-text-tertiary">
                                    {uploading ? 'Uploading...' : 'Upload cover image'}
                                </span>
                            </label>
                        )}
                    </div>

                    {/* Excerpt */}
                    <div className="bg-bg-card border border-border rounded-xl p-4 space-y-3">
                        <label className="text-xs font-medium text-text-tertiary uppercase tracking-wide">Excerpt</label>
                        <textarea
                            value={post.excerpt || ''}
                            onChange={e => setPost(prev => ({ ...prev, excerpt: e.target.value }))}
                            placeholder="A brief summary of the article for SEO and previews..."
                            rows={2}
                            className="w-full px-3 py-2.5 bg-bg-primary border border-border rounded-lg text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent-primary resize-y"
                        />
                    </div>

                    {/* Content */}
                    <div className="bg-bg-card border border-border rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-text-tertiary uppercase tracking-wide">Content (HTML)</label>
                            <label className="flex items-center gap-1.5 text-xs text-text-tertiary cursor-pointer hover:text-accent-primary transition-colors">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={e => handleImageUpload(e, 'inline')}
                                    className="hidden"
                                />
                                <ImageIcon size={14} />
                                <span>{uploading ? 'Uploading...' : 'Insert Image'}</span>
                            </label>
                        </div>
                        <textarea
                            value={post.content || ''}
                            onChange={e => setPost(prev => ({ ...prev, content: e.target.value }))}
                            placeholder="<h2>Introduction</h2>\n<p>Write your article content in HTML...</p>"
                            rows={20}
                            className="w-full px-3 py-2.5 bg-bg-primary border border-border rounded-lg text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent-primary resize-y font-mono"
                        />
                    </div>

                    {/* Tags */}
                    <div className="bg-bg-card border border-border rounded-xl p-4 space-y-3">
                        <label className="text-xs font-medium text-text-tertiary uppercase tracking-wide">Tags</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={tagInput}
                                onChange={e => setTagInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                placeholder="Add tag..."
                                className="flex-1 px-3 py-2 bg-bg-primary border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                            />
                            <button onClick={addTag} className="px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-sm text-text-secondary hover:text-text-primary cursor-pointer">
                                <Plus size={16} />
                            </button>
                        </div>
                        {(post.tags || []).length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {post.tags!.map(tag => (
                                    <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent-primary/10 text-accent-primary rounded-full text-xs">
                                        {tag}
                                        <button onClick={() => setPost(p => ({ ...p, tags: p.tags?.filter(t => t !== tag) }))} className="hover:text-red-400 cursor-pointer bg-transparent border-none text-current">
                                            <X size={10} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Related Tools */}
                    <div className="bg-bg-card border border-border rounded-xl p-4 space-y-3">
                        <label className="text-xs font-medium text-text-tertiary uppercase tracking-wide">Related Tools (app_username slugs)</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={toolInput}
                                onChange={e => setToolInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addRelatedTool())}
                                placeholder="e.g. chatgpt, midjourney"
                                className="flex-1 px-3 py-2 bg-bg-primary border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                            />
                            <button onClick={addRelatedTool} className="px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-sm text-text-secondary hover:text-text-primary cursor-pointer">
                                <Plus size={16} />
                            </button>
                        </div>
                        {(post.relatedTools || []).length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {post.relatedTools!.map(slug => (
                                    <span key={slug} className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full text-xs">
                                        {slug}
                                        <button onClick={() => setPost(p => ({ ...p, relatedTools: p.relatedTools?.filter(s => s !== slug) }))} className="hover:text-red-400 cursor-pointer bg-transparent border-none text-current">
                                            <X size={10} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* FAQ */}
                    <div className="bg-bg-card border border-border rounded-xl p-4 space-y-3">
                        <label className="text-xs font-medium text-text-tertiary uppercase tracking-wide">FAQ (for Schema Markup)</label>
                        {(post.faq || []).map((item, i) => (
                            <div key={i} className="flex gap-2 items-start p-3 bg-bg-primary rounded-lg border border-border">
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-text-primary">{item.question}</div>
                                    <div className="text-xs text-text-secondary mt-0.5">{item.answer}</div>
                                </div>
                                <button onClick={() => removeFaq(i)} className="p-1 text-text-tertiary hover:text-red-400 flex-shrink-0 cursor-pointer bg-transparent border-none">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                        <div className="space-y-2">
                            <input
                                type="text"
                                value={faqQuestion}
                                onChange={e => setFaqQuestion(e.target.value)}
                                placeholder="Question..."
                                className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                            />
                            <textarea
                                value={faqAnswer}
                                onChange={e => setFaqAnswer(e.target.value)}
                                placeholder="Answer..."
                                rows={2}
                                className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary resize-y"
                            />
                            <button
                                onClick={addFaq}
                                disabled={!faqQuestion.trim() || !faqAnswer.trim()}
                                className="flex items-center gap-1 px-3 py-1.5 bg-bg-tertiary border border-border rounded-lg text-xs text-text-secondary hover:text-text-primary cursor-pointer disabled:opacity-40"
                            >
                                <Plus size={14} /> Add FAQ
                            </button>
                        </div>
                    </div>

                    {/* SEO */}
                    <div className="bg-bg-card border border-border rounded-xl p-4 space-y-3">
                        <label className="text-xs font-medium text-text-tertiary uppercase tracking-wide">SEO Settings</label>
                        <div>
                            <label className="text-xs text-text-tertiary">Meta Title</label>
                            <input
                                type="text"
                                value={post.metaTitle || ''}
                                onChange={e => setPost(prev => ({ ...prev, metaTitle: e.target.value }))}
                                placeholder="Custom page title for search engines"
                                className="w-full mt-1 px-3 py-2 bg-bg-primary border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-text-tertiary">Meta Description</label>
                            <textarea
                                value={post.metaDescription || ''}
                                onChange={e => setPost(prev => ({ ...prev, metaDescription: e.target.value }))}
                                placeholder="Brief description for search results (150-160 chars)"
                                rows={2}
                                className="w-full mt-1 px-3 py-2 bg-bg-primary border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary resize-y"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-text-tertiary">Focus Keywords</label>
                            <div className="flex gap-2 mt-1">
                                <input
                                    type="text"
                                    value={keywordInput}
                                    onChange={e => setKeywordInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                                    placeholder="e.g. best AI tools for writing"
                                    className="flex-1 px-3 py-2 bg-bg-primary border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                                />
                                <button onClick={addKeyword} className="px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-sm text-text-secondary hover:text-text-primary cursor-pointer">
                                    <Plus size={16} />
                                </button>
                            </div>
                            {(post.focusKeywords || []).length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {post.focusKeywords!.map(kw => (
                                        <span key={kw} className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded-full text-xs">
                                            {kw}
                                            <button onClick={() => setPost(p => ({ ...p, focusKeywords: p.focusKeywords?.filter(k => k !== kw) }))} className="hover:text-red-400 cursor-pointer bg-transparent border-none text-current">
                                                <X size={10} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
