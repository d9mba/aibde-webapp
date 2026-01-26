'use client';

import { useState } from 'react';
import { AITool } from '@/types';
import ShareModal from '@/components/ui/ShareModal';
import { trackToolClick, useToolImpression, trackFilterUsed } from '@/hooks/useToolAnalytics';
import { getPricingColor, getPricingLabel } from '@/lib/formatters';
import { getFullUrl } from '@/lib/url';

interface AIToolCardProps {
    tool: AITool;
    variant?: 'default' | 'compact' | 'featured';
}

// Array of colors for logo backgrounds
const logoColors = [
    '#ec4899', '#22c55e', '#3b82f6', '#f97316', '#8b5cf6',
    '#ef4444', '#06b6d4', '#eab308', '#14b8a6', '#6366f1',
];

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
        window.open(`/go/${tool.slug}`, '_blank', 'noopener,noreferrer');
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
                        className={`${isCompact ? 'w-[38px] h-[38px]' : 'w-11 h-11'} rounded-md object-contain flex-shrink-0`}
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
                        {/* Category tag - Light green color */}
                        {(tool.categoryName || [])[0] && (
                            <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 text-[0.625rem] font-medium rounded-full cursor-pointer transition-all duration-fast"
                                style={{ color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.08)' }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    trackFilterUsed('category', (tool.categoryName || [])[0]);
                                    window.location.href = `/category/${slugify((tool.categoryName || [])[0])}`;
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#10b981';
                                    e.currentTarget.style.color = 'white';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.08)';
                                    e.currentTarget.style.color = '#10b981';
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
                        {/* Task tag - Amber color */}
                        {(tool.taskName || [])[0] && (
                            <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 text-[0.625rem] font-medium rounded-full cursor-pointer transition-all duration-fast"
                                style={{ color: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.08)' }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    trackFilterUsed('task', (tool.taskName || [])[0]);
                                    window.location.href = `/task/${slugify((tool.taskName || [])[0])}`;
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#f59e0b';
                                    e.currentTarget.style.color = 'white';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.08)';
                                    e.currentTarget.style.color = '#f59e0b';
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

            <div className={`relative flex justify-between items-center ${isCompact ? 'pt-1.5' : 'pt-2'} border-t border-border`}>
                <span className="text-[0.625rem] text-text-tertiary leading-none">{tool.releasedAgo}</span>
                {/* Stats - Absolute Center */}
                <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
                    {/* Impressions indicator */}
                    <span className="inline-flex items-center gap-0.5 text-[0.625rem] text-text-tertiary leading-none">
                        <svg width="12" height="12" viewBox="0 0 512 512" fill="currentColor" className="opacity-70 flex-shrink-0">
                            <path d="M184 448h48c4.4 0 8-3.6 8-8V72c0-4.4-3.6-8-8-8h-48c-4.4 0-8 3.6-8 8v368c0 4.4 3.6 8 8 8z" />
                            <path d="M88 448h48c4.4 0 8-3.6 8-8V296c0-4.4-3.6-8-8-8H88c-4.4 0-8 3.6-8 8v144c0 4.4 3.6 8 8 8z" />
                            <path d="M280.1 448h47.8c4.5 0 8.1-3.6 8.1-8.1V232.1c0-4.5-3.6-8.1-8.1-8.1h-47.8c-4.5 0-8.1 3.6-8.1 8.1v207.8c0 4.5 3.6 8.1 8.1 8.1z" />
                            <path d="M368 136.1v303.8c0 4.5 3.6 8.1 8.1 8.1h47.8c4.5 0 8.1-3.6 8.1-8.1V136.1c0-4.5-3.6-8.1-8.1-8.1h-47.8c-4.5 0-8.1 3.6-8.1 8.1z" />
                        </svg>
                        <span>{(() => {
                            const count = tool.viewCount || tool.saveCount || 0;
                            return count >= 1000 ? `${Math.round(count / 1000)}k` : count.toLocaleString();
                        })()}</span>
                    </span>
                    {/* Upvotes + Star Rating */}
                    <span className="inline-flex items-center gap-0.5 text-[0.625rem] text-text-secondary leading-none">
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" className="opacity-70 flex-shrink-0">
                            <path d="M10 19a3.966 3.966 0 01-3.96-3.962V10.98H2.838a1.731 1.731 0 01-1.605-1.073 1.734 1.734 0 01.377-1.895L9.364.254a.925.925 0 011.272 0l7.754 7.759c.498.499.646 1.242.376 1.894-.27.652-.9 1.073-1.605 1.073h-3.202v4.058A3.965 3.965 0 019.999 19H10zM2.989 9.179H7.84v5.731c0 1.13.81 2.163 1.934 2.278a2.163 2.163 0 002.386-2.15V9.179h4.851L10 2.163 2.989 9.179z" />
                        </svg>
                        <span>{tool.upvotes ?? 0}</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="opacity-70 flex-shrink-0 ml-1">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        <span>{((tool.upvotes ?? 0) / 50).toFixed(1)}</span>
                    </span>
                </div>
                {/* Pricing - Right */}
                <span
                    className="text-[0.625rem] font-medium cursor-pointer transition-opacity hover:opacity-70"
                    style={{ color: getPricingColor(tool.pricing || '') }}
                    onClick={(e) => {
                        e.stopPropagation();
                        trackFilterUsed('pricing', tool.pricing || 'unknown');
                        window.location.href = `/search?pricing=${tool.pricing}`;
                    }}
                >
                    {tool.pricingLabel || getPricingLabel(tool.pricing || '')}
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
