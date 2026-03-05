'use client';

import { useState } from 'react';
import { AITool } from '@/types';
import ShareModal from '@/components/ui/ShareModal';
import { trackToolClick, useToolImpression, trackFilterUsed } from '@/hooks/useToolAnalytics';
import { getPricingColor, getPricingLabel } from '@/lib/formatters';
import { getFullUrl } from '@/lib/url';
import { slugify } from '@/lib/utils';
import { useImpressions } from '@/context/ImpressionsContext';
import { ToolBadge, StarIcon } from '@/components/icons';
import GridIcon from '@/assets/svg/ui/grid.svg';
import TaskIcon from '@/assets/svg/actions/task.svg';
import BarChartIcon from '@/assets/svg/ui/bar-chart.svg';
import UpvoteIcon from '@/assets/svg/actions/upvote.svg';
import EyeIcon from '@/assets/svg/actions/eye.svg';
import ShareIcon from '@/assets/svg/actions/share.svg';

interface AIToolCardProps {
    tool: AITool;
    variant?: 'default' | 'compact' | 'featured';
    ranking?: number; // Optional ranking position for trending lists
}

// Array of colors for logo backgrounds
const logoColors = [
    '#ec4899', '#22c55e', '#3b82f6', '#f97316', '#8b5cf6',
    '#ef4444', '#06b6d4', '#eab308', '#14b8a6', '#6366f1',
];

// Helper function to get ranking badge styles
function getRankingBadgeClass(ranking: number): string {
    switch (ranking) {
        case 1: return 'bg-white text-yellow-600 shadow-md border border-yellow-200';
        case 2: return 'bg-white text-gray-500 shadow-md border border-gray-200';
        case 3: return 'bg-white text-amber-700 shadow-md border border-amber-200';
        default: return 'bg-gradient-to-br from-slate-200 to-slate-300 text-slate-700 shadow-sm';
    }
}

// Helper function to get ranking display text
function getRankingDisplay(ranking: number): string {
    switch (ranking) {
        case 1: return '🏆';
        case 2: return '🥈';
        case 3: return '🥉';
        default: return `#${ranking}`;
    }
}

export default function AIToolCard({ tool, variant = 'default', ranking }: AIToolCardProps) {
    const [showShareModal, setShowShareModal] = useState(false);
    const { getImpressions } = useImpressions();
    const colorIndex = tool.name.charCodeAt(0) % logoColors.length;
    const logoColor = logoColors[colorIndex];
    const logoUrl = tool.logoUrl ? getFullUrl(tool.logoUrl) : '';

    const isCompact = variant === 'compact';
    const isFeatured = variant === 'featured';

    // Get live impressions from PostHog context
    const liveImpressions = getImpressions(tool.appUsername);

    // Analytics: Track impressions when card is visible
    const impressionRef = useToolImpression(
        { id: tool.id, name: tool.name, appUsername: tool.appUsername, category: (tool.categoryName || [])[0], pricing: tool.pricing },
        isFeatured ? 'featured' : 'list'
    );

    const handleViewClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        // For backLinks-enabled tools, link directly to website for SEO value
        const url = tool.backLinks && tool.websiteUrl ? tool.websiteUrl : `/go/${tool.appUsername}`;
        // Track outbound click for backLinks (non-redirect) tools since they bypass /go/
        if (tool.backLinks && tool.websiteUrl) {
            import('@/hooks/useToolAnalytics').then(({ trackToolVisit }) => {
                trackToolVisit(
                    { id: tool.id, name: tool.name, appUsername: tool.appUsername, category: (tool.categoryName || [])[0], pricing: tool.pricing },
                    tool.websiteUrl || ''
                );
            });
        }
        window.open(url, '_blank', tool.backLinks ? 'noopener' : 'noopener,noreferrer');
    };

    const handleShareClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowShareModal(true);
    };

    const handleTaskClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        const firstTask = (tool.taskName || [])[0];
        if (firstTask) {
            window.location.href = `/task/${slugify(firstTask)}`;
        }
    };

    const handleCardClick = () => {
        // Analytics: Track tool click
        trackToolClick(
            { id: tool.id, name: tool.name, appUsername: tool.appUsername, category: (tool.categoryName || [])[0], pricing: tool.pricing },
            isFeatured ? 'featured' : 'card'
        );
        window.location.href = `/app/${tool.appUsername}`;
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
            {/* Ranking Badge - Merges with card border at top-right */}
            {ranking && (
                <div className={`absolute -top-0 -right-0 px-2.5 py-1 rounded-bl-lg rounded-tr-lg font-bold flex items-center gap-1 ${getRankingBadgeClass(ranking)}`}>
                    <span className={ranking <= 3 ? 'text-base leading-none' : 'text-xs leading-none'}>
                        {getRankingDisplay(ranking)}
                    </span>
                </div>
            )}
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
                        <ToolBadge
                            listingType={tool.listingType}
                            spotlightEnabled={tool.spotlightEnabled}
                            isFeatured={tool.isFeatured}
                            size={14}
                        />
                    </div>
                    <p className={`${isCompact ? 'text-xs' : 'text-[0.75rem]'} text-text-secondary leading-relaxed m-0 line-clamp-3`}>
                        {tool.summary || tool.description}
                    </p>

                    {/* Tags - 1 Category and 1 Task with different colors */}
                    <div className="flex flex-wrap gap-1 mt-1">
                        {/* Recently Updated tag - Light blue color */}
                        {tool.isReposted && (
                            <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 text-[0.625rem] font-medium rounded-full pointer-events-none"
                                style={{ color: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.08)' }}
                            >
                                <svg className="w-3 h-3 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"></path><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                                Recently Updated
                            </span>
                        )}
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
                                <GridIcon className="w-3 h-3 opacity-70" />
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
                                <TaskIcon className="w-3 h-3 opacity-70" />
                                {(tool.taskName || [])[0]}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className={`flex justify-between items-center gap-2 ${isCompact ? 'pt-1.5' : 'pt-2'} border-t border-border`}>
                <span className="text-[0.625rem] text-text-tertiary leading-none flex-shrink-0">{tool.launchedAgo}</span>
                {/* Stats - Center with flex-1 */}
                <div className="flex items-center justify-center gap-2 flex-1 min-w-0">
                    {/* Impressions indicator */}
                    <span className="inline-flex items-center gap-0.5 text-[0.625rem] text-text-tertiary leading-none">
                        <BarChartIcon className="w-3 h-3 opacity-70 flex-shrink-0" />
                        <span>{(() => {
                            const count = liveImpressions || tool.viewCount || 0;
                            return count >= 1000 ? `${Math.round(count / 1000)}k` : count.toLocaleString();
                        })()}</span>
                    </span>
                    {/* Upvotes + Star Rating */}
                    <span className="inline-flex items-center gap-0.5 text-[0.625rem] text-text-secondary leading-none">
                        <UpvoteIcon className="w-3 h-3 opacity-70 flex-shrink-0" />
                        <span>{tool.upvotes ?? 0}</span>
                        {tool.rating != null && tool.rating > 0 && (
                            <>
                                <StarIcon size={12} className="opacity-70 flex-shrink-0 ml-1" />
                                <span>{tool.rating.toFixed(1)}</span>
                            </>
                        )}
                    </span>
                </div>
                {/* Pricing - Right */}
                <span
                    className="text-[0.625rem] font-medium cursor-pointer transition-opacity hover:opacity-70 flex-shrink-0"
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
                    <EyeIcon className="w-3.5 h-3.5" />
                    View
                </button>
                <button
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-full border border-border cursor-pointer transition-all duration-fast bg-bg-tertiary text-text-secondary hover:bg-bg-card hover:border-text-tertiary hover:text-text-primary"
                    onClick={handleShareClick}
                >
                    <ShareIcon className="w-3.5 h-3.5" />
                    Share
                </button>
            </div>

            {/* Share Modal */}
            <ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                url={typeof window !== 'undefined' ? `${window.location.origin}/app/${tool.appUsername}` : ''}
                title={tool.name}
                description={tool.summary || tool.description}
            />
        </div>
    );
}
