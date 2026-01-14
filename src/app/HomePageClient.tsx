'use client';

import { AdminTool, Category, Task } from '@/types';
import {
    HeroSection,
    SpotlightSection,
    ToolsGridSection,
    CategoriesSection,
    TasksSection,
    SubmitCTA,
} from './home-components';

interface HomePageClientProps {
    initialTools: AdminTool[];
    initialSpotlightTools: AdminTool[];
    initialCategories: Category[];
    initialTasks: Task[];
    initialSettings: {
        spotlightCount: number;
        showSpotlightOnHome: boolean;
        showCategoriesOnHome: boolean;
        showTasksOnHome: boolean;
        showTop10OnHome: boolean;
    };
}

export default function HomePageClient({
    initialTools,
    initialSpotlightTools,
    initialCategories,
    initialTasks,
    initialSettings,
}: HomePageClientProps) {
    const topCategories = initialCategories.slice(0, 8);
    const topTasks = initialTasks.slice(0, 8);

    return (
        <div className="max-w-[1200px] mx-auto px-4 py-6 sm:px-6 sm:py-10 flex flex-col gap-10 sm:gap-12">
            <HeroSection
                allTools={initialTools}
                categoryCount={initialCategories.length}
                taskCount={initialTasks.length}
            />

            <SpotlightSection
                tools={initialSpotlightTools}
                showSpotlight={initialSettings.showSpotlightOnHome !== false}
            />

            <ToolsGridSection tools={initialTools} />

            <CategoriesSection
                categories={topCategories}
                allTools={initialTools}
                showCategories={initialSettings.showCategoriesOnHome !== false}
            />

            <TasksSection
                tasks={topTasks}
                allTools={initialTools}
                showTasks={initialSettings.showTasksOnHome !== false}
            />

            <SubmitCTA />
        </div>
    );
}
