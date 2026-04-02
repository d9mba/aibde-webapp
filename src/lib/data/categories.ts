import 'server-only';

/**
 * Category and Task Queries (SERVER-ONLY)
 *
 * Uses supabaseAdmin to bypass RLS — these functions are only called
 * from Next.js server components (page.tsx) and never from client code.
 * The service role key stays on the server and is never exposed to the browser.
 */

// Deliberate: supabaseAdmin bypasses RLS so all categories/tasks are visible on public pages
import { supabaseAdmin } from '../supabase';
import { Category, Task } from '@/types';

/**
 * Fetch categories for homepage
 * Only returns categories with at least 1 linked tool (count > 0)
 * Sorted by popularity (count)
 */
export async function getCategories(): Promise<Category[]> {
    const { data, error } = await supabaseAdmin
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
 * Fetch a page of categories (for sitemap pagination). Order by category_name for stable paging.
 */
export async function getCategoriesRange(offset: number, limit: number): Promise<Category[]> {
    const { data, error } = await supabaseAdmin
        .from('categories')
        .select('*')
        .order('category_name', { ascending: true })
        .range(offset, offset + limit - 1);

    if (error) {
        console.error('Error fetching categories range:', error);
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
        const { data, error } = await supabaseAdmin
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
 * Fetch a page of tasks (for sitemap pagination). Order by task_name for stable paging.
 */
export async function getTasksRange(offset: number, limit: number): Promise<Task[]> {
    const { data, error } = await supabaseAdmin
        .from('tasks')
        .select('*')
        .order('task_name', { ascending: true })
        .range(offset, offset + limit - 1);

    if (error) {
        console.error('Error fetching tasks range:', error);
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
 * Fetch tags for SSR pages
 */
export async function getTags() {
    const { data, error } = await supabaseAdmin
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
