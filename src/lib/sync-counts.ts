/**
 * Sync category and task counts after tool changes
 *
 * When tools are created/updated/deleted, the `count` columns on
 * the `categories` and `tasks` tables can become stale.
 * These helpers recalculate the counts from actual published tool data.
 */

import { supabaseAdmin } from './supabase';

const PUBLISHED_STATUSES = ['published', 'approved'];

/**
 * Sync counts for specific category names.
 * Counts how many published tools reference each category.
 */
export async function syncCategoryCounts(categoryNames: string[]): Promise<void> {
    if (!categoryNames?.length) return;

    const unique = [...new Set(categoryNames)];

    for (const name of unique) {
        const { count, error: selectError } = await supabaseAdmin
            .from('tools')
            .select('*', { count: 'exact', head: true })
            .contains('category_name', [name])
            .in('status', PUBLISHED_STATUSES);

        if (selectError) {
            console.error(`[syncCategoryCounts] Failed to count tools for "${name}":`, selectError);
            continue;
        }

        const { error: updateError } = await supabaseAdmin
            .from('categories')
            .update({ count: count ?? 0 })
            .eq('category_name', name);

        if (updateError) {
            console.error(`[syncCategoryCounts] Failed to update count for "${name}":`, updateError);
        }
    }
}

/**
 * Sync counts for specific task names.
 * Counts how many published tools reference each task.
 */
export async function syncTaskCounts(taskNames: string[]): Promise<void> {
    if (!taskNames?.length) return;

    const unique = [...new Set(taskNames)];

    for (const name of unique) {
        const { count, error: selectError } = await supabaseAdmin
            .from('tools')
            .select('*', { count: 'exact', head: true })
            .contains('task_name', [name])
            .in('status', PUBLISHED_STATUSES);

        if (selectError) {
            console.error(`[syncTaskCounts] Failed to count tools for "${name}":`, selectError);
            continue;
        }

        const { error: updateError } = await supabaseAdmin
            .from('tasks')
            .update({ count: count ?? 0 })
            .eq('task_name', name);

        if (updateError) {
            console.error(`[syncTaskCounts] Failed to update count for "${name}":`, updateError);
        }
    }
}

/**
 * Sync both category and task counts for the given arrays.
 * Call this after tool create/update/delete.
 * Runs in the background — errors are logged but don't throw.
 */
export async function syncToolCounts(
    categories: string[],
    tasks: string[]
): Promise<void> {
    try {
        await Promise.all([
            syncCategoryCounts(categories),
            syncTaskCounts(tasks),
        ]);
    } catch (err) {
        console.error('[syncToolCounts] Failed to sync counts:', err);
    }
}
