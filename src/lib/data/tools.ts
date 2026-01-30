/**
 * Tool Fetching Functions
 * Fetch tools for various pages
 */

import { supabase, dbToolToAdminTool } from '../supabase';
import { AdminTool } from '@/types';

/**
 * Fetch published tools for the homepage
 * Returns tools with status = 'published' or 'approved'
 */
export async function getPublishedTools(): Promise<AdminTool[]> {
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
 * Fetch trending tools (Manual positions)
 */
export async function getTrendingTools(limit: number = 100): Promise<AdminTool[]> {
    const { data, error } = await supabase
        .from('tools')
        .select('*')
        .in('status', ['published', 'approved'])
        .gt('trending_position', 0)
        .order('trending_position', { ascending: true })
        .limit(limit);

    if (error) {
        console.error('Error fetching trending tools:', error);
        return [];
    }

    return (data || []).map(tool => dbToolToAdminTool(tool)) as AdminTool[];
}

/**
 * Fetch tools by category name
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
 * Fetch tools by task name
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
 * Fetch a single published tool by app_username
 */
export async function getToolByAppUsername(app_username: string): Promise<AdminTool | null> {
    const { data, error } = await supabase
        .from('tools')
        .select('*')
        .eq('app_username', app_username)
        .in('status', ['published', 'approved'])
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            return null;
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
 * Fetch featured tools (sorted by save count)
 */
export async function getFeaturedTools(excludeSlug?: string, limit: number = 6): Promise<AdminTool[]> {
    let query = supabase
        .from('tools')
        .select('*')
        .in('status', ['published', 'approved'])
        .order('save_count', { ascending: false })
        .limit(limit + (excludeSlug ? 1 : 0));

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching featured tools:', error);
        return [];
    }

    let tools = (data || []).map(tool => dbToolToAdminTool(tool)) as AdminTool[];

    if (excludeSlug) {
        tools = tools.filter(t => t.app_username !== excludeSlug).slice(0, limit);
    }

    return tools;
}

/**
 * Fetch recently added tools
 */
export async function getRecentlyAddedTools(excludeSlug?: string, limit: number = 5): Promise<AdminTool[]> {
    let query = supabase
        .from('tools')
        .select('*')
        .in('status', ['published', 'approved'])
        .order('created_at', { ascending: false })
        .limit(limit + (excludeSlug ? 1 : 0));

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching recently added tools:', error);
        return [];
    }

    let tools = (data || []).map(tool => dbToolToAdminTool(tool)) as AdminTool[];

    if (excludeSlug) {
        tools = tools.filter(t => t.app_username !== excludeSlug).slice(0, limit);
    }

    return tools;
}
