/**
 * Server-Side Data Fetching
 * 
 * These functions fetch data directly from Supabase for Server Components.
 * Used by public pages that need to display data without API calls.
 */

import { supabase, dbToolToAdminTool } from './supabase';
import { AdminTool, Category, Task } from '@/types';

/**
 * COUNT QUERIES - Get totals without loading all data
 */

export async function getToolsCount(statusFilter?: ('published' | 'approved')[]): Promise<number> {
    let query = supabase
        .from('tools')
        .select('*', { count: 'exact', head: true });

    if (statusFilter) {
        query = query.in('status', statusFilter);
    }

    const { count, error } = await query;

    if (error) {
        console.error('Error counting tools:', error);
        return 0;
    }

    return count || 0;
}

export async function getCategoriesCount(): Promise<number> {
    const { count, error } = await supabase
        .from('categories')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error('Error counting categories:', error);
        return 0;
    }

    return count || 0;
}

export async function getTasksCount(): Promise<number> {
    const { count, error } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error('Error counting tasks:', error);
        return 0;
    }

    return count || 0;
}

export async function getTagsCount(): Promise<number> {
    const { count, error } = await supabase
        .from('tags')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error('Error counting tags:', error);
        return 0;
    }

    return count || 0;
}

/**
 * Fetch published tools for the homepage
 * Returns tools with status = 'published' or 'approved'
 */
export async function getPublishedTools(): Promise<AdminTool[]> {
    // Supabase has ~1000 row limit per query, so we paginate
    const PAGE_SIZE = 1000;
    let allTools: any[] = [];
    let pageNum = 0;
    let hasMore = true;

    while (hasMore) {
        const { data, error } = await supabase
            .from('tools')
            .select('*')
            .in('status', ['published', 'approved'])
            .order('created_at', { ascending: false })
            .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

        if (error) {
            console.error('Error fetching published tools:', error);
            break;
        }

        if (data && data.length > 0) {
            allTools = [...allTools, ...data];
            hasMore = data.length === PAGE_SIZE;
            pageNum++;
        } else {
            hasMore = false;
        }
    }

    return allTools.map(tool => dbToolToAdminTool(tool)) as AdminTool[];
}

/**
 * Fetch spotlight/featured tools for homepage
 */
export async function getSpotlightTools(limit: number = 8): Promise<AdminTool[]> {
    const { data, error } = await supabase
        .from('tools')
        .select('*')
        .in('status', ['published', 'approved'])
        .eq('spotlight_enabled', true)
        .order('spotlight_position', { ascending: true })
        .limit(limit);

    if (error) {
        console.error('Error fetching spotlight tools:', error);
        return [];
    }

    return (data || []).map(tool => dbToolToAdminTool(tool)) as AdminTool[];
}

/**
 * Fetch recently released tools (limited set for homepage)
 * Much faster than loading all tools
 */
export async function getRecentlyReleasedTools(limit: number = 20): Promise<AdminTool[]> {
    const { data, error } = await supabase
        .from('tools')
        .select('*')
        .in('status', ['published', 'approved'])
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching recently released tools:', error);
        return [];
    }

    return (data || []).map(tool => dbToolToAdminTool(tool)) as AdminTool[];
}

/**
 * Fetch trending tools (Manual positions + Auto-sorted tools)
 * Tools with trending_position > 0 come first (sorted by position)
 * Then tools with position = 0 (sorted by save_count/views)
 */
export async function getTrendingTools(limit: number = 100): Promise<AdminTool[]> {
    // Only fetch tools that are manually marked as trending
    const { data, error } = await supabase
        .from('tools')
        .select('*')
        .in('status', ['published', 'approved'])
        .gt('trending_position', 0) // Only get tools with position set
        .order('trending_position', { ascending: true }) // Sort by position
        .limit(limit);

    if (error) {
        console.error('Error fetching trending tools:', error);
        return [];
    }

    return (data || []).map(tool => dbToolToAdminTool(tool)) as AdminTool[];
}

/**
 * Fetch tools by category name (filtered at DB level)
 */
export async function getToolsByCategory(categoryName: string, limit: number = 100): Promise<AdminTool[]> {
    const { data, error } = await supabase
        .from('tools')
        .select('*')
        .in('status', ['published', 'approved'])
        .contains('category_name', [categoryName])
        .order('save_count', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching tools by category:', error);
        return [];
    }

    return (data || []).map(tool => dbToolToAdminTool(tool)) as AdminTool[];
}

/**
 * Fetch tools by task name (filtered at DB level)
 */
export async function getToolsByTask(taskName: string, limit: number = 100): Promise<AdminTool[]> {
    const { data, error } = await supabase
        .from('tools')
        .select('*')
        .in('status', ['published', 'approved'])
        .contains('task_name', [taskName])
        .order('save_count', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching tools by task:', error);
        return [];
    }

    return (data || []).map(tool => dbToolToAdminTool(tool)) as AdminTool[];
}

/**
 * Get count of tools in a category
 */
export async function getToolsCountByCategory(categoryName: string): Promise<number> {
    const { count, error } = await supabase
        .from('tools')
        .select('*', { count: 'exact', head: true })
        .in('status', ['published', 'approved'])
        .contains('category_name', [categoryName]);

    if (error) {
        console.error('Error counting tools by category:', error);
        return 0;
    }

    return count || 0;
}

/**
 * Get count of tools for a task
 */
export async function getToolsCountByTask(taskName: string): Promise<number> {
    const { count, error } = await supabase
        .from('tools')
        .select('*', { count: 'exact', head: true })
        .in('status', ['published', 'approved'])
        .contains('task_name', [taskName]);

    if (error) {
        console.error('Error counting tools by task:', error);
        return 0;
    }

    return count || 0;
}

/**
 * Fetch categories for homepage
 * Paginated to handle more than 1000 rows (Supabase limit)
 */
export async function getCategories(): Promise<Category[]> {
    const PAGE_SIZE = 1000;
    let allCategories: any[] = [];
    let pageNum = 0;
    let hasMore = true;

    while (hasMore) {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('category_name', { ascending: true })
            .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

        if (error) {
            console.error('Error fetching categories:', error);
            break;
        }

        if (data && data.length > 0) {
            allCategories = [...allCategories, ...data];
            pageNum++;
            hasMore = data.length === PAGE_SIZE;
        } else {
            hasMore = false;
        }
    }

    return allCategories.map(row => ({
        id: row.id,
        categoryName: row.category_name,
        description: row.description,
        count: row.count,
        icon: row.icon,
    }));
}

/**
 * Fetch tasks for homepage
 * Paginated to handle more than 1000 rows (Supabase limit)
 */
export async function getTasks(): Promise<Task[]> {
    const PAGE_SIZE = 1000;
    let allTasks: any[] = [];
    let pageNum = 0;
    let hasMore = true;

    while (hasMore) {
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .order('task_name', { ascending: true })
            .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

        if (error) {
            console.error('Error fetching tasks:', error);
            break;
        }

        if (data && data.length > 0) {
            allTasks = [...allTasks, ...data];
            pageNum++;
            hasMore = data.length === PAGE_SIZE;
        } else {
            hasMore = false;
        }
    }

    return allTasks.map(row => ({
        id: row.id,
        taskName: row.task_name,
        description: row.description,
        count: row.count,
    }));
}

/**
 * Fetch a single published tool by slug
 */
export async function getToolBySlug(slug: string): Promise<AdminTool | null> {
    const { data, error } = await supabase
        .from('tools')
        .select('*')
        .eq('app_username', slug)
        .in('status', ['published', 'approved'])
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            return null; // Not found
        }
        console.error('Error fetching tool:', error);
        return null;
    }

    return dbToolToAdminTool(data) as AdminTool;
}

/**
 * Fetch homepage settings
 */
export async function getHomeSettings() {
    const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 1)
        .single();

    if (error) {
        return {
            spotlightCount: 8,
            showSpotlightOnHome: true,
            showCategoriesOnHome: true,
            showTasksOnHome: true,
            showTop10OnHome: false,
            showFeaturedAlternatives: true,
        };
    }

    return {
        spotlightCount: data.spotlight_count,
        showSpotlightOnHome: data.show_spotlight_on_home,
        showCategoriesOnHome: data.show_categories_on_home,
        showTasksOnHome: data.show_tasks_on_home,
        showTop10OnHome: data.show_top10_on_home,
        showFeaturedAlternatives: data.show_featured_alternatives ?? true,
    };
}

/**
 * Fetch related/alternative tools for a specific tool
 * Based on shared categories and tasks
 */
export async function getRelatedTools(tool: AdminTool, limit: number = 6): Promise<AdminTool[]> {
    const categories = tool.categoryName || [];
    const tasks = tool.taskName || [];
    const manualSlugs = tool.alternativeTools || [];

    if (categories.length === 0 && tasks.length === 0 && manualSlugs.length === 0) {
        return [];
    }

    let query = supabase
        .from('tools')
        .select('*')
        .in('status', ['published', 'approved'])
        .neq('app_username', tool.slug)
        .limit(limit * 3); // Fetch more to ensure we get enough after filtering

    // Use OR condition: tools that overlap with categories OR tasks
    if (categories.length > 0 || tasks.length > 0) {
        query = query.or(
            categories.length > 0 && tasks.length > 0
                ? `category_name.ov.{${categories.join(',')}},task_name.ov.{${tasks.join(',')}}`
                : categories.length > 0
                    ? `category_name.ov.{${categories.join(',')}}`
                    : `task_name.ov.{${tasks.join(',')}}`
        );
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching related tools:', error);
        return [];
    }

    const tools = (data || []).map(t => dbToolToAdminTool(t)) as AdminTool[];

    // Manually specified alternatives first
    const manual = tools.filter(t => manualSlugs.includes(t.slug));

    // Auto-determined alternatives (not in manual list)
    const auto = tools
        .filter(t => !manualSlugs.includes(t.slug))
        .slice(0, limit - manual.length);

    return [...manual, ...auto].slice(0, limit);
}

/**
 * Fetch suggested tools based on tags, categories, tasks, and text similarity
 * Uses DB-level filtering for performance, sorted by: match score, created date, save count
 */
export async function getSuggestedTools(tool: AdminTool, limit: number = 6): Promise<AdminTool[]> {
    const categories = tool.categoryName || [];
    const tasks = tool.taskName || [];
    const tags = tool.tags || [];
    const alternativeSlugs = tool.alternativeTools || [];


    // Build multiple queries for different match types - run in parallel
    const queries: Promise<any[]>[] = [];

    // Query 1: Category matches (highest priority) - fetch more for diversity
    if (categories.length > 0) {
        queries.push(
            Promise.resolve(
                supabase
                    .from('tools')
                    .select('*')
                    .in('status', ['published', 'approved'])
                    .neq('app_username', tool.slug)
                    .overlaps('category_name', categories)
                    .limit(limit * 5)
                    .then(r => (r.data || []).map(t => ({ ...t, _matchType: 'category' })))
            )
        );
    }

    // Query 2: Task matches
    if (tasks.length > 0) {
        queries.push(
            Promise.resolve(
                supabase
                    .from('tools')
                    .select('*')
                    .in('status', ['published', 'approved'])
                    .neq('app_username', tool.slug)
                    .overlaps('task_name', tasks)
                    .limit(limit * 5)
                    .then(r => (r.data || []).map(t => ({ ...t, _matchType: 'task' })))
            )
        );
    }

    // Query 3: Tag matches
    if (tags.length > 0) {
        queries.push(
            Promise.resolve(
                supabase
                    .from('tools')
                    .select('*')
                    .in('status', ['published', 'approved'])
                    .neq('app_username', tool.slug)
                    .overlaps('tags', tags)
                    .limit(limit * 5)
                    .then(r => (r.data || []).map(t => ({ ...t, _matchType: 'tag' })))
            )
        );
    }

    // Skip text search - it causes too similar results (all start with same letter)

    if (queries.length === 0) {
        return [];
    }

    // Run all queries in parallel for speed
    const results = await Promise.all(queries);
    const allMatches = results.flat();

    // Deduplicate and score
    const toolMap = new Map<string, { tool: any, score: number }>();

    function getMatchScore(matchType: string): number {
        switch (matchType) {
            case 'category': return 5;
            case 'task': return 4;
            case 'tag': return 3;
            default: return 1;
        }
    }

    allMatches.forEach(t => {
        const existing = toolMap.get(t.app_username);
        const matchScore = getMatchScore(t._matchType);

        if (existing) {
            existing.score += matchScore;
        } else {
            toolMap.set(t.app_username, { tool: t, score: matchScore });
        }
    });

    // Convert to array and sort with randomization for diversity
    const scored = Array.from(toolMap.values())
        .filter(s => !alternativeSlugs.includes(s.tool.app_username))
        .map(s => ({ ...s, random: Math.random() })) // Add random factor
        .sort((a, b) => {
            // 1. Score (primary - highest first)
            if (b.score !== a.score) return b.score - a.score;
            // 2. Random shuffle for same-score items (diversity)
            return a.random - b.random;
        });

    return scored.slice(0, limit).map(s => dbToolToAdminTool(s.tool));
}

/**
 * Fetch featured tools (sorted by save count)
 */
export async function getFeaturedTools(excludeSlug?: string, limit: number = 6): Promise<AdminTool[]> {
    const query = supabase
        .from('tools')
        .select('*')
        .in('status', ['published', 'approved'])
        .order('save_count', { ascending: false })
        .limit(limit);

    if (excludeSlug) {
        query.neq('app_username', excludeSlug);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching featured tools:', error);
        return [];
    }

    return (data || []).map(t => dbToolToAdminTool(t)) as AdminTool[];
}

/**
 * Fetch recently added tools
 */
export async function getRecentlyAddedTools(excludeSlug?: string, limit: number = 5): Promise<AdminTool[]> {
    const query = supabase
        .from('tools')
        .select('*')
        .in('status', ['published', 'approved'])
        .order('created_at', { ascending: false })
        .limit(limit);

    if (excludeSlug) {
        query.neq('app_username', excludeSlug);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching recently added tools:', error);
        return [];
    }

    return (data || []).map(t => dbToolToAdminTool(t)) as AdminTool[];
}

/**
 * Fetch tags for SSR pages
 */
export async function getTags() {
    const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('tag_name', { ascending: true });

    if (error) {
        console.error('Error fetching tags:', error);
        return [];
    }

    return (data || []).map(row => ({
        id: row.id,
        tagName: row.tag_name,
        count: row.count,
    }));
}
