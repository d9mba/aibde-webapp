'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { AdminTool } from '@/types';
import { getFullUrl, ensureProtocol, getLogoColor, Section } from './utils';
import { addUtmParams } from '@/lib/url-utils';
import { Share2 } from 'lucide-react';
import { trackToolVisit } from '@/hooks/useToolAnalytics';
import { useImpressions } from '@/contexts/ImpressionsContext';
import VoteButtons from '@/components/ui/VoteButtons';

// Click-to-open More Options Menu
function MoreOptionsMenu({ tool }: { tool: AdminTool }) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={menuRef} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="px-1 py-0.5 hover:bg-bg-secondary rounded transition-colors"
                title="More options"
            >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="5" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="12" cy="19" r="2" />
                </svg>
            </button>
            {isOpen && (
                <div className="absolute left-0 top-full mt-1 py-1 bg-bg-card border border-border rounded-lg shadow-lg z-50 min-w-[130px]">
                    <a
                        href={`mailto:support@aibde.tech?subject=Report%20Issue%20with%20${encodeURIComponent(tool.name)}&body=Tool%20URL:%20https://aibde.com/app/${tool.app_username}%0A%0AIssue:%20`}
                        className="flex items-center gap-2 px-3 py-2 text-text-secondary hover:bg-bg-secondary hover:text-accent-red transition-colors no-underline"
                        onClick={() => setIsOpen(false)}
                    >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 21v-4m0 0V5a2 2 0 0 1 2-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 0 0-2 2z" />
                        </svg>
                        Report
                    </a>
                    <a
                        href={`mailto:support@aibde.tech?subject=Claim%20Ownership%20of%20${encodeURIComponent(tool.name)}&body=Tool%20URL:%20https://aibde.com/app/${tool.app_username}%0A%0AI%20am%20the%20owner/developer%20of%20this%20tool%20and%20would%20like%20to%20claim%20it.%0A%0AMy%20role:%20%0AProof%20of%20ownership:%20`}
                        className="flex items-center gap-2 px-3 py-2 text-text-secondary hover:bg-bg-secondary hover:text-accent-primary transition-colors no-underline"
                        onClick={() => setIsOpen(false)}
                    >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Claim
                    </a>
                    <a
                        href={`mailto:support@aibde.tech?subject=Advertise%20on%20${encodeURIComponent(tool.name)}%20Page&body=Tool%20URL:%20https://aibde.com/app/${tool.app_username}%0A%0AI%20am%20interested%20in%20advertising%20on%20this%20tool%20page.%0A%0ACompany:%20%0ABudget:%20%0ADetails:%20`}
                        className="flex items-center gap-2 px-3 py-2 text-text-secondary hover:bg-bg-secondary hover:text-accent-primary transition-colors no-underline"
                        onClick={() => setIsOpen(false)}
                    >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                        </svg>
                        Advertise
                    </a>
                </div>
            )}
        </div>
    );
}

interface ToolHeaderProps {
    tool: AdminTool;
    sections: Section[];
    activeSection: string;
    onScrollToSection: (sectionId: string) => void;
    onShare?: () => void;
}

export default function ToolHeader({
    tool,
    sections,
    activeSection,
    onScrollToSection,
    onShare,
}: ToolHeaderProps) {
    const logoColor = getLogoColor(tool.name);
    const { getImpressions } = useImpressions();
    const impressionCount = getImpressions(tool.app_username);

    return (
        <div className="pb-4 sm:pb-6 border-b border-border">
            <div className="flex items-start gap-3 sm:gap-4">
                {/* Logo */}
                {tool.logoUrl ? (
                    <img
                        src={getFullUrl(tool.logoUrl)}
                        alt={tool.name}
                        className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl object-contain bg-bg-tertiary flex-shrink-0"
                    />
                ) : (
                    <div
                        className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center text-xl sm:text-2xl font-bold text-white flex-shrink-0"
                        style={{ backgroundColor: logoColor }}
                    >
                        {tool.name[0]}
                    </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 sm:gap-4">
                        <div className="flex-1 min-w-0">
                            <h1 className="text-xl sm:text-3xl font-bold text-text-primary leading-tight">{tool.name}</h1>
                            <p className="text-text-secondary text-sm sm:text-base mt-0.5 sm:mt-1">{tool.summary || 'An AI-powered tool'}</p>
                        </div>

                        {/* Visit Website Button - All screens */}
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                            {tool.websiteUrl && (
                                <a
                                    href={tool.backLinks ? tool.websiteUrl : `/go/${tool.app_username}`}
                                    target="_blank"
                                    rel={tool.backLinks ? "noopener" : "noopener noreferrer nofollow"}
                                    onClick={() => trackToolVisit(
                                        { id: tool.id, name: tool.name, app_username: tool.app_username, category: (tool.categoryName || [])[0], pricing: tool.pricing },
                                        tool.websiteUrl || ''
                                    )}
                                    className="inline-flex items-center gap-1.5 px-3 sm:px-5 py-1.5 sm:py-2.5 bg-accent-primary text-white rounded-lg text-xs sm:text-sm font-medium no-underline hover:opacity-90 transition-opacity"
                                >
                                    Visit
                                </a>
                            )}
                            {onShare && (
                                <button
                                    onClick={onShare}
                                    className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-bg-secondary border border-border rounded-lg text-text-secondary hover:text-text-primary hover:border-text-tertiary transition-colors"
                                    title="Share"
                                    suppressHydrationWarning
                                >
                                    <Share2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Category & Task Capsules - Below logo on mobile */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-3">
                {(tool.categoryName || [])[0] && (
                    <Link
                        prefetch={false} href={`/category/${tool.categoryName[0].toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`}
                        className="flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 bg-blue-50 border border-blue-100 text-blue-700 hover:bg-blue-100 text-[10px] sm:text-xs font-medium rounded-full transition-colors no-underline"
                    >
                        <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="7" height="7" />
                            <rect x="14" y="3" width="7" height="7" />
                            <rect x="14" y="14" width="7" height="7" />
                            <rect x="3" y="14" width="7" height="7" />
                        </svg>
                        {tool.categoryName[0]}
                    </Link>
                )}
                {(tool.taskName || [])[0] && (
                    <Link
                        prefetch={false} href={`/task/${tool.taskName[0].toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`}
                        className="flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 bg-orange-50 border border-orange-100 text-orange-700 hover:bg-orange-100 text-[10px] sm:text-xs font-medium rounded-full transition-colors no-underline"
                    >
                        <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        {tool.taskName[0]}
                    </Link>
                )}
                {/* Pricing */}
                <Link
                    prefetch={false} href={`/search?pricing=${tool.pricing}`}
                    className={`flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium rounded-full transition-colors no-underline ${tool.pricing === 'free' ? 'bg-green-50 border border-green-100 text-green-700 hover:bg-green-100' :
                        tool.pricing === 'freemium' ? 'bg-emerald-50 border border-emerald-100 text-emerald-700 hover:bg-emerald-100' :
                            tool.pricing === 'paid' ? 'bg-rose-50 border border-rose-100 text-rose-700 hover:bg-rose-100' :
                                'bg-amber-50 border border-amber-100 text-amber-700 hover:bg-amber-100'
                        }`}
                >
                    <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                        <line x1="7" y1="7" x2="7.01" y2="7" />
                    </svg>
                    {tool.pricing?.charAt(0).toUpperCase() + tool.pricing?.slice(1)}
                </Link>
                {tool.discount && (
                    <span
                        className="px-2 sm:px-3 py-0.5 sm:py-1 border text-[10px] sm:text-xs font-medium rounded-full"
                        style={{ backgroundColor: 'rgba(234, 88, 12, 0.1)', color: '#ea580c', borderColor: 'rgba(234, 88, 12, 0.3)' }}
                    >
                        {tool.discount}
                    </span>
                )}
            </div>

            {/* Tags - Visible on mobile and desktop */}
            {tool.tags && tool.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mt-3">
                    {tool.tags.slice(0, 6).map((tag, idx) => (
                        <Link
                            prefetch={false} key={idx}
                            href={`/search?q=${encodeURIComponent('#' + tag)}`}
                            className="px-2 py-0.5 bg-bg-tertiary text-text-secondary hover:bg-accent-primary/10 hover:text-accent-primary text-xs rounded-full no-underline transition-colors"
                        >
                            #{tag}
                        </Link>
                    ))}
                    {tool.tags.length > 6 && (
                        <span className="text-xs text-text-tertiary">+{tool.tags.length - 6} more</span>
                    )}
                </div>
            )}

            {/* Stats Row - Impressions, Rating, Voting */}
            <div className="flex items-center gap-4 mt-3">
                {/* Impressions */}
                <div className="flex items-center gap-1.5 text-text-tertiary">
                    <svg className="w-4 h-4" viewBox="0 0 512 512" fill="currentColor">
                        <path d="M184 448h48c4.4 0 8-3.6 8-8V72c0-4.4-3.6-8-8-8h-48c-4.4 0-8 3.6-8 8v368c0 4.4 3.6 8 8 8z" />
                        <path d="M88 448h48c4.4 0 8-3.6 8-8V296c0-4.4-3.6-8-8-8H88c-4.4 0-8 3.6-8 8v144c0 4.4 3.6 8 8 8z" />
                        <path d="M280.1 448h47.8c4.5 0 8.1-3.6 8.1-8.1V232.1c0-4.5-3.6-8.1-8.1-8.1h-47.8c-4.5 0-8.1 3.6-8.1 8.1v207.8c0 4.5 3.6 8.1 8.1 8.1z" />
                        <path d="M368 136.1v303.8c0 4.5 3.6 8.1 8.1 8.1h47.8c4.5 0 8.1-3.6 8.1-8.1V136.1c0-4.5-3.6-8.1-8.1-8.1h-47.8c-4.5 0-8.1 3.6-8.1 8.1z" />
                    </svg>
                    <span className="text-sm font-medium">
                        {(() => {
                            const count = impressionCount || tool.viewCount || tool.saveCount || 0;
                            return count >= 1000 ? `${Math.round(count / 1000)}k` : count.toLocaleString();
                        })()}
                    </span>
                </div>

                {/* Star Rating - Use explicit rating if set, otherwise calculate from upvotes */}
                <div className="flex items-center gap-1 text-text-secondary">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    <span className="text-sm font-medium">
                        {tool.rating != null
                            ? tool.rating.toFixed(1)
                            : (tool.upvotes || 0) > 0 ? ((tool.upvotes || 0) / 50).toFixed(1) : '0.0'}
                    </span>
                </div>

                {/* Divider */}
                <div className="w-px h-4 bg-border" />

                {/* Vote Buttons */}
                <VoteButtons
                    toolId={tool.id}
                    initialUpvotes={tool.upvotes || 0}
                    initialDownvotes={tool.downvotes || 0}
                />
            </div>

            {/* Updated Date + More menu */}
            <div className="flex items-center gap-2 mt-2 text-xs text-text-tertiary">
                {(tool.updatedAt || tool.createdAt || tool.released_on) && (
                    <div className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Updated on {new Date(tool.updatedAt || tool.createdAt || tool.released_on).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                )}

                {/* More options dropdown - Click to open */}
                <MoreOptionsMenu tool={tool} />
            </div>

            {/* Tab Navigation - Smaller on mobile */}
            <div className="flex items-center gap-0.5 sm:gap-1 mt-4 sm:mt-6 overflow-x-auto scrollbar-hide -mx-1 px-1">
                {sections.map((section) => (
                    <button
                        key={section.id}
                        onClick={() => onScrollToSection(section.id)}
                        className={`px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-full transition-colors whitespace-nowrap ${activeSection === section.id
                            ? 'bg-bg-tertiary text-text-primary'
                            : 'text-text-tertiary hover:text-text-secondary hover:bg-bg-secondary'
                            }`}
                        suppressHydrationWarning
                    >
                        {section.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

