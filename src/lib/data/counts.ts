/**
 * Count Queries
 * Get totals without loading all data
 */

import { supabaseAdmin as supabase } from '../supabase';

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
        .select('*', { count: 'exact', head: true })
        .gt('count', 0);

    if (error) {
        console.error('Error counting categories:', error);
        return 0;
    }

    return count || 0;
}

export async function getTasksCount(): Promise<number> {
    const { count, error } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .gt('count', 0);

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
