/**
 * Server-Side Data Fetching
 * 
 * These functions fetch data directly from Supabase for Server Components.
 * Used by public pages that need to display data without API calls.
 */

import { supabase, dbToolToAdminTool } from './supabase';
import { AdminTool, Category, Task } from '@/types';

/**
 * Fetch published tools for the homepage
 * Returns tools with status = 'published' or 'approved'
 */
export async function getPublishedTools(): Promise<AdminTool[]> {
    const { data, error } = await supabase
        .from('tools')
        .select('*')
        .in('status', ['published', 'approved'])
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching published tools:', error);
        return [];
    }

    return (data || []).map(tool => dbToolToAdminTool(tool)) as AdminTool[];
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
 * Fetch categories for homepage
 */
export async function getCategories(): Promise<Category[]> {
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('category_name', { ascending: true });

    if (error) {
        console.error('Error fetching categories:', error);
        return [];
    }

    return (data || []).map(row => ({
        id: row.id,
        categoryName: row.category_name,
        description: row.description,
        count: row.count,
        icon: row.icon,
    }));
}

/**
 * Fetch tasks for homepage
 */
export async function getTasks(): Promise<Task[]> {
    const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('task_name', { ascending: true });

    if (error) {
        console.error('Error fetching tasks:', error);
        return [];
    }

    return (data || []).map(row => ({
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

