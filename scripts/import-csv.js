/**
 * CSV Import Script for AIBDE Tools Database
 * 
 * This script:
 * 1. Reads the CSV file (updated_10.csv)
 * 2. Downloads logo URLs from external sources and uploads them to R2/CDN
 * 3. Inserts the data into the Supabase `tools` table
 * 
 * Usage: node scripts/import-csv.js [options]
 * Options:
 *   --dry-run       Don't actually insert data, just validate
 *   --skip-logos    Skip logo upload, just use external URLs directly
 *   --limit N       Only process first N rows
 *   --start N       Start from row N (0-indexed)
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { createClient } = require('@supabase/supabase-js');
const sharp = require('sharp');

// ============== Configuration ==============
const CSV_PATH = path.join(__dirname, '..', 'top_500_tools.csv');
const BATCH_SIZE = 50; // Insert in batches
const LOGO_FOLDER = 'logos';
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

// ============== Rollback Tracking ==============
// Track uploaded R2 files and inserted tool IDs for cleanup on cancel
const uploadedR2Keys = [];
const insertedToolIds = [];
let isCleaningUp = false;

// ============== Initialize Clients ==============
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

const R2_BUCKET = process.env.R2_BUCKET_NAME;
const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || process.env.R2_PUBLIC_URL;

// ============== Cleanup/Rollback Functions ==============

async function cleanupOnCancel() {
    if (isCleaningUp) return;
    isCleaningUp = true;

    console.log('\n\n========================================');
    console.log(' IMPORT CANCELLED - Starting Rollback');
    console.log('========================================\n');

    // Delete uploaded R2 files
    if (uploadedR2Keys.length > 0) {
        console.log(`Deleting ${uploadedR2Keys.length} uploaded files from R2...`);
        for (const key of uploadedR2Keys) {
            try {
                await r2Client.send(new DeleteObjectCommand({
                    Bucket: R2_BUCKET,
                    Key: key,
                }));
                console.log(`  Deleted: ${key}`);
            } catch (err) {
                console.error(`  Failed to delete ${key}: ${err.message}`);
            }
        }
    }

    // Delete inserted tools from Supabase
    if (insertedToolIds.length > 0) {
        console.log(`\nDeleting ${insertedToolIds.length} inserted tools from Supabase...`);
        const { error } = await supabase
            .from('tools')
            .delete()
            .in('id', insertedToolIds);

        if (error) {
            console.error(`  Failed to delete tools: ${error.message}`);
        } else {
            console.log(`  Deleted ${insertedToolIds.length} tools successfully`);
        }
    }

    console.log('\n========================================');
    console.log(' Rollback Complete');
    console.log('========================================\n');
    process.exit(1);
}

// Handle Ctrl+C (SIGINT) for graceful cleanup
process.on('SIGINT', () => {
    console.log('\n\nReceived SIGINT (Ctrl+C)...');
    cleanupOnCancel();
});

// ============== Utility Functions ==============

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        dryRun: args.includes('--dry-run'),
        skipLogos: args.includes('--skip-logos'),
        limit: null,
        start: 0,
    };

    const limitIdx = args.indexOf('--limit');
    if (limitIdx !== -1 && args[limitIdx + 1]) {
        options.limit = parseInt(args[limitIdx + 1], 10);
    }

    const startIdx = args.indexOf('--start');
    if (startIdx !== -1 && args[startIdx + 1]) {
        options.start = parseInt(args[startIdx + 1], 10);
    }

    return options;
}

function generateSlug(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 100);
}

function parseStringArray(value) {
    if (!value || value.trim() === '') return [];

    // Try to parse as JSON array first (CSV has JSON arrays like ["item1", "item2"])
    try {
        const trimmed = value.trim();
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
                return parsed.map(s => String(s).trim()).filter(Boolean);
            }
        }
    } catch (e) {
        // Not valid JSON, fall back to pipe-separated
    }

    // Fallback: Split by | and trim each item
    return value.split('|').map(s => s.trim()).filter(Boolean);
}

function parseHashtags(value) {
    if (!value || value.trim() === '') return [];

    // Try to parse as JSON array first
    try {
        const trimmed = value.trim();
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
                // Remove # prefix from each tag
                return parsed.map(s => String(s).trim().replace(/^#/, '')).filter(Boolean);
            }
        }
    } catch (e) {
        // Not valid JSON, fall back to pipe-separated
    }

    // Fallback: Split by | and remove # prefix
    return value.split('|')
        .map(s => s.trim().replace(/^#/, ''))
        .filter(Boolean);
}

function parsePricing(value) {
    if (!value) return 'free';
    const lower = value.toLowerCase().trim();
    if (lower === 'free') return 'free';
    if (lower === 'freemium') return 'freemium';
    if (lower === 'paid') return 'paid';
    // Default to freemium if contains "free" 
    if (lower.includes('free')) return 'freemium';
    return 'paid';
}

function parseBoolean(value) {
    if (!value) return false;
    const lower = value.toString().toLowerCase().trim();
    return lower === 'true' || lower === '1' || lower === 'yes';
}

function parsePopularityScore(value) {
    if (!value) return null;
    const num = parseInt(value, 10);
    return isNaN(num) ? null : num;
}

function parseReleasedAt(value) {
    if (!value || value.trim() === '') return null;

    const trimmed = value.trim();

    // If it's just a year (e.g., "2006"), convert to ISO date
    if (/^\d{4}$/.test(trimmed)) {
        return `${trimmed}-01-01`;
    }

    // If it's already a valid date format, return as-is
    try {
        const date = new Date(trimmed);
        if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
        }
    } catch (e) {
        // Ignore parsing errors
    }

    return null; // Invalid date format
}

async function downloadImage(url, retries = MAX_RETRIES) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 30000);

            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                },
                signal: controller.signal,
            });

            clearTimeout(timeout);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const contentType = response.headers.get('content-type') || 'image/jpeg';
            const buffer = Buffer.from(await response.arrayBuffer());

            return { buffer, contentType };
        } catch (error) {
            if (attempt < retries) {
                console.log(`    Retry ${attempt}/${retries} for ${url.slice(0, 60)}...`);
                await sleep(RETRY_DELAY);
            } else {
                throw error;
            }
        }
    }
}

async function compressImage(buffer, contentType) {
    try {
        // Skip compression for small images or GIFs
        if (buffer.length < 50 * 1024 || contentType.includes('gif')) {
            return buffer;
        }

        const image = sharp(buffer);
        const metadata = await image.metadata();

        // Resize if too large
        let pipeline = image;
        const maxDim = 512; // Logos don't need to be huge
        if (metadata.width > maxDim || metadata.height > maxDim) {
            pipeline = pipeline.resize(maxDim, maxDim, {
                fit: 'inside',
                withoutEnlargement: true,
            });
        }

        // Convert to WebP for better compression
        return await pipeline.webp({ quality: 85 }).toBuffer();
    } catch (error) {
        // If compression fails, return original
        console.warn(`    Compression failed, using original`);
        return buffer;
    }
}

async function uploadToR2(buffer, filename, contentType) {
    const key = `${LOGO_FOLDER}/${filename}`;

    const command = new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
    });

    await r2Client.send(command);

    // Track uploaded key for rollback
    uploadedR2Keys.push(key);

    return `${CDN_URL}/${key}`;
}

async function processLogo(logoUrl, appUsername, options) {
    if (!logoUrl || logoUrl.trim() === '') {
        return null;
    }

    if (options.skipLogos) {
        return logoUrl; // Return original URL if skipping cloud upload
    }

    // Skip if already on our CDN
    if (logoUrl.startsWith(CDN_URL)) {
        console.log(`    Logo already on CDN, skipping`);
        return logoUrl;
    }

    try {
        // Download the image
        const { buffer, contentType } = await downloadImage(logoUrl);

        // Check if it's an SVG - handle separately (no compression)
        const isSvg = contentType.includes('svg') || logoUrl.toLowerCase().endsWith('.svg');

        if (isSvg) {
            // Upload SVG directly without compression
            const timestamp = Date.now().toString(36);
            const filename = `${appUsername}-${timestamp}.svg`;
            const cdnUrl = await uploadToR2(buffer, filename, 'image/svg+xml');
            console.log(`    Uploaded SVG: ${(buffer.length / 1024).toFixed(1)}KB`);
            return cdnUrl;
        }

        // Compress raster images
        const compressed = await compressImage(buffer, contentType);

        // Generate filename based on app username
        const ext = 'webp'; // Convert raster to webp
        const timestamp = Date.now().toString(36);
        const filename = `${appUsername}-${timestamp}.${ext}`;

        // Upload to R2
        const cdnUrl = await uploadToR2(compressed, filename, 'image/webp');

        const savings = Math.round((1 - compressed.length / buffer.length) * 100);
        console.log(`    Uploaded: ${(buffer.length / 1024).toFixed(1)}KB → ${(compressed.length / 1024).toFixed(1)}KB (${savings}% saved)`);

        return cdnUrl;
    } catch (error) {
        console.error(`    Logo upload failed: ${error.message}`);
        return logoUrl; // Fallback to original URL
    }
}

function transformRowToDbTool(row, cloudLogoUrl) {
    const appUsername = row.app_username || generateSlug(row.name);

    // Parse FAQ if it exists
    let faqData = null;
    if (row.faq) {
        try {
            faqData = JSON.parse(row.faq);
        } catch (e) {
            faqData = null;
        }
    }

    // Parse social_links if it exists
    let socialLinksData = null;
    if (row.social_links) {
        try {
            socialLinksData = JSON.parse(row.social_links);
        } catch (e) {
            socialLinksData = null;
        }
    }

    return {
        name: row.name,
        app_username: appUsername,
        summary: row.summary || null,
        description: row.description || null,
        category_name: parseStringArray(row.category_name),
        task_name: parseStringArray(row.task_name),
        tags: parseHashtags(row.tags),
        pricing: parsePricing(row.pricing),
        pricing_label: row.pricing_label || null,
        website_url: row.website_url || null,
        logo_url: cloudLogoUrl || row.logo_url || null,
        core_features: parseStringArray(row.core_features),
        use_cases: parseStringArray(row.use_cases),
        pros: parseStringArray(row.pros),
        cons: parseStringArray(row.cons),
        faq: faqData,
        social_links: socialLinksData,
        released_at: parseReleasedAt(row.released_at),
        has_free_trial: parseBoolean(row.has_free_trial),
        is_featured: parseBoolean(row.is_top_tool), // Map is_top_tool to is_featured
        status: 'pending', // Import as pending for review before publishing
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };
}

async function insertBatch(tools, options) {
    if (options.dryRun) {
        console.log(`  [DRY RUN] Would insert ${tools.length} tools`);
        return { inserted: tools.length, errors: [] };
    }

    const { data, error } = await supabase
        .from('tools')
        .upsert(tools, {
            onConflict: 'app_username',
            ignoreDuplicates: false
        })
        .select('id, name, app_username');

    if (error) {
        console.error(`  Batch insert error: ${error.message}`);
        return { inserted: 0, errors: [error] };
    }

    // Track inserted tool IDs for rollback
    if (data && data.length > 0) {
        for (const tool of data) {
            insertedToolIds.push(tool.id);
        }
    }

    return { inserted: data?.length || 0, errors: [] };
}

// ============== Categories & Tasks Sync ==============

async function syncCategoriesAndTasks(allTools, options) {
    console.log('\n----------------------------------------');
    console.log(' Syncing Categories, Tasks & Tags');
    console.log('----------------------------------------\n');

    // Collect all categories, tasks, and tags with counts
    const categoryCount = {};
    const taskCount = {};
    const tagCount = {};

    for (const tool of allTools) {
        // Count categories
        if (tool.category_name && Array.isArray(tool.category_name)) {
            for (const cat of tool.category_name) {
                if (cat && cat.trim()) {
                    const name = cat.trim();
                    categoryCount[name] = (categoryCount[name] || 0) + 1;
                }
            }
        }

        // Count tasks
        if (tool.task_name && Array.isArray(tool.task_name)) {
            for (const task of tool.task_name) {
                if (task && task.trim()) {
                    const name = task.trim();
                    taskCount[name] = (taskCount[name] || 0) + 1;
                }
            }
        }

        // Count tags
        if (tool.tags && Array.isArray(tool.tags)) {
            for (const tag of tool.tags) {
                if (tag && tag.trim()) {
                    const name = tag.trim();
                    tagCount[name] = (tagCount[name] || 0) + 1;
                }
            }
        }
    }

    const categories = Object.entries(categoryCount).map(([name, count]) => ({
        category_name: name,
        count: count,
        created_at: new Date().toISOString(),
    }));

    const tasks = Object.entries(taskCount).map(([name, count]) => ({
        task_name: name,
        count: count,
        created_at: new Date().toISOString(),
    }));

    const tags = Object.entries(tagCount).map(([name, count]) => ({
        tag_name: name,
        count: count,
        created_at: new Date().toISOString(),
    }));

    console.log(`Found ${categories.length} unique categories`);
    console.log(`Found ${tasks.length} unique tasks`);
    console.log(`Found ${tags.length} unique tags`);

    if (options.dryRun) {
        console.log('\n[DRY RUN] Would sync categories, tasks, and tags');
        console.log('Categories:', categories.map(c => `${c.category_name} (${c.count})`).slice(0, 10).join(', '), '...');
        console.log('Tasks:', tasks.map(t => `${t.task_name} (${t.count})`).slice(0, 10).join(', '), '...');
        console.log('Tags:', tags.map(t => `${t.tag_name} (${t.count})`).slice(0, 10).join(', '), '...');
        return;
    }

    // Insert categories (delete existing first to avoid duplicates)
    if (categories.length > 0) {
        console.log('\nInserting categories...');
        // Delete existing categories with same names
        const catNames = categories.map(c => c.category_name);
        await supabase.from('categories').delete().in('category_name', catNames);

        const { error: catError } = await supabase
            .from('categories')
            .insert(categories);

        if (catError) {
            console.error(`  Categories error: ${catError.message}`);
        } else {
            console.log(`  Categories synced: ${categories.length}`);
        }
    }

    // Insert tasks (delete existing first to avoid duplicates)
    if (tasks.length > 0) {
        console.log('Inserting tasks...');
        // Delete existing tasks with same names
        const taskNames = tasks.map(t => t.task_name);
        await supabase.from('tasks').delete().in('task_name', taskNames);

        const { error: taskError } = await supabase
            .from('tasks')
            .insert(tasks);

        if (taskError) {
            console.error(`  Tasks error: ${taskError.message}`);
        } else {
            console.log(`  Tasks synced: ${tasks.length}`);
        }
    }

    // Insert tags (delete existing first to avoid duplicates)
    if (tags.length > 0) {
        console.log('Inserting tags...');
        // Delete existing tags with same names
        const tagNames = tags.map(t => t.tag_name);
        await supabase.from('tags').delete().in('tag_name', tagNames);

        const { error: tagError } = await supabase
            .from('tags')
            .insert(tags);

        if (tagError) {
            console.error(`  Tags error: ${tagError.message}`);
        } else {
            console.log(`  Tags synced: ${tags.length}`);
        }
    }
}

// ============== Main Import Function ==============

async function importCSV() {
    const options = parseArgs();

    console.log('\n========================================');
    console.log(' AIBDE CSV Import Tool');
    console.log('========================================\n');
    console.log('Options:', options);
    console.log('');

    // Validate environment
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('ERROR: Supabase credentials not found in .env.local');
        process.exit(1);
    }

    if (!options.skipLogos && (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID)) {
        console.error('ERROR: R2 credentials not found. Use --skip-logos to skip cloud upload.');
        process.exit(1);
    }

    // Read CSV file
    console.log(`Reading CSV from: ${CSV_PATH}`);
    if (!fs.existsSync(CSV_PATH)) {
        console.error(`ERROR: CSV file not found at ${CSV_PATH}`);
        process.exit(1);
    }

    const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
    const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
    });

    console.log(`Found ${records.length} rows in CSV\n`);

    // Apply start and limit
    let toProcess = records.slice(options.start);
    if (options.limit) {
        toProcess = toProcess.slice(0, options.limit);
    }

    console.log(`Processing rows ${options.start} to ${options.start + toProcess.length - 1}\n`);

    // Process rows
    const allProcessedTools = []; // Keep track of all tools for category/task sync
    const processedTools = [];
    let logoSuccessCount = 0;
    let logoFailCount = 0;

    for (let i = 0; i < toProcess.length; i++) {
        const row = toProcess[i];
        const rowNum = options.start + i + 1;

        console.log(`[${rowNum}/${records.length}] ${row.name}`);

        // Process logo
        let cloudLogoUrl = null;
        if (row.logo_url && row.logo_url.trim()) {
            cloudLogoUrl = await processLogo(row.logo_url, row.app_username || generateSlug(row.name), options);
            if (cloudLogoUrl && cloudLogoUrl.startsWith(CDN_URL)) {
                logoSuccessCount++;
            } else if (row.logo_url.trim()) {
                logoFailCount++;
            }
        }

        // Transform row to DB format
        const dbTool = transformRowToDbTool(row, cloudLogoUrl);
        processedTools.push(dbTool);
        allProcessedTools.push(dbTool);

        // Insert in batches
        if (processedTools.length >= BATCH_SIZE) {
            console.log(`\n  Inserting batch of ${processedTools.length} tools...`);
            const result = await insertBatch(processedTools, options);
            console.log(`  Inserted: ${result.inserted}`);
            processedTools.length = 0; // Clear array
            console.log('');
        }
    }

    // Insert remaining tools
    if (processedTools.length > 0) {
        console.log(`\n  Inserting final batch of ${processedTools.length} tools...`);
        const result = await insertBatch(processedTools, options);
        console.log(`  Inserted: ${result.inserted}`);
    }

    // Sync categories and tasks tables
    await syncCategoriesAndTasks(allProcessedTools, options);

    // Summary
    console.log('\n========================================');
    console.log(' Import Complete');
    console.log('========================================');
    console.log(`Total processed: ${toProcess.length}`);
    console.log(`Logos uploaded to cloud: ${logoSuccessCount}`);
    console.log(`Logos failed/skipped: ${logoFailCount}`);
    if (options.dryRun) {
        console.log('\n[DRY RUN] No data was actually inserted.');
    }
    console.log('');
}

// Run the import
importCSV().catch(error => {
    console.error('Import failed:', error);
    process.exit(1);
});

