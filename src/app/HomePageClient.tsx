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
    toolCount: number;
    categoryCount: number;
    taskCount: number;
    recentTools: AdminTool[];
    trendingTools: AdminTool[];
    spotlightTools: AdminTool[];
    categories: Category[];
    tasks: Task[];
    settings: {
        spotlightCount: number;
        showSpotlightOnHome: boolean;
        showCategoriesOnHome: boolean;
        showTasksOnHome: boolean;
        showTop10OnHome: boolean;
    };
}

export default function HomePageClient({
    toolCount,
    categoryCount,
    taskCount,
    recentTools,
    trendingTools,
    spotlightTools,
    categories,
    tasks,
    settings,
}: HomePageClientProps) {
    const topCategories = categories.slice(0, 8);
    const topTasks = tasks.slice(0, 8);

    return (
        <div className="max-w-[1200px] mx-auto px-4 py-6 sm:px-6 sm:py-10 flex flex-col gap-10 sm:gap-12">
            <HeroSection
                toolCount={toolCount}
                categoryCount={categoryCount}
                taskCount={taskCount}
            />

            <SpotlightSection
                tools={spotlightTools}
                showSpotlight={settings.showSpotlightOnHome !== false}
            />

            <ToolsGridSection tools={recentTools} trendingTools={trendingTools} />

            <CategoriesSection
                categories={categories}
                categoryCount={categoryCount}
                showCategories={settings.showCategoriesOnHome !== false}
            />

            <TasksSection
                tasks={tasks}
                taskCount={taskCount}
                showTasks={settings.showTasksOnHome !== false}
            />

            <SubmitCTA />
        </div>
    );
}
