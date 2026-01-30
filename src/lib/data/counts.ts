/**
 * Count Queries
 * Get totals without loading all data
 */

import { supabase } from '../supabase';

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
