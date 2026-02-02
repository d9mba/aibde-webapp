'use client';

import { useEffect } from 'react';
import AIToolCard from '@/components/features/tools/ToolCard';
import { AdminTool } from '@/types';
import { useSearch } from '@/context/SearchContext';

interface NewPageClientProps {
    tools: AdminTool[];
}

/**
 * Render a "Just Released" page showing the given tools sorted by release date and synchronize them with the search context.
 *
 * Updates the search context's shared tools when `tools` contains one or more items. The displayed list is sorted so newest tools (by `released_on`) appear first.
 *
 * @param tools - Array of tool objects to display; each tool is rendered as an AIToolCard and used to populate the shared search tools.
 * @returns The JSX for the "Just Released" page, including a header and a responsive grid of tool cards.
 */
export default function NewPageClient({ tools }: NewPageClientProps) {
    const { setSharedTools } = useSearch();

    // Set sharedTools for search recommendations in header
    useEffect(() => {
        if (tools.length > 0) {
            setSharedTools(tools);
        }
    }, [tools, setSharedTools]);

    // Sort by released date (newest first)
    const newTools = [...tools].sort((a, b) =>
        new Date(b.released_on).getTime() - new Date(a.released_on).getTime()
    );

    return (
        <div className="max-w-[1200px] mx-auto px-4 py-6 sm:px-6 sm:py-10">
            <section className="text-center py-8 mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">Just Released</h1>
                <p className="text-text-secondary">Discover the latest AI tools added to our directory</p>
            </section>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {newTools.map((tool) => (
                    <AIToolCard key={tool.id} tool={tool} />
                ))}
            </div>
        </div>
    );
}