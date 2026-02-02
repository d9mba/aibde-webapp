import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin, isAuthError } from '@/lib/auth-utils';

/**
 * Recalculates and synchronizes category and task counts based on published tools — admin only.
 *
 * Updates counts by tallying categories and tasks from all published tools, creating any missing
 * category/task records and updating existing ones, then returns a summary of the changes.
 *
 * @returns A NextResponse with JSON. On success: `{ success: true, message: string, stats: { publishedTools: number, uniqueCategories: number, uniqueTasks: number, categoriesCreated: number, categoriesUpdated: number, tasksCreated: number, tasksUpdated: number } }`. On failure: `{ error: string }` with an appropriate HTTP status.
 */
export async function POST() {
    try {
        const authResult = await requireAdmin();
        if (isAuthError(authResult)) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        // Get all published tools to count categories and tasks
        const { data: allTools, error: toolsError } = await supabaseAdmin
            .from('tools')
            .select('category_name, task_name')
            .eq('status', 'published');

        if (toolsError) {
            return NextResponse.json({ error: toolsError.message }, { status: 500 });
        }

        // Count occurrences of each category and task
        const categoryCounts = new Map<string, number>();
        const taskCounts = new Map<string, number>();

        (allTools || []).forEach(tool => {
            // Count categories
            const categories = Array.isArray(tool.category_name)
                ? tool.category_name
                : (tool.category_name ? [tool.category_name] : []);
            categories.forEach((cat: string) => {
                categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
            });

            // Count tasks
            const tasks = Array.isArray(tool.task_name)
                ? tool.task_name
                : (tool.task_name ? [tool.task_name] : []);
            tasks.forEach((task: string) => {
                taskCounts.set(task, (taskCounts.get(task) || 0) + 1);
            });
        });

        // First, reset all counts to 0
        await supabaseAdmin.from('categories').update({ count: 0 }).neq('id', '');
        await supabaseAdmin.from('tasks').update({ count: 0 }).neq('id', '');

        // Get existing categories and tasks for matching
        const { data: existingCategories } = await supabaseAdmin.from('categories').select('category_name');
        const { data: existingTasks } = await supabaseAdmin.from('tasks').select('task_name');

        const existingCategoryNames = new Set((existingCategories || []).map(c => c.category_name.toLowerCase()));
        const existingTaskNames = new Set((existingTasks || []).map(t => t.task_name.toLowerCase()));

        // Create missing categories
        let categoriesCreated = 0;
        for (const [categoryName, count] of categoryCounts) {
            if (!existingCategoryNames.has(categoryName.toLowerCase())) {
                const { error } = await supabaseAdmin
                    .from('categories')
                    .insert({ category_name: categoryName, count });
                if (!error) categoriesCreated++;
            } else {
                // Update existing category count
                await supabaseAdmin
                    .from('categories')
                    .update({ count })
                    .eq('category_name', categoryName);
            }
        }

        // Create missing tasks
        let tasksCreated = 0;
        for (const [taskName, count] of taskCounts) {
            if (!existingTaskNames.has(taskName.toLowerCase())) {
                const { error } = await supabaseAdmin
                    .from('tasks')
                    .insert({ task_name: taskName, count });
                if (!error) tasksCreated++;
            } else {
                // Update existing task count
                await supabaseAdmin
                    .from('tasks')
                    .update({ count })
                    .eq('task_name', taskName);
            }
        }

        // Count how many were just updated (not created)
        const categoriesUpdated = categoryCounts.size - categoriesCreated;
        const tasksUpdated = taskCounts.size - tasksCreated;

        return NextResponse.json({
            success: true,
            message: 'Counts synced successfully',
            stats: {
                publishedTools: allTools?.length || 0,
                uniqueCategories: categoryCounts.size,
                uniqueTasks: taskCounts.size,
                categoriesCreated,
                categoriesUpdated,
                tasksCreated,
                tasksUpdated
            }
        });

    } catch (error: any) {
        console.error('[Sync Counts] Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to sync counts' }, { status: 500 });
    }
}