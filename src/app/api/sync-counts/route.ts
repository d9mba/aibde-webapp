import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin, isAuthError } from '@/lib/auth-utils';

const BATCH_SIZE = 50;

/**
 * Chunk an array into batches of a given size.
 */
function chunk<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks;
}

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
            const categories = Array.isArray(tool.category_name)
                ? tool.category_name
                : (tool.category_name ? [tool.category_name] : []);
            categories.forEach((cat: string) => {
                categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
            });

            const tasks = Array.isArray(tool.task_name)
                ? tool.task_name
                : (tool.task_name ? [tool.task_name] : []);
            tasks.forEach((task: string) => {
                taskCounts.set(task, (taskCounts.get(task) || 0) + 1);
            });
        });

        // Batch upsert categories in parallel chunks
        // NOTE: Supabase JS client doesn't support multi-table transactions.
        // Each upsert is individually atomic. On partial failure, the response
        // includes per-table errors so the caller can decide to retry.
        const categoryRows = Array.from(categoryCounts.entries()).map(([category_name, count]) => ({
            category_name,
            count,
        }));
        const categoryErrors: string[] = [];
        await Promise.all(
            chunk(categoryRows, BATCH_SIZE).map(async (batch) => {
                const { error } = await supabaseAdmin.from('categories').upsert(batch, { onConflict: 'category_name' });
                if (error) {
                    console.error('[Sync Counts] Category upsert failed:', error.message);
                    categoryErrors.push(error.message);
                }
            })
        );

        // Batch upsert tasks in parallel chunks
        const taskRows = Array.from(taskCounts.entries()).map(([task_name, count]) => ({
            task_name,
            count,
        }));
        const taskErrors: string[] = [];
        await Promise.all(
            chunk(taskRows, BATCH_SIZE).map(async (batch) => {
                const { error } = await supabaseAdmin.from('tasks').upsert(batch, { onConflict: 'task_name' });
                if (error) {
                    console.error('[Sync Counts] Task upsert failed:', error.message);
                    taskErrors.push(error.message);
                }
            })
        );

        if (categoryErrors.length > 0 || taskErrors.length > 0) {
            return NextResponse.json({
                error: 'Some upserts failed during sync',
                categoryErrors,
                taskErrors,
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Counts synced successfully',
            stats: {
                publishedTools: allTools?.length || 0,
                uniqueCategories: categoryCounts.size,
                uniqueTasks: taskCounts.size,
            }
        });

    } catch (error: any) {
        console.error('[Sync Counts] Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to sync counts' }, { status: 500 });
    }
}

