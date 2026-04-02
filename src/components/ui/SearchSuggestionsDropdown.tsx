'use client';

import { AdminTool } from '@/types';
import { ToolBadge } from '@/components/icons/ToolBadge';
import SearchIcon from '@/assets/svg/ui/search.svg';

interface SearchSuggestionsDropdownProps {
    suggestions: AdminTool[];
    query: string;
    onSelectTool?: (tool: AdminTool) => void;
    onSearchAll?: () => void;
    selectedIndex?: number;
    onHoverItem?: (index: number) => void;
}

/**
 * Shared Search Suggestions Dropdown
 * Used by HeroSection and SearchPageClient
 */
export default function SearchSuggestionsDropdown({
    suggestions,
    query,
    onSelectTool,
    onSearchAll,
    selectedIndex = -1,
    onHoverItem,
}: SearchSuggestionsDropdownProps) {
    // Show dropdown if there are suggestions OR if query is long enough for "Search for..." option
    if (suggestions.length === 0 && query.length < 2) return null;

    return (
        <div className="absolute top-full left-0 right-0 mt-1 bg-bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50">
            {suggestions.map((tool, index) => (
                <a
                    key={tool.id}
                    href={`/app/${tool.appUsername}`}
                    className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${index === selectedIndex ? 'bg-bg-secondary' : 'hover:bg-bg-secondary'
                        }`}
                    onMouseEnter={() => onHoverItem?.(index)}
                    onClick={() => onSelectTool?.(tool)}
                >
                    {tool.logoUrl ? (
                        <img
                            src={tool.logoUrl}
                            alt=""
                            className="w-6 h-6 rounded object-contain flex-shrink-0"
                        />
                    ) : (
                        <div className="w-6 h-6 rounded bg-accent-primary/20 flex items-center justify-center text-accent-primary font-semibold text-xs flex-shrink-0">
                            {tool.name[0]}
                        </div>
                    )}
                    <div className="flex items-center gap-1 min-w-0">
                        <span className="text-sm text-text-primary truncate min-w-0">
                            {tool.name}
                        </span>
                        <ToolBadge listingType={tool.listingType} spotlightEnabled={tool.spotlightEnabled} isFeatured={tool.isFeatured} />
                    </div>
                </a>
            ))}
            {/* Search for option */}
            {query.length >= 2 && (
                <a
                    href={`/search?q=${encodeURIComponent(query)}`}
                    className={`flex items-center gap-3 px-4 py-2.5 transition-colors border-t border-border ${selectedIndex === suggestions.length ? 'bg-bg-secondary' : 'hover:bg-bg-secondary'
                        }`}
                    onMouseEnter={() => onHoverItem?.(suggestions.length)}
                    onClick={(e) => {
                        if (onSearchAll) {
                            e.preventDefault();
                            onSearchAll();
                        }
                    }}
                >
                    <SearchIcon className="w-4 h-4 text-text-tertiary flex-shrink-0" />
                    <span className="text-sm text-text-secondary">
                        Search for &ldquo;<span className="text-text-primary">{query}</span>&rdquo;
                    </span>
                </a>
            )}
        </div>
    );
}

