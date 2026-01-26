/**
 * Remove duplicate tasks and tags from the database
 * Keeps the first occurrence (lowest ID) of each duplicate
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Manually load .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex > 0) {
            const key = trimmed.substring(0, eqIndex);
            const value = trimmed.substring(eqIndex + 1).replace(/^["']|["']$/g, '');
            if (!process.env[key]) {
                process.env[key] = value;
            }
        }
    });
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function removeDuplicateTasks() {
    console.log('\n--- Removing Duplicate Tasks ---');

    // Fetch all tasks
    const { data: tasks, error } = await supabase
        .from('tasks')
        .select('id, task_name')
        .order('id', { ascending: true });

    if (error) {
        console.error('Error fetching tasks:', error.message);
        return;
    }

    console.log(`Found ${tasks.length} total tasks`);

    // Find duplicates (keep first occurrence)
    const seen = new Map();
    const duplicateIds = [];

    for (const task of tasks) {
        const normalized = task.task_name.toLowerCase().trim();
        if (seen.has(normalized)) {
            duplicateIds.push(task.id);
        } else {
            seen.set(normalized, task.id);
        }
    }

    console.log(`Found ${duplicateIds.length} duplicate tasks to remove`);

    if (duplicateIds.length > 0) {
        // Delete in batches
        const batchSize = 100;
        for (let i = 0; i < duplicateIds.length; i += batchSize) {
            const batch = duplicateIds.slice(i, i + batchSize);
            const { error: deleteError } = await supabase
                .from('tasks')
                .delete()
                .in('id', batch);

            if (deleteError) {
                console.error(`Error deleting batch: ${deleteError.message}`);
            } else {
                console.log(`  Deleted ${Math.min(i + batchSize, duplicateIds.length)}/${duplicateIds.length} duplicates`);
            }
        }
    }

    console.log('Tasks cleanup complete!');
}

async function removeDuplicateTags() {
    console.log('\n--- Removing Duplicate Tags ---');

    // Fetch all tags
    const { data: tags, error } = await supabase
        .from('tags')
        .select('id, tag_name')
        .order('id', { ascending: true });

    if (error) {
        console.error('Error fetching tags:', error.message);
        return;
    }

    console.log(`Found ${tags.length} total tags`);

    // Find duplicates (keep first occurrence)
    const seen = new Map();
    const duplicateIds = [];

    for (const tag of tags) {
        const normalized = tag.tag_name.toLowerCase().trim();
        if (seen.has(normalized)) {
            duplicateIds.push(tag.id);
        } else {
            seen.set(normalized, tag.id);
        }
    }

    console.log(`Found ${duplicateIds.length} duplicate tags to remove`);

    if (duplicateIds.length > 0) {
        // Delete in batches
        const batchSize = 100;
        for (let i = 0; i < duplicateIds.length; i += batchSize) {
            const batch = duplicateIds.slice(i, i + batchSize);
            const { error: deleteError } = await supabase
                .from('tags')
                .delete()
                .in('id', batch);

            if (deleteError) {
                console.error(`Error deleting batch: ${deleteError.message}`);
            } else {
                console.log(`  Deleted ${Math.min(i + batchSize, duplicateIds.length)}/${duplicateIds.length} duplicates`);
            }
        }
    }

    console.log('Tags cleanup complete!');
}

async function main() {
    console.log('========================================');
    console.log(' Database Deduplication Script');
    console.log('========================================');

    await removeDuplicateTasks();
    await removeDuplicateTags();

    console.log('\n========================================');
    console.log(' Deduplication Complete!');
    console.log('========================================\n');
}

main().catch(console.error);
