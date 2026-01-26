/**
 * Clear all tools, tasks, tags, and categories from the database
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

async function clearTable(tableName) {
    console.log(`Clearing ${tableName}...`);
    const { error } = await supabase.from(tableName).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) {
        console.error(`  Error: ${error.message}`);
    } else {
        console.log(`  ${tableName} cleared!`);
    }
}

async function main() {
    console.log('========================================');
    console.log(' Database Clear Script');
    console.log('========================================\n');

    await clearTable('tools');
    await clearTable('tasks');
    await clearTable('tags');
    await clearTable('categories');

    console.log('\n========================================');
    console.log(' All tables cleared!');
    console.log('========================================\n');
}

main().catch(console.error);
