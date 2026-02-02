/**
 * Count Queries
 * Get totals without loading all data
 */

import { supabase } from '../supabase';

/**
 * Get the total number of tools, optionally filtered by status.
 *
 * @param statusFilter - An optional array of statuses (`'published'` or `'approved'`) to restrict the count to matching tools.
 * @returns The number of tools that match the filter (or total tools if no filter is provided). Returns `0` if an error occurs.
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

/**
 * Count unique category names among tools that have status `published` or `approved`.
 *
 * Treats each tool's `category_name` as an array of strings and aggregates unique entries.
 *
 * @returns The number of unique categories across tools with status `published` or `approved`. Returns `0` if the database query fails.
 */
export async function getCategoriesCount(): Promise<number> {
    // Count only categories that have at least one published tool
    const { data, error } = await supabase
        .from('tools')
        .select('category_name')
        .in('status', ['published', 'approved']);

    if (error) {
        console.error('Error counting categories:', error);
        return 0;
    }

    // Extract unique categories from published tools
    const uniqueCategories = new Set<string>();
    data?.forEach(tool => {
        if (tool.category_name && Array.isArray(tool.category_name)) {
            tool.category_name.forEach((cat: string) => uniqueCategories.add(cat));
        }
    });

    return uniqueCategories.size;
}

/**
 * Count unique task names referenced by tools with a published or approved status.
 *
 * @returns The number of distinct task names found among tools whose status is `published` or `approved`.
 */
export async function getTasksCount(): Promise<number> {
    // Count only tasks that have at least one published tool
    const { data, error } = await supabase
        .from('tools')
        .select('task_name')
        .in('status', ['published', 'approved']);

    if (error) {
        console.error('Error counting tasks:', error);
        return 0;
    }

    // Extract unique tasks from published tools
    const uniqueTasks = new Set<string>();
    data?.forEach(tool => {
        if (tool.task_name && Array.isArray(tool.task_name)) {
            tool.task_name.forEach((task: string) => uniqueTasks.add(task));
        }
    });

    return uniqueTasks.size;
}

/**
 * Count the total number of tag records in the tags table.
 *
 * @returns The total number of tags, or 0 if an error occurs or none are found.
 */
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

export async function getToolsCountByCategory(categoryName: string): Promise<number> {
    const { count, error } = await supabase
        .from('tools')
        .select('*', { count: 'exact', head: true })
        .contains('category_name', [categoryName])
        .in('status', ['published', 'approved']);

    if (error) {
        console.error('Error counting tools by category:', error);
        return 0;
    }

    return count || 0;
}

export async function getToolsCountByTask(taskName: string): Promise<number> {
    const { count, error } = await supabase
        .from('tools')
        .select('*', { count: 'exact', head: true })
        .contains('task_name', [taskName])
        .in('status', ['published', 'approved']);

    if (error) {
        console.error('Error counting tools by task:', error);
        return 0;
    }

    return count || 0;
}