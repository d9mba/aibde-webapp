/**
 * Data Layer Index
 * Re-exports all data functions from split modules
 */

// Count functions
export {
    getToolsCount,
    getCategoriesCount,
    getTasksCount,
    getTagsCount,
    getToolsCountByCategory,
    getToolsCountByTask,
} from './counts';

// Category and Task functions
export {
    getCategories,
    getCategoriesRange,
    getTasks,
    getTasksRange,
    getTags,
} from './categories';

// Tool fetching functions
export {
    getPublishedToolsRange,
    getSpotlightTools,
    getRecentlyReleasedTools,
    getTrendingTools,
    getToolsByCategory,
    getToolsByTask,
    getToolByAppUsername,
    getHomeSettings,
    getFeaturedTools,
    getRecentlyAddedTools,
    getToolNamesBySlugs,
} from './tools';

// Related tools functions
export {
    getRelatedTools,
    getSuggestedTools,
} from './related';

// Search functions
export {
    searchTools,
    searchToolsCount,
} from './search';

// Re-export types
export type { SearchParams } from './search';
