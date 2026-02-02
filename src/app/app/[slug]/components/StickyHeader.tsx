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

/**
 * Renders a responsive sticky header showing tool branding, section navigation, and a Visit link.
 *
 * Displays the tool logo or initial, the tool name, a row of section buttons that invoke onScrollToSection when clicked, and a Visit button (when tool.websiteUrl is present) that opens the tool's site and records a visit.
 *
 * @param tool - Tool metadata used for branding, link generation, and analytics payload (expects properties like id, name, app_username, logoUrl, websiteUrl, backLinks, categoryName, pricing).
 * @param sections - List of sections to render as navigation buttons; each section should have `id` and `label`.
 * @param activeSection - Identifier of the currently active section; the corresponding button is styled as selected.
 * @param showStickyHeader - Controls the header's visibility and entrance/exit animation.
 * @param onScrollToSection - Callback invoked with a section id when a section button is clicked.
 * @returns A React element that renders the sticky header UI.
 */
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