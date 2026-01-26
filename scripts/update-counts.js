/**
 * Update category and task counts in the database
 * Counts published tools per category/task
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

async function updateCategoryCounts() {
    console.log('\n--- Updating Category Counts ---');

    // Get all published tools
    const { data: tools, error: toolsError } = await supabase
        .from('tools')
        .select('category_name')
        .in('status', ['published', 'approved']);

    if (toolsError) {
        console.error('Error fetching tools:', toolsError.message);
        return;
    }

    // Count tools per category
    const categoryCounts = {};
    for (const tool of tools || []) {
        const categories = tool.category_name || [];
        for (const cat of categories) {
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        }
    }

    // Get all categories
    const { data: categories, error: catError } = await supabase
        .from('categories')
        .select('id, category_name');

    if (catError) {
        console.error('Error fetching categories:', catError.message);
        return;
    }

    // Update counts
    let updated = 0;
    for (const cat of categories || []) {
        const count = categoryCounts[cat.category_name] || 0;
        const { error } = await supabase
            .from('categories')
            .update({ count })
            .eq('id', cat.id);

        if (!error) updated++;
    }

    console.log(`Updated ${updated} category counts`);
}

async function updateTaskCounts() {
    console.log('\n--- Updating Task Counts ---');

    // Get all published tools
    const { data: tools, error: toolsError } = await supabase
        .from('tools')
        .select('task_name')
        .in('status', ['published', 'approved']);

    if (toolsError) {
        console.error('Error fetching tools:', toolsError.message);
        return;
    }

    // Count tools per task
    const taskCounts = {};
    for (const tool of tools || []) {
        const tasks = tool.task_name || [];
        for (const task of tasks) {
            taskCounts[task] = (taskCounts[task] || 0) + 1;
        }
    }

    // Get all tasks
    const { data: tasks, error: taskError } = await supabase
        .from('tasks')
        .select('id, task_name');

    if (taskError) {
        console.error('Error fetching tasks:', taskError.message);
        return;
    }

    // Update counts
    let updated = 0;
    for (const task of tasks || []) {
        const count = taskCounts[task.task_name] || 0;
        const { error } = await supabase
            .from('tasks')
            .update({ count })
            .eq('id', task.id);

        if (!error) updated++;
    }

    console.log(`Updated ${updated} task counts`);
}

async function main() {
    console.log('========================================');
    console.log(' Updating Category and Task Counts');
    console.log('========================================');

    await updateCategoryCounts();
    await updateTaskCounts();

    console.log('\n========================================');
    console.log(' Counts Updated!');
    console.log('========================================\n');
}

main().catch(console.error);
