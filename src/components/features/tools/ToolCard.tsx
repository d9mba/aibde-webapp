'use client';

import { useState } from 'react';
import { AITool } from '@/types';
import ShareModal from '@/components/ui/ShareModal';
import { trackToolClick, useToolImpression, trackFilterUsed } from '@/hooks/useToolAnalytics';

interface AIToolCardProps {
    tool: AITool;
    variant?: 'default' | 'compact' | 'featured';
}

// Array of colors for logo backgrounds
const logoColors = [
    '#ec4899', '#22c55e', '#3b82f6', '#f97316', '#8b5cf6',
    '#ef4444', '#06b6d4', '#eab308', '#14b8a6', '#6366f1',
];

// CDN URL helper
const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || '';
const getFullUrl = (path: string): string => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${CDN_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

// Slugify helper for category/task URLs
const slugify = (str: string): string => str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

export default function AIToolCard({ tool, variant = 'default' }: AIToolCardProps) {
    const [showShareModal, setShowShareModal] = useState(false);
    const colorIndex = tool.name.charCodeAt(0) % logoColors.length;
    const logoColor = logoColors[colorIndex];
    const logoUrl = tool.logoUrl ? getFullUrl(tool.logoUrl) : '';

    const isCompact = variant === 'compact';
    const isFeatured = variant === 'featured';

    // Analytics: Track impressions when card is visible
    const impressionRef = useToolImpression(
        { id: tool.id, name: tool.name, slug: tool.slug, category: (tool.categoryName || [])[0], pricing: tool.pricing },
        isFeatured ? 'featured' : 'list'
    );

    const handleViewClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        window.location.href = `/app/${tool.slug}`;
    };

    const handleShareClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowShareModal(true);
    };

    const handleTaskClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        const firstTask = (tool.taskName || [])[0];
        if (firstTask) {
            window.location.href = `/task/${firstTask}`;
        }
    };

    const handleCardClick = () => {
        // Analytics: Track tool click
        trackToolClick(
            { id: tool.id, name: tool.name, slug: tool.slug, category: (tool.categoryName || [])[0], pricing: tool.pricing },
            isFeatured ? 'featured' : 'card'
        );
        window.location.href = `/app/${tool.slug}`;
    };

    return (
        <div
            ref={impressionRef}
            className={`
                flex flex-col gap-3 p-4 bg-bg-card rounded-lg border cursor-pointer relative overflow-hidden min-h-[180px]
                transition-[border-color,box-shadow,background-color] duration-fast hover:border-text-tertiary hover:shadow-md hover:bg-bg-card-hover group
                ${isCompact ? 'p-3.5 gap-2.5' : ''}
                ${isFeatured ? 'border-accent-primary bg-gradient-to-br from-bg-card to-accent-primary/[0.03]' : 'border-border'}
            `}
            onClick={handleCardClick}
        >
            <div className="flex gap-3 items-start flex-1">
                {logoUrl ? (
                    <img
                        src={logoUrl}
                        alt={tool.name}
                        className={`${isCompact ? 'w-[38px] h-[38px]' : 'w-11 h-11'} rounded-md object-cover flex-shrink-0`}
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                        }}
                    />
                ) : null}
                <div
                    className={`${isCompact ? 'w-[38px] h-[38px]' : 'w-11 h-11'} rounded-md flex items-center justify-center flex-shrink-0`}
                    style={{
                        backgroundColor: logoColor,
                        display: logoUrl ? 'none' : 'flex'
                    }}
                >
                    <span className={`${isCompact ? 'text-base' : 'text-lg'} font-bold text-white`}>
                        {tool.name.charAt(0).toUpperCase()}
                    </span>
                </div>

                <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <div className="flex items-center gap-1">
                        <h3 className={`${isCompact ? 'text-sm' : 'text-[0.9375rem]'} font-semibold text-text-primary m-0 truncate`}>
                            {tool.name}
                        </h3>
                    </div>
                    <p className={`${isCompact ? 'text-xs' : 'text-[0.75rem]'} text-text-secondary leading-relaxed m-0 line-clamp-3`}>
                        {tool.summary || tool.description}
                    </p>

                    {/* Tags - 1 Category and 1 Task with different colors */}
                    <div className="flex flex-wrap gap-1 mt-1">
                        {/* Category tag - Teal color */}
                        {(tool.categoryName || [])[0] && (
                            <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 text-[0.625rem] font-medium rounded-full cursor-pointer transition-all duration-fast"
                                style={{ color: '#0d9488', backgroundColor: 'rgba(13, 148, 136, 0.08)' }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    trackFilterUsed('category', (tool.categoryName || [])[0]);
                                    window.location.href = `/category/${slugify((tool.categoryName || [])[0])}`;
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#0d9488';
                                    e.currentTarget.style.color = 'white';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(13, 148, 136, 0.08)';
                                    e.currentTarget.style.color = '#0d9488';
                                }}
                            >
                                <svg className="opacity-70" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="3" width="7" height="7" rx="1" />
                                    <rect x="14" y="3" width="7" height="7" rx="1" />
                                    <rect x="14" y="14" width="7" height="7" rx="1" />
                                    <rect x="3" y="14" width="7" height="7" rx="1" />
                                </svg>
                                {(tool.categoryName || [])[0]}
                            </span>
                        )}
                        {/* Task tag - Orange color */}
                        {(tool.taskName || [])[0] && (
                            <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 text-[0.625rem] font-medium rounded-full cursor-pointer transition-all duration-fast"
                                style={{ color: '#ea580c', backgroundColor: 'rgba(234, 88, 12, 0.08)' }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    trackFilterUsed('task', (tool.taskName || [])[0]);
                                    window.location.href = `/task/${slugify((tool.taskName || [])[0])}`;
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#ea580c';
                                    e.currentTarget.style.color = 'white';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(234, 88, 12, 0.08)';
                                    e.currentTarget.style.color = '#ea580c';
                                }}
                            >
                                <svg className="opacity-70" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M9 11l3 3L22 4" />
                                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                                </svg>
                                {(tool.taskName || [])[0]}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className={`flex justify-between items-center ${isCompact ? 'pt-1.5' : 'pt-2'} border-t border-border`}>
                <span className="text-[0.625rem] text-text-tertiary">{tool.releasedAgo}</span>
                <span
                    className="text-[0.625rem] font-medium cursor-pointer transition-opacity hover:opacity-70"
                    style={{
                        color: tool.pricing === 'free' ? '#059669' : tool.pricing === 'freemium' ? '#d97706' : tool.pricing === 'paid' ? '#2563eb' : '#737373'
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        trackFilterUsed('pricing', tool.pricing || 'unknown');
                        window.location.href = `/search?pricing=${tool.pricing}`;
                    }}
                >
                    {tool.pricingLabel || (tool.pricing === 'free' ? 'Free' : tool.pricing === 'freemium' ? 'Freemium' : tool.pricing === 'paid' ? 'Paid' : '')}
                </span>
            </div>

            {/* Hover Actions - Bottom Bar */}
            <div
                className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-2 px-4 py-3 rounded-b-lg opacity-0 translate-y-2.5 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0"
                style={{ background: 'linear-gradient(to top, var(--bg-card) 60%, transparent)' }}
            >
                <button
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-full border border-border cursor-pointer transition-all duration-fast bg-bg-tertiary text-text-secondary hover:bg-bg-card hover:border-text-tertiary hover:text-text-primary"
                    onClick={handleViewClick}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                    </svg>
                    View
                </button>
                <button
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-full border border-border cursor-pointer transition-all duration-fast bg-bg-tertiary text-text-secondary hover:bg-bg-card hover:border-text-tertiary hover:text-text-primary"
                    onClick={handleShareClick}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="18" cy="5" r="3" />
                        <circle cx="6" cy="12" r="3" />
                        <circle cx="18" cy="19" r="3" />
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                    </svg>
                    Share
                </button>
            </div>

            {/* Share Modal */}
            <ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                url={typeof window !== 'undefined' ? `${window.location.origin}/app/${tool.slug}` : ''}
                title={tool.name}
                description={tool.summary || tool.description}
            />
        </div>
    );
}
