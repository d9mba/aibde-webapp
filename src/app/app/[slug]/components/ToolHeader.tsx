import Link from 'next/link';
import { AdminTool } from '@/types';
import { getFullUrl, ensureProtocol, getLogoColor, Section } from './utils';
import { Share2 } from 'lucide-react';

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

    return (
        <div className="pb-4 sm:pb-6 border-b border-border">
            <div className="flex items-start gap-3 sm:gap-4">
                {/* Logo */}
                {tool.logoUrl ? (
                    <img
                        src={getFullUrl(tool.logoUrl)}
                        alt={tool.name}
                        className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl object-cover bg-bg-tertiary flex-shrink-0"
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
                                    href={ensureProtocol(tool.websiteUrl)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 sm:px-5 py-1.5 sm:py-2.5 bg-accent-blue text-white sm:bg-bg-secondary sm:text-text-primary sm:border sm:border-border rounded-lg text-xs sm:text-sm font-medium no-underline hover:opacity-90 sm:hover:border-text-tertiary transition-colors"
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
                        href={`/category/${tool.categoryName[0].toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`}
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
                        href={`/task/${tool.taskName[0].toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`}
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
                    href={`/search?pricing=${tool.pricing}`}
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
                            key={idx}
                            href={`/search?q=${encodeURIComponent('#' + tag)}`}
                            className="px-2 py-0.5 bg-bg-tertiary text-text-secondary hover:bg-accent-blue/10 hover:text-accent-blue text-xs rounded-full no-underline transition-colors"
                        >
                            #{tag}
                        </Link>
                    ))}
                    {tool.tags.length > 6 && (
                        <span className="text-xs text-text-tertiary">+{tool.tags.length - 6} more</span>
                    )}
                </div>
            )}

            {/* Updated Date - Visible on mobile and desktop */}
            {(tool.updatedAt || tool.createdAt || tool.releasedAt) && (
                <div className="flex items-center gap-1 mt-2 text-xs text-text-tertiary">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Updated on {new Date(tool.updatedAt || tool.createdAt || tool.releasedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
            )}

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

