'use client';

import { X } from 'lucide-react';

interface FullPreviewProps {
    data: {
        name?: string;
        summary?: string;
        description?: string;
        logoUrl?: string;
        status?: string;
        pricing?: string;
        categoryName?: string[];
        taskName?: string[];
        websiteUrl?: string;
        affiliateUrl?: string;
        affiliateEnabled?: boolean;
        tags?: string[];
        pros?: string[];
        cons?: string[];
    };
    categories: { categoryName: string }[];
    tasks: { taskName: string }[];
    onClose: () => void;
}

export default function FullPreview({ data, categories, tasks, onClose }: FullPreviewProps) {
    const categoryNames = data.categoryName || [];
    const taskNames = data.taskName || [];
    const firstCategory = categories.find(c => categoryNames.includes(c.categoryName));
    const firstTask = tasks.find(t => taskNames.includes(t.taskName));

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-bg-card border border-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-6 border-b border-border">
                    <div className="flex items-start gap-4">
                        {data.logoUrl ? (
                            <img src={data.logoUrl} alt="" className="w-20 h-20 rounded-xl object-cover" />
                        ) : (
                            <div className="w-20 h-20 bg-accent-primary/20 rounded-xl flex items-center justify-center text-3xl font-bold text-accent-primary">
                                {data.name?.[0] || '?'}
                            </div>
                        )}
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-text-primary">{data.name || 'Tool Name'}</h2>
                            {data.summary && <p className="text-text-secondary mt-1">{data.summary}</p>}
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                <span className={`text-xs px-2 py-1 rounded-full ${data.status === 'published' ? 'bg-green-500/10 text-green-500' :
                                    data.status === 'draft' ? 'bg-yellow-500/10 text-yellow-500' :
                                        'bg-gray-500/10 text-gray-500'
                                    }`}>
                                    {data.status || 'draft'}
                                </span>
                                <span className="text-xs px-2 py-1 bg-accent-primary/10 text-accent-primary rounded-full">
                                    {data.pricing === 'free' ? 'Free' : data.pricing === 'freemium' ? 'Freemium' : 'Paid'}
                                </span>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 text-text-tertiary hover:text-text-primary hover:bg-bg-secondary rounded-lg transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {data.description && (
                        <div>
                            <h3 className="text-sm font-medium text-text-tertiary mb-1">Description</h3>
                            <div
                                className="text-text-primary text-sm leading-relaxed prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{ __html: data.description }}
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        {categoryNames.length > 0 && (
                            <div>
                                <h3 className="text-xs font-medium text-text-tertiary mb-1">Categories</h3>
                                <p className="text-sm text-text-primary">{categoryNames.join(', ')}</p>
                            </div>
                        )}
                        {taskNames.length > 0 && (
                            <div>
                                <h3 className="text-xs font-medium text-text-tertiary mb-1">Tasks</h3>
                                <p className="text-sm text-text-primary">{taskNames.join(', ')}</p>
                            </div>
                        )}
                    </div>

                    {data.tags && data.tags.length > 0 && (
                        <div>
                            <h3 className="text-xs font-medium text-text-tertiary mb-2">Tags</h3>
                            <div className="flex flex-wrap gap-1">
                                {data.tags.map(tag => (
                                    <span key={tag} className="text-xs px-2 py-1 bg-bg-secondary text-text-secondary rounded">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {((data.pros?.length ?? 0) > 0 || (data.cons?.length ?? 0) > 0) && (
                        <div className="grid grid-cols-2 gap-4">
                            {data.pros && data.pros.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-medium text-green-500 mb-2">Pros</h3>
                                    <ul className="space-y-1">
                                        {data.pros.map((pro, i) => (
                                            <li key={i} className="text-xs text-text-secondary">✓ {pro}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {data.cons && data.cons.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-medium text-red-500 mb-2">Cons</h3>
                                    <ul className="space-y-1">
                                        {data.cons.map((con, i) => (
                                            <li key={i} className="text-xs text-text-secondary">✗ {con}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {data.websiteUrl && (
                        <div>
                            <h3 className="text-xs font-medium text-text-tertiary mb-1">Website</h3>
                            <a
                                href={data.websiteUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-accent-primary hover:underline flex items-center gap-1"
                            >
                                {data.websiteUrl} ↗
                            </a>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="border-t border-border p-4 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 bg-bg-secondary border border-border text-text-primary rounded-xl text-sm font-medium hover:bg-bg-tertiary"
                    >
                        Close Preview
                    </button>
                    {data.websiteUrl && (
                        <a
                            href={data.affiliateEnabled && data.affiliateUrl ? data.affiliateUrl : data.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 px-4 py-2.5 bg-accent-primary text-white rounded-xl text-sm font-medium hover:bg-accent-primary/90 text-center"
                        >
                            Visit Website →
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}
