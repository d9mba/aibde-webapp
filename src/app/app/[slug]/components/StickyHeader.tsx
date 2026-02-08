import { AdminTool } from '@/types';
import { getFullUrl, getLogoColor, Section } from './utils';
import { addUtmParams } from '@/lib/url-utils';
import { trackToolVisit } from '@/hooks/useToolAnalytics';

interface StickyHeaderProps {
    tool: AdminTool;
    sections: Section[];
    activeSection: string;
    showStickyHeader: boolean;
    onScrollToSection: (sectionId: string) => void;
}

export default function StickyHeader({
    tool,
    sections,
    activeSection,
    showStickyHeader,
    onScrollToSection,
}: StickyHeaderProps) {
    const logoColor = getLogoColor(tool.name);

    return (
        <div className={`hidden lg:block fixed left-1/2 -translate-x-1/2 top-16 sm:top-20 z-50 transition-all duration-300 ${showStickyHeader ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}`}>
            <div className="flex items-center gap-3 px-4 py-2 bg-bg-card/95 backdrop-blur-md border border-border rounded-full shadow-lg">
                <div className="flex items-center gap-2.5 min-w-0">
                    {tool.logoUrl ? (
                        <img src={getFullUrl(tool.logoUrl)} alt={tool.name} className="w-8 h-8 rounded-lg object-contain" />
                    ) : (
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: logoColor }}>
                            {tool.name[0]}
                        </div>
                    )}
                    <div className="font-semibold text-sm text-text-primary truncate max-w-[120px]">{tool.name}</div>
                    {tool.listingType === 'verified' && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#1d9bf0" className="flex-shrink-0">
                            <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" />
                        </svg>
                    )}
                    {(tool.listingType === 'featured' || tool.listingType === 'spotlight' || tool.spotlightEnabled || tool.isFeatured) && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b" className="flex-shrink-0">
                            <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" />
                        </svg>
                    )}
                </div>
                <div className="hidden sm:flex items-center gap-1.5">
                    {sections.map((section) => (
                        <button
                            key={section.id}
                            onClick={() => onScrollToSection(section.id)}
                            className={`px-3 py-1 text-xs font-medium rounded-full transition-all whitespace-nowrap ${activeSection === section.id
                                ? 'bg-bg-tertiary text-text-primary'
                                : 'text-text-tertiary hover:text-text-secondary hover:bg-bg-secondary'
                                }`}
                        >
                            {section.label}
                        </button>
                    ))}
                </div>
                {tool.websiteUrl && (
                    <a href={tool.backLinks ? tool.websiteUrl : `/go/${tool.app_username}`} target="_blank" rel={tool.backLinks ? "noopener" : "noopener noreferrer nofollow"}
                        onClick={() => trackToolVisit(
                            { id: tool.id, name: tool.name, app_username: tool.app_username, category: (tool.categoryName || [])[0], pricing: tool.pricing },
                            tool.websiteUrl || ''
                        )}
                        className="px-3.5 py-1.5 bg-accent-primary text-white rounded-full text-xs font-medium no-underline">
                        Visit
                    </a>
                )}
            </div>
        </div>
    );
}
