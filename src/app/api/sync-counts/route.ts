import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin, isAuthError } from '@/lib/auth-utils';

/**
 * POST /api/sync-counts
 * Recalculates and syncs category and task counts based on published tools
 * ADMIN ONLY
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

        // Build maps from lowercase to original-cased names
        const categoryNameMap = new Map<string, string>();
        (existingCategories || []).forEach(c => {
            categoryNameMap.set(c.category_name.toLowerCase(), c.category_name);
        });

        const taskNameMap = new Map<string, string>();
        (existingTasks || []).forEach(t => {
            taskNameMap.set(t.task_name.toLowerCase(), t.task_name);
        });

        // Create missing categories
        let categoriesCreated = 0;
        for (const [categoryName, count] of categoryCounts) {
            const lowerName = categoryName.toLowerCase();
            const originalName = categoryNameMap.get(lowerName);

            if (!originalName) {
                // Create new category
                const { error } = await supabaseAdmin
                    .from('categories')
                    .insert({ category_name: categoryName, count });
                if (!error) {
                    categoriesCreated++;
                    categoryNameMap.set(lowerName, categoryName);
                }
            } else {
                // Update existing category count using original-cased name
                await supabaseAdmin
                    .from('categories')
                    .update({ count })
                    .eq('category_name', originalName);
            }
        }

        // Create missing tasks
        let tasksCreated = 0;
        for (const [taskName, count] of taskCounts) {
            const lowerName = taskName.toLowerCase();
            const originalName = taskNameMap.get(lowerName);

            if (!originalName) {
                // Create new task
                const { error } = await supabaseAdmin
                    .from('tasks')
                    .insert({ task_name: taskName, count });
                if (!error) {
                    tasksCreated++;
                    taskNameMap.set(lowerName, taskName);
                }
            } else {
                // Update existing task count using original-cased name
                await supabaseAdmin
                    .from('tasks')
                    .update({ count })
                    .eq('task_name', originalName);
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
