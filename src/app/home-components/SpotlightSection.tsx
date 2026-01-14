import AIToolCard from '@/components/features/tools/ToolCard';
import { AdminTool } from '@/types';

interface SpotlightSectionProps {
    tools: AdminTool[];
    showSpotlight: boolean;
}

export default function SpotlightSection({ tools, showSpotlight }: SpotlightSectionProps) {
    if (!showSpotlight || tools.length === 0) return null;

    return (
        <section className="flex flex-col gap-2 sm:gap-4">
            <div className="flex justify-between items-center">
                <h2 className="text-base font-semibold text-text-primary m-0 tracking-tight">Spotlight</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                {tools.map((tool) => (
                    <AIToolCard key={tool.id} tool={tool} variant="compact" />
                ))}
            </div>
        </section>
    );
}
