/**
 * Sync category and task counts after tool changes
 *
 * When tools are created/updated/deleted, the `count` columns on
 * the `categories` and `tasks` tables can become stale.
 * These helpers recalculate the counts from actual published tool data.
 */

import { supabaseAdmin } from './supabase';

const PUBLISHED_STATUSES = ['published', 'approved'] as const;

interface SyncConfig {
    toolColumn: string;
    targetTable: string;
    targetColumn: string;
    logPrefix: string;
}

async function syncEntityCounts(names: string[], config: SyncConfig): Promise<void> {
    if (!names?.length) return;

    const unique = [...new Set(names)];

    for (const name of unique) {
        const { count, error: selectError } = await supabaseAdmin
            .from('tools')
            .select('*', { count: 'exact', head: true })
            .contains(config.toolColumn, [name])
            .in('status', PUBLISHED_STATUSES as unknown as string[]);

        if (selectError) {
            console.error(`[${config.logPrefix}] Failed to count tools for "${name}":`, selectError);
            continue;
        }

        const { error: updateError } = await supabaseAdmin
            .from(config.targetTable)
            .update({ count: count ?? 0 })
            .eq(config.targetColumn, name);

        if (updateError) {
            console.error(`[${config.logPrefix}] Failed to update count for "${name}":`, updateError);
        }
    }
}

/**
 * Sync counts for specific category names.
 * Counts how many published tools reference each category.
 */
export async function syncCategoryCounts(categoryNames: string[]): Promise<void> {
    return syncEntityCounts(categoryNames, {
        toolColumn: 'category_name',
        targetTable: 'categories',
        targetColumn: 'category_name',
        logPrefix: 'syncCategoryCounts',
    });
}

/**
 * Sync counts for specific task names.
 * Counts how many published tools reference each task.
 */
export async function syncTaskCounts(taskNames: string[]): Promise<void> {
    return syncEntityCounts(taskNames, {
        toolColumn: 'task_name',
        targetTable: 'tasks',
        targetColumn: 'task_name',
        logPrefix: 'syncTaskCounts',
    });
}

/**
 * Sync both category and task counts for the given arrays.
 * Call this after tool create/update/delete.
 *
 * This is an async function — it runs synchronously when awaited.
 * It only runs "in the background" if callers intentionally do not await it
 * (fire-and-forget). Errors are logged inside and do not propagate.
 *
 * Internally calls syncCategoryCounts and syncTaskCounts in parallel.
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
