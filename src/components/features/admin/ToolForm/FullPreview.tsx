'use client';

import { X, ExternalLink, Play } from 'lucide-react';
import { SafeHtml } from '@/components/ui/SafeHtml';

interface FullPreviewProps {
    data: {
        name?: string;
        summary?: string;
        description?: string;
        logoUrl?: string;
        status?: string;
        pricing?: string;
        pricingLabel?: string;
        categoryName?: string[];
        taskName?: string[];
        websiteUrl?: string;
        affiliateUrl?: string;
        affiliateEnabled?: boolean;
        tags?: string[];
        pros?: string[];
        cons?: string[];
        coreFeatures?: string[];
        useCases?: string[];
        faq?: { question: string; answer: string }[];
        images?: string[];
        videos?: string[];
        pricingTiers?: { name: string; price: string; billingFrequency?: string; features?: string[]; highlighted?: boolean }[];
        socialLinks?: Record<string, string>;
    };
    categories: { categoryName: string }[];
    tasks: { taskName: string }[];
    onClose: () => void;
}

export default function FullPreview({ data, categories, tasks, onClose }: FullPreviewProps) {
    const categoryNames = data.categoryName || [];
    const taskNames = data.taskName || [];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-bg-card border border-border rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
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
                                {data.pricingLabel && (
                                    <span className="text-xs text-text-tertiary">{data.pricingLabel}</span>
                                )}
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 text-text-tertiary hover:text-text-primary hover:bg-bg-secondary rounded-lg transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Description */}
                    {data.description && (
                        <div>
                            <h3 className="text-sm font-medium text-text-tertiary mb-2">Description</h3>
                            <SafeHtml html={data.description} className="text-text-primary text-sm leading-relaxed prose prose-sm max-w-none" />
                        </div>
                    )}

                    {/* Categories & Tasks */}
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

                    {/* Core Features */}
                    {data.coreFeatures && data.coreFeatures.length > 0 && (
                        <div>
                            <h3 className="text-sm font-medium text-text-tertiary mb-2">Core Features</h3>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {data.coreFeatures.map((feature, i) => (
                                    <li key={i} className="text-xs text-text-secondary flex items-start gap-2">
                                        <span className="text-accent-primary">•</span> {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Use Cases */}
                    {data.useCases && data.useCases.length > 0 && (
                        <div>
                            <h3 className="text-sm font-medium text-text-tertiary mb-2">Use Cases</h3>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {data.useCases.map((useCase, i) => (
                                    <li key={i} className="text-xs text-text-secondary flex items-start gap-2">
                                        <span className="text-accent-green">→</span> {useCase}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Tags */}
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

                    {/* Pros & Cons */}
                    {((data.pros?.length ?? 0) > 0 || (data.cons?.length ?? 0) > 0) && (
                        <div className="grid grid-cols-2 gap-4">
                            {data.pros && data.pros.length > 0 && (
                                <div className="bg-green-500/5 rounded-lg p-3">
                                    <h3 className="text-xs font-medium text-green-500 mb-2">Pros</h3>
                                    <ul className="space-y-1">
                                        {data.pros.map((pro, i) => (
                                            <li key={i} className="text-xs text-text-secondary">✓ {pro}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {data.cons && data.cons.length > 0 && (
                                <div className="bg-red-500/5 rounded-lg p-3">
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

                    {/* FAQ */}
                    {data.faq && data.faq.length > 0 && (
                        <div>
                            <h3 className="text-sm font-medium text-text-tertiary mb-2">FAQ</h3>
                            <div className="space-y-2">
                                {data.faq.map((item, i) => (
                                    <div key={i} className="bg-bg-secondary rounded-lg p-3">
                                        <p className="text-sm font-medium text-text-primary">{item.question}</p>
                                        <p className="text-xs text-text-secondary mt-1">{item.answer}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Images */}
                    {data.images && data.images.length > 0 && (
                        <div>
                            <h3 className="text-sm font-medium text-text-tertiary mb-2">Screenshots</h3>
                            <div className="grid grid-cols-3 gap-2">
                                {data.images.map((img, i) => (
                                    <img key={i} src={img} alt={`Screenshot ${i + 1}`} className="w-full h-24 object-cover rounded-lg border border-border" />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Videos */}
                    {data.videos && data.videos.length > 0 && (
                        <div>
                            <h3 className="text-sm font-medium text-text-tertiary mb-2">Videos</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {data.videos.map((video, i) => {
                                    // Check if it's a YouTube URL
                                    const youtubeMatch = video.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/);
                                    if (youtubeMatch) {
                                        const videoId = youtubeMatch[1];
                                        return (
                                            <div key={i} className="aspect-video rounded-lg overflow-hidden border border-border max-w-xs">
                                                <iframe
                                                    src={`https://www.youtube.com/embed/${videoId}`}
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    allowFullScreen
                                                    className="w-full h-full"
                                                    title={`Video ${i + 1}`}
                                                />
                                            </div>
                                        );
                                    }
                                    // For direct video files (mp4, webm, etc.)
                                    if (video.match(/\.(mp4|webm|ogg|mov)$/i)) {
                                        return (
                                            <div key={i} className="aspect-video rounded-lg overflow-hidden border border-border max-w-xs">
                                                <video controls className="w-full h-full object-cover">
                                                    <source src={video} type={`video/${video.split('.').pop()}`} />
                                                </video>
                                            </div>
                                        );
                                    }
                                    // Fallback: link to video
                                    return (
                                        <a key={i} href={video} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-accent-primary hover:underline bg-bg-secondary px-2 py-1.5 rounded">
                                            <Play className="w-3 h-3" /> Video {i + 1}
                                        </a>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Social Links */}
                    {data.socialLinks && Object.values(data.socialLinks).some(v => v) && (
                        <div>
                            <h3 className="text-sm font-medium text-text-tertiary mb-2">Social Links</h3>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(data.socialLinks).map(([key, value]) =>
                                    value ? (
                                        <a key={key} href={value.startsWith('http') ? value : `https://${value}`} target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 bg-bg-secondary text-text-secondary rounded hover:text-accent-primary">
                                            {key.charAt(0).toUpperCase() + key.slice(1)}
                                        </a>
                                    ) : null
                                )}
                            </div>
                        </div>
                    )}

                    {/* Website */}
                    {data.websiteUrl && (
                        <div>
                            <h3 className="text-xs font-medium text-text-tertiary mb-1">Website</h3>
                            <a href={data.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-accent-primary hover:underline flex items-center gap-1">
                                <ExternalLink className="w-3 h-3" /> {data.websiteUrl}
                            </a>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="border-t border-border p-4 flex gap-3">
                    <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-bg-secondary border border-border text-text-primary rounded-xl text-sm font-medium hover:bg-bg-tertiary">
                        Close Preview
                    </button>
                    {data.websiteUrl && (
                        <a href={data.affiliateEnabled && data.affiliateUrl ? data.affiliateUrl : data.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex-1 px-4 py-2.5 bg-accent-primary text-white rounded-xl text-sm font-medium hover:bg-accent-primary/90 text-center">
                            Visit Website →
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}
