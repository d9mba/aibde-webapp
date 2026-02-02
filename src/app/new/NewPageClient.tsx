'use client';

import { useEffect } from 'react';
import AIToolCard from '@/components/features/tools/ToolCard';
import { AdminTool } from '@/types';
import { useSearch } from '@/context/SearchContext';

interface NewPageClientProps {
    tools: AdminTool[];
}

export default function NewPageClient({ tools }: NewPageClientProps) {
    const { setSharedTools } = useSearch();

    // Set sharedTools for search recommendations in header
    useEffect(() => {
        if (tools.length > 0) {
            setSharedTools(tools);
        }
    }, [tools, setSharedTools]);

    // Sort by released date (newest first), with fallback for null/undefined/empty dates
    const newTools = [...tools].sort((a, b) => {
        const dateA = a.released_on ? new Date(a.released_on).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const dateB = b.released_on ? new Date(b.released_on).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return dateB - dateA;
    });

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
