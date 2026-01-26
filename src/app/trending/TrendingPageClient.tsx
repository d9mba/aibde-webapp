'use client';

import AIToolCard from '@/components/features/tools/ToolCard';
import { AdminTool } from '@/types';

interface TrendingPageClientProps {
    tools: AdminTool[];
}

export default function TrendingPageClient({ tools }: TrendingPageClientProps) {
    // Tools are already sorted by save_count from the server
    return (
        <div className="max-w-[1200px] mx-auto px-4 py-6 sm:px-6 sm:py-10">
            <section className="text-center py-8 mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">Trending AI Tools</h1>
                <p className="text-text-secondary">Top 100 most popular AI tools right now</p>
            </section>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {tools.map((tool, index) => (
                    <div key={tool.id} className="relative">
                        <span className="absolute -top-2 -left-2 z-10 w-8 h-8 flex items-center justify-center bg-accent-primary text-white text-xs font-bold rounded-full shadow-md">
                            #{index + 1}
                        </span>
                        <AIToolCard tool={tool} />
                    </div>
                ))}
            </div>
        </div>
    );
}

