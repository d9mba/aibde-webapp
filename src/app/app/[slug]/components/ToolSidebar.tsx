import Link from 'next/link';
import { AdminTool } from '@/types';
import { slugify } from '@/lib/utils';
import { getFullUrl, logoColors } from './utils';
import { addUtmParams } from '@/lib/url-utils';
import { trackToolVisit } from '@/hooks/useToolAnalytics';

// Ensure URL has https:// protocol
const ensureUrl = (url: string): string => {
    if (!url) return '';
    return url.startsWith('http') ? url : `https://${url}`;
};

// Format launched date - show "Launched in 2025" for year-only dates (stored as YYYY-01-01)
// Uses UTC parsing to avoid timezone issues
const formatLaunchedDate = (dateStr: string): string => {
    // Parse date string manually to avoid timezone issues
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length !== 3) {
        return `Released On ${dateStr}`;
    }

    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10); // 1-12
    const day = parseInt(parts[2], 10);

    // If date is January 1st, it was likely a year-only entry
    if (month === 1 && day === 1) {
        return `Released in ${year}`;
    }

    // Otherwise show full date using UTC to avoid timezone shifts
    const date = new Date(Date.UTC(year, month - 1, day));
    return `Released On ${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}`;
};

interface ToolSidebarProps {
    tool: AdminTool;
    featuredTools: AdminTool[];
    suggestedTools: AdminTool[];
    recentlyAdded: AdminTool[];
    showFeaturedAlternatives?: boolean;
}

export default function ToolSidebar({
    tool,
    featuredTools,
    suggestedTools,
    recentlyAdded,
    showFeaturedAlternatives = true,
}: ToolSidebarProps) {
    return (
        <aside className="w-full lg:w-72 flex-shrink-0 lg:pt-8">
            <div className="space-y-6">
                {/* Company Info Section */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-text-primary">App Info</h3>
                    <div className="space-y-3">
                        {tool.websiteUrl && (
                            <a
                                href={tool.backLinks ? tool.websiteUrl : `/go/${tool.appUsername}`}
                                target="_blank"
                                rel={tool.backLinks ? "noopener" : "noopener noreferrer nofollow"}
                                onClick={() => trackToolVisit(
                                    { id: tool.id, name: tool.name, appUsername: tool.appUsername, category: (tool.categoryName || [])[0], pricing: tool.pricing },
                                    tool.websiteUrl || ''
                                )}
                                className="flex items-center gap-2.5 text-sm text-text-secondary hover:text-accent-primary transition-colors no-underline group"
                            >
                                <svg className="w-4 h-4 text-text-tertiary group-hover:text-accent-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                    <polyline points="15,3 21,3 21,9" />
                                    <line x1="10" y1="14" x2="21" y2="3" />
                                </svg>
                                <span className="truncate">{tool.websiteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
                            </a>
                        )}

                        {/* Date - only show if launchedOn exists in DB */}
                        {tool.launchedOn && (
                            <div className="flex items-center gap-2.5 text-sm text-text-secondary">
                                <svg className="w-4 h-4 text-text-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />
                                </svg>
                                <span>{formatLaunchedDate(tool.launchedOn)}</span>
                            </div>
                        )}


                        {/* Social Links */}
                        {tool.socialLinks?.twitter && (
                            <a href={ensureUrl(tool.socialLinks.twitter)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm text-text-secondary hover:text-text-primary transition-colors no-underline">
                                <svg className="w-4 h-4 text-text-tertiary" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                </svg>
                                <span>Twitter / X</span>
                            </a>
                        )}
                        {tool.socialLinks?.linkedin && (
                            <a href={ensureUrl(tool.socialLinks.linkedin)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm text-text-secondary hover:text-[#0A66C2] transition-colors no-underline">
                                <svg className="w-4 h-4 text-text-tertiary" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                </svg>
                                <span>LinkedIn</span>
                            </a>
                        )}
                        {tool.socialLinks?.instagram && (
                            <a href={ensureUrl(tool.socialLinks.instagram)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm text-text-secondary hover:text-[#E4405F] transition-colors no-underline">
                                <svg className="w-4 h-4 text-text-tertiary" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                </svg>
                                <span>Instagram</span>
                            </a>
                        )}
                        {tool.socialLinks?.facebook && (
                            <a href={ensureUrl(tool.socialLinks.facebook)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm text-text-secondary hover:text-[#1877F2] transition-colors no-underline">
                                <svg className="w-4 h-4 text-text-tertiary" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                </svg>
                                <span>Facebook</span>
                            </a>
                        )}
                        {tool.socialLinks?.discord && (
                            <a href={ensureUrl(tool.socialLinks.discord)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm text-text-secondary hover:text-[#5865F2] transition-colors no-underline">
                                <svg className="w-4 h-4 text-text-tertiary" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
                                </svg>
                                <span>Discord</span>
                            </a>
                        )}
                        {tool.socialLinks?.youtube && (
                            <a href={ensureUrl(tool.socialLinks.youtube)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm text-text-secondary hover:text-[#FF0000] transition-colors no-underline">
                                <svg className="w-4 h-4 text-text-tertiary" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                </svg>
                                <span>YouTube</span>
                            </a>
                        )}
                        {tool.socialLinks?.tiktok && (
                            <a href={ensureUrl(tool.socialLinks.tiktok)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm text-text-secondary hover:text-text-primary transition-colors no-underline">
                                <svg className="w-4 h-4 text-text-tertiary" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                                </svg>
                                <span>TikTok</span>
                            </a>
                        )}
                        {tool.playStoreUrl && (
                            <a href={ensureUrl(tool.playStoreUrl)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm text-text-secondary hover:text-[#3DDC84] transition-colors no-underline">
                                <svg className="w-4 h-4 text-text-tertiary" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z" />
                                </svg>
                                <span>Play Store</span>
                            </a>
                        )}
                        {tool.appStoreUrl && (
                            <a href={ensureUrl(tool.appStoreUrl)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm text-text-secondary hover:text-text-primary transition-colors no-underline">
                                <svg className="w-4 h-4 text-text-tertiary" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M11.624 7.222c-.876 0-2.232-.996-3.66-.96-1.884.024-3.612 1.092-4.584 2.784-1.956 3.396-.504 8.412 1.404 11.172.936 1.344 2.04 2.856 3.504 2.808 1.404-.06 1.932-.912 3.636-.912 1.692 0 2.172.912 3.66.876 1.512-.024 2.472-1.368 3.396-2.724 1.068-1.56 1.512-3.072 1.536-3.156-.036-.012-2.94-1.128-2.976-4.488-.024-2.808 2.292-4.152 2.4-4.212-1.32-1.932-3.348-2.148-4.056-2.196-1.848-.144-3.396 1.008-4.26 1.008zm3.12-2.832c.78-.936 1.296-2.244 1.152-3.54-1.116.048-2.46.744-3.264 1.68-.72.828-1.344 2.16-1.176 3.432 1.236.096 2.508-.636 3.288-1.572z" />
                                </svg>
                                <span>App Store</span>
                            </a>
                        )}
                    </div>
                </div>

                {/* Featured Alternatives */}
                {showFeaturedAlternatives && featuredTools.length > 0 && (
                    <div>
                        <div className="text-center mb-3">
                            <span className="inline-flex px-3 py-1 bg-bg-tertiary border border-border rounded-full text-xs font-medium text-text-primary">
                                Featured alternatives
                            </span>
                        </div>
                        <div className="p-3 bg-bg-secondary border border-border rounded-3xl space-y-2">
                            {featuredTools.map((ft) => {
                                const ftColor = logoColors[ft.name.charCodeAt(0) % logoColors.length];
                                return (
                                    <Link
                                        prefetch={false} key={ft.id}
                                        href={`/app/${ft.appUsername}`}
                                        className="flex items-center gap-3 px-3 py-2 bg-bg-tertiary border border-border rounded-full hover:bg-bg-secondary no-underline transition-colors"
                                    >
                                        {ft.logoUrl ? (
                                            <img src={getFullUrl(ft.logoUrl)} alt={ft.name} className="w-8 h-8 rounded-full object-contain flex-shrink-0" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ backgroundColor: ftColor }}>
                                                {ft.name[0]}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-text-primary truncate flex items-center gap-1">
                                                {ft.name}
                                                {ft.listingType === 'verified' && (
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#1d9bf0" className="flex-shrink-0">
                                                        <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" />
                                                    </svg>
                                                )}
                                                {(ft.listingType === 'featured' || ft.listingType === 'spotlight' || ft.spotlightEnabled || ft.isFeatured) && ft.listingType !== 'verified' && (
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b" className="flex-shrink-0">
                                                        <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" />
                                                    </svg>
                                                )}
                                            </div>
                                            <div className="text-xs text-text-tertiary truncate">{ft.summary || 'AI Tool'}</div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Categories Section */}
                {(tool.categoryName || []).length > 0 && (
                    <>
                        <div className="border-t border-border" />
                        <div>
                            <div className="text-center mb-3">
                                <span className="inline-flex px-3 py-1 bg-bg-tertiary border border-border rounded-full text-xs font-medium text-text-primary">
                                    {tool.name} is in
                                </span>
                            </div>
                            <div className="p-3 bg-bg-secondary border border-border rounded-2xl flex flex-wrap gap-2">
                                {tool.categoryName.map((cat, idx) => {
                                    // Distinct colors that are visually different from each other
                                    const colors = [
                                        'bg-blue-100 border-blue-200 text-blue-800 hover:bg-blue-200',
                                        'bg-purple-100 border-purple-200 text-purple-800 hover:bg-purple-200',
                                        'bg-teal-100 border-teal-200 text-teal-800 hover:bg-teal-200',
                                        'bg-pink-100 border-pink-200 text-pink-800 hover:bg-pink-200',
                                        'bg-indigo-100 border-indigo-200 text-indigo-800 hover:bg-indigo-200',
                                        'bg-cyan-100 border-cyan-200 text-cyan-800 hover:bg-cyan-200',
                                        'bg-fuchsia-100 border-fuchsia-200 text-fuchsia-800 hover:bg-fuchsia-200',
                                        'bg-violet-100 border-violet-200 text-violet-800 hover:bg-violet-200',
                                        'bg-sky-100 border-sky-200 text-sky-800 hover:bg-sky-200',
                                        'bg-emerald-100 border-emerald-200 text-emerald-800 hover:bg-emerald-200',
                                    ];
                                    return (
                                        <Link
                                            prefetch={false} key={idx}
                                            href={`/category/${slugify(cat)}`}
                                            className={`px-3 py-1.5 border rounded-full text-xs font-medium transition-colors no-underline ${colors[idx % colors.length]}`}
                                        >
                                            {cat}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                )}

                {/* Tasks Section */}
                {(tool.taskName || []).length > 0 && (
                    <>
                        <div className="border-t border-border" />
                        <div>
                            <div className="text-center mb-3">
                                <span className="inline-flex px-3 py-1 bg-bg-tertiary border border-border rounded-full text-xs font-medium text-text-primary">
                                    {tool.name} can do
                                </span>
                            </div>
                            <div className="p-3 bg-bg-secondary border border-border rounded-2xl flex flex-wrap gap-2">
                                {tool.taskName.map((task, idx) => {
                                    // Distinct colors that are visually very different from each other
                                    const colors = [
                                        'bg-orange-100 border-orange-200 text-orange-800 hover:bg-orange-200',
                                        'bg-rose-100 border-rose-200 text-rose-800 hover:bg-rose-200',
                                        'bg-green-100 border-green-200 text-green-800 hover:bg-green-200',
                                        'bg-yellow-100 border-yellow-200 text-yellow-800 hover:bg-yellow-200',
                                        'bg-red-100 border-red-200 text-red-800 hover:bg-red-200',
                                        'bg-blue-100 border-blue-200 text-blue-800 hover:bg-blue-200',
                                        'bg-purple-100 border-purple-200 text-purple-800 hover:bg-purple-200',
                                        'bg-teal-100 border-teal-200 text-teal-800 hover:bg-teal-200',
                                        'bg-cyan-100 border-cyan-200 text-cyan-800 hover:bg-cyan-200',
                                        'bg-lime-100 border-lime-200 text-lime-800 hover:bg-lime-200',
                                    ];
                                    return (
                                        <Link
                                            prefetch={false} key={idx}
                                            href={`/task/${slugify(task)}`}
                                            className={`px-3 py-1.5 border rounded-full text-xs font-medium transition-colors no-underline ${colors[idx % colors.length]}`}
                                        >
                                            {task}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                )}

                {/* Suggested */}
                {suggestedTools.length > 0 && (
                    <>
                        <div className="border-t border-border" />
                        <div>
                            <div className="text-center mb-3">
                                <span className="inline-flex px-3 py-1 bg-bg-tertiary border border-border rounded-full text-xs font-medium text-text-primary">
                                    Suggested
                                </span>
                            </div>
                            <div className="p-3 bg-bg-secondary border border-border rounded-3xl space-y-2">
                                {suggestedTools.slice(0, 5).map((alt) => {
                                    const altColor = logoColors[alt.name.charCodeAt(0) % logoColors.length];
                                    return (
                                        <Link
                                            prefetch={false} key={alt.id}
                                            href={`/app/${alt.appUsername}`}
                                            className="flex items-center gap-3 px-3 py-2 bg-bg-tertiary border border-border rounded-full hover:bg-bg-secondary no-underline transition-colors"
                                        >
                                            {alt.logoUrl ? (
                                                <img src={getFullUrl(alt.logoUrl)} alt={alt.name} className="w-8 h-8 rounded-full object-contain flex-shrink-0" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ backgroundColor: altColor }}>
                                                    {alt.name[0]}
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-text-primary truncate flex items-center gap-1">
                                                    {alt.name}
                                                    {alt.listingType === 'verified' && (
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="#1d9bf0" className="flex-shrink-0">
                                                            <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" />
                                                        </svg>
                                                    )}
                                                    {(alt.listingType === 'featured' || alt.listingType === 'spotlight' || alt.spotlightEnabled || alt.isFeatured) && alt.listingType !== 'verified' && (
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b" className="flex-shrink-0">
                                                            <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div className="text-xs text-text-tertiary truncate">{alt.summary || 'AI Tool'}</div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                )}

                {/* Recently Added */}
                {recentlyAdded.length > 0 && (
                    <>
                        <div className="border-t border-border" />
                        <div>
                            <div className="text-center mb-3">
                                <span className="inline-flex px-3 py-1 bg-bg-tertiary border border-border rounded-full text-xs font-medium text-text-primary">
                                    Recently added
                                </span>
                            </div>
                            <div className="p-3 bg-bg-secondary border border-border rounded-3xl space-y-2">
                                {recentlyAdded.map((rt) => {
                                    const rtColor = logoColors[rt.name.charCodeAt(0) % logoColors.length];
                                    return (
                                        <Link
                                            prefetch={false} key={rt.id}
                                            href={`/app/${rt.appUsername}`}
                                            className="flex items-center gap-3 px-3 py-2 bg-bg-tertiary border border-border rounded-full hover:bg-bg-secondary no-underline transition-colors"
                                        >
                                            {rt.logoUrl ? (
                                                <img src={getFullUrl(rt.logoUrl)} alt={rt.name} className="w-8 h-8 rounded-full object-contain flex-shrink-0" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ backgroundColor: rtColor }}>
                                                    {rt.name[0]}
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-text-primary truncate flex items-center gap-1">
                                                    {rt.name}
                                                    {rt.listingType === 'verified' && (
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="#1d9bf0" className="flex-shrink-0">
                                                            <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" />
                                                        </svg>
                                                    )}
                                                    {(rt.listingType === 'featured' || rt.listingType === 'spotlight' || rt.spotlightEnabled || rt.isFeatured) && rt.listingType !== 'verified' && (
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b" className="flex-shrink-0">
                                                            <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div className="text-xs text-text-tertiary truncate">{rt.summary || 'AI Tool'}</div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </aside>
    );
}
