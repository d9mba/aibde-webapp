/**
 * Category and Task Queries
 * Fetch categories and tasks for navigation
 */

import { supabase } from '../supabase';
import { Category, Task } from '@/types';

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
