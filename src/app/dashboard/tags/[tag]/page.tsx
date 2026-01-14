'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAdmin, AdminTool } from '@/context/AdminContext';
import { renderIcon } from '@/components/features/admin/AdminLayout';

export default function TagDetailPage() {
    const params = useParams();
    const router = useRouter();
    const tag = decodeURIComponent(params.tag as string);
    const { tools } = useAdmin();
    const [search, setSearch] = useState('');
    const [previewTool, setPreviewTool] = useState<AdminTool | null>(null);

    const allLinkedTools = tools.filter((t: AdminTool) => t.tags?.includes(tag));
    const linkedTools = search
        ? allLinkedTools.filter((t: AdminTool) => (t.name || '').toLowerCase().includes(search.toLowerCase()))
        : allLinkedTools;

    if (allLinkedTools.length === 0) {
        return (
            <div className="p-6">
                <button onClick={() => router.push('/dashboard/tags')} className="flex items-center gap-2 text-text-secondary hover:text-accent-blue text-sm mb-4">
                    <span className="inline-flex">{renderIcon('arrow-left', 16)}</span> Back to Tags
                </button>
                <div className="text-center py-12">
                    <div className="text-text-tertiary mb-2">{renderIcon('tag', 48)}</div>
                    <p className="text-text-tertiary">No tools found with tag "{tag}"</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Back Button */}
            <button onClick={() => router.push('/dashboard/tags')} className="flex items-center gap-2 text-text-secondary hover:text-accent-blue text-sm mb-4">
                <span className="inline-flex">{renderIcon('arrow-left', 16)}</span> Back to Tags
            </button>

            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <span className="text-accent-blue">{renderIcon('tag', 32)}</span>
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">{tag}</h1>
                    <p className="text-text-secondary">{allLinkedTools.length} tool{allLinkedTools.length !== 1 ? 's' : ''} with this tag</p>
                </div>
            </div>

            {/* Search & Count */}
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-text-secondary">{linkedTools.length} tool{linkedTools.length !== 1 ? 's' : ''}</span>
                <div className="relative w-64">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">{renderIcon('search', 16)}</span>
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tools..."
                        className="w-full pl-9 pr-3 py-2 bg-bg-secondary border border-border rounded-xl text-sm text-text-primary" />
                </div>
            </div>

            {/* Tools Grid */}
            {linkedTools.length === 0 ? (
                <div className="bg-bg-card border border-border rounded-xl p-12 text-center">
                    <div className="text-text-tertiary mb-2">{renderIcon('tools', 48)}</div>
                    <p className="text-text-tertiary">No tools match your search</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {linkedTools.map((tool: AdminTool) => (
                        <div key={tool.id} onClick={() => setPreviewTool(tool)}
                            className="bg-bg-card border border-border rounded-xl p-4 cursor-pointer hover:border-accent-blue/50 hover:shadow-lg transition-all">
                            <div className="flex items-center gap-3 mb-3">
                                {tool.logoUrl ? (
                                    <img src={tool.logoUrl} alt="" className="w-12 h-12 rounded-xl object-cover" />
                                ) : (
                                    <div className="w-12 h-12 bg-accent-blue/20 rounded-xl flex items-center justify-center text-xl font-bold text-accent-blue">
                                        {tool.name[0]}
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-text-primary truncate">{tool.name}</div>
                                    <div className="text-xs text-text-tertiary">{tool.status}</div>
                                </div>
                            </div>
                            <p className="text-sm text-text-secondary line-clamp-2">{tool.summary || tool.description || 'No description'}</p>
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                                <span className="text-xs text-text-tertiary">{tool.pricingLabel}</span>
                                <span className="text-accent-blue text-sm flex items-center gap-1">Preview {renderIcon('arrow-right', 14)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Detailed Quick Preview Modal */}
            {previewTool && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setPreviewTool(null)}>
                    <div className="bg-bg-card border border-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        {/* Header */}
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
                                        <span className={`text-xs px-2 py-1 rounded-full ${previewTool.status === 'published' ? 'bg-green-500/10 text-green-500' : previewTool.status === 'draft' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-gray-500/10 text-gray-500'}`}>
                                            {previewTool.status}
                                        </span>
                                        <span className="text-xs px-2 py-1 bg-accent-blue/10 text-accent-blue rounded-full">{previewTool.pricingLabel}</span>
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
                                    <p className="text-text-primary text-sm leading-relaxed">{previewTool.description}</p>
                                </div>
                            )}

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

                            {previewTool.tags && previewTool.tags.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-medium text-text-tertiary mb-2">Tags</h3>
                                    <div className="flex flex-wrap gap-1">
                                        {previewTool.tags.map((t: string) => (
                                            <span key={t} className={`text-xs px-2 py-1 rounded ${t === tag ? 'bg-accent-blue text-white' : 'bg-bg-secondary text-text-secondary'}`}>{t}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

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
