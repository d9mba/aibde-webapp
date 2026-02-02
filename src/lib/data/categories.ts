/**
 * Category and Task Queries
 * Fetch categories and tasks for navigation
 */

import { supabase } from '../supabase';
import { Category, Task } from '@/types';

/**
 * Fetch categories for homepage
 * Only returns categories with at least 1 linked tool (count > 0)
 * Sorted by popularity (count)
 */
export async function getCategories(): Promise<Category[]> {
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .gt('count', 0) // Only categories with linked tools
        .order('count', { ascending: false }); // Most popular first

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
 * Only returns tasks with at least 1 linked tool (count > 0)
 * Paginated to handle more than 1000 rows (Supabase limit)
 * Sorted by popularity (count)
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
            .gt('count', 0) // Only tasks with linked tools
            .order('count', { ascending: false }) // Most popular first
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

    return data?.map(row => ({
        id: row.id,
        tagName: row.tag_name,
        description: row.description,
        count: row.count,
    })) || [];
}
