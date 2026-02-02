'use client';

import { AdminTool } from '@/types';

interface SearchSuggestionsDropdownProps {
    suggestions: AdminTool[];
    query: string;
    onSelectTool?: (tool: AdminTool) => void;
    onSearchAll?: () => void;
    selectedIndex?: number;
    onHoverItem?: (index: number) => void;
}

/**
 * Renders a dropdown of search suggestions with selectable tool items and an optional "Search for" action.
 *
 * Renders nothing when `suggestions` is empty. Highlights the item at `selectedIndex`, calls `onHoverItem`
 * when an item is hovered, calls `onSelectTool` when a suggestion is clicked, and calls `onSearchAll` when the
 * "Search for" option is clicked (if provided). The "Search for" option appears only when `query` has at least
 * two characters.
 *
 * @param suggestions - Array of tools to display as suggestions.
 * @param query - Current search query used to render the "Search for" option.
 * @param onSelectTool - Optional callback invoked with a tool when a suggestion is selected.
 * @param onSearchAll - Optional callback invoked when the "Search for" option is selected; if provided, it prevents default navigation.
 * @param selectedIndex - Index of the currently highlighted item; defaults to -1 when none is highlighted.
 * @param onHoverItem - Optional callback invoked with an index when a suggestion or the "Search for" option is hovered.
 * @returns The suggestions dropdown element, or `null` when there are no suggestions.
 */
export default function SearchSuggestionsDropdown({
    suggestions,
    query,
    onSelectTool,
    onSearchAll,
    selectedIndex = -1,
    onHoverItem,
}: SearchSuggestionsDropdownProps) {
    if (suggestions.length === 0) return null;

    return (
        <div className="absolute top-full left-0 right-0 mt-1 bg-bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50">
            {suggestions.map((tool, index) => (
                <a
                    key={tool.id}
                    href={`/app/${tool.app_username}`}
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
                    <span className="text-sm text-text-primary truncate">
                        {tool.name}
                    </span>
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
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-tertiary flex-shrink-0">
                        <circle cx="11" cy="11" r="8" />
                        <path d="M21 21l-4.35-4.35" />
                    </svg>
                    <span className="text-sm text-text-secondary">
                        Search for &ldquo;<span className="text-text-primary">{query}</span>&rdquo;
                    </span>
                </a>
            )}
        </div>
    );
}