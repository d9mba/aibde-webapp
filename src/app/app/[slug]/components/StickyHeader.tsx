import { AdminTool } from '@/types';
import { getFullUrl, getLogoColor, Section } from './utils';

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
                        <img src={getFullUrl(tool.logoUrl)} alt={tool.name} className="w-8 h-8 rounded-lg object-cover" />
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
                    <a href={tool.websiteUrl} target="_blank" rel="noopener noreferrer" className="px-3.5 py-1.5 bg-accent-blue text-white rounded-full text-xs font-medium no-underline">
                        Visit
                    </a>
                )}
            </div>
        </div>
    );
}
