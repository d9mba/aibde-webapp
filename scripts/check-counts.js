/**
 * Test what the API actually returns
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

async function testFetch() {
    console.log('Testing published tools fetch with limit 20000...\n');

    const { data, error, count } = await supabase
        .from('tools')
        .select('id, name, status', { count: 'exact' })
        .in('status', ['published', 'approved'])
        .order('created_at', { ascending: false })
        .limit(20000);

    if (error) {
        console.error('Error:', error.message);
        return;
    }

    console.log(`Total count (from count query): ${count}`);
    console.log(`Actually fetched: ${data?.length || 0} tools`);

    if (data && data.length > 0) {
        console.log(`\nFirst tool: ${data[0].name} (${data[0].status})`);
        console.log(`Last tool: ${data[data.length - 1].name} (${data[data.length - 1].status})`);

        // Check status distribution
        const statusCounts = {};
        data.forEach(t => {
            statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
        });
        console.log('\nStatus distribution in fetched tools:');
        console.log(JSON.stringify(statusCounts, null, 2));
    }
}

testFetch().catch(console.error);
