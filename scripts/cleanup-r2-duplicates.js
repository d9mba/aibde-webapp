/**
 * Script to find and delete duplicate logos in R2
 * Keeps only the most recent file for each app_username
 */

require('dotenv').config({ path: '.env.local' });
const { S3Client, ListObjectsV2Command, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

const R2_BUCKET = process.env.R2_BUCKET_NAME;

async function listAllLogos() {
    const logos = [];
    let continuationToken;

    do {
        const command = new ListObjectsV2Command({
            Bucket: R2_BUCKET,
            Prefix: 'logos/',
            ContinuationToken: continuationToken,
        });

        const response = await r2Client.send(command);
        if (response.Contents) {
            logos.push(...response.Contents);
        }
        continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    return logos;
}

async function findDuplicates(logos) {
    // Group by app_username (everything before the timestamp)
    const groups = {};

    for (const logo of logos) {
        const key = logo.Key;
        // Pattern: logos/app-username-timestamp.ext
        const filename = key.replace('logos/', '');

        // Extract app_username (everything before the last dash followed by timestamp)
        const match = filename.match(/^(.+)-([a-z0-9]+)\.(webp|svg|png|jpg|jpeg|gif)$/i);
        if (match) {
            const appUsername = match[1];
            if (!groups[appUsername]) {
                groups[appUsername] = [];
            }
            groups[appUsername].push({
                key,
                lastModified: logo.LastModified,
                size: logo.Size,
            });
        }
    }

    // Find groups with more than one file
    const duplicates = [];
    for (const [appUsername, files] of Object.entries(groups)) {
        if (files.length > 1) {
            // Sort by lastModified, keep the newest
            files.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
            // Mark all but the first (newest) as duplicates
            duplicates.push({
                appUsername,
                keep: files[0],
                toDelete: files.slice(1),
            });
        }
    }

    return duplicates;
}

async function deleteDuplicates(duplicates, dryRun = true) {
    let deletedCount = 0;
    let savedBytes = 0;

    for (const { appUsername, keep, toDelete } of duplicates) {
        console.log(`\n${appUsername}:`);
        console.log(`  Keep: ${keep.key} (${new Date(keep.lastModified).toISOString()})`);

        for (const file of toDelete) {
            console.log(`  Delete: ${file.key} (${new Date(file.lastModified).toISOString()}, ${(file.size / 1024).toFixed(1)}KB)`);

            if (!dryRun) {
                const command = new DeleteObjectCommand({
                    Bucket: R2_BUCKET,
                    Key: file.key,
                });
                await r2Client.send(command);
            }

            deletedCount++;
            savedBytes += file.size;
        }
    }

    return { deletedCount, savedBytes };
}

async function main() {
    const dryRun = !process.argv.includes('--delete');

    console.log('='.repeat(50));
    console.log(' R2 Duplicate Logo Cleanup');
    console.log('='.repeat(50));
    console.log(`Mode: ${dryRun ? 'DRY RUN (use --delete to actually delete)' : 'DELETE MODE'}\n`);

    console.log('Listing all logos in R2...');
    const logos = await listAllLogos();
    console.log(`Found ${logos.length} files in logos/ folder\n`);

    console.log('Finding duplicates...');
    const duplicates = await findDuplicates(logos);

    if (duplicates.length === 0) {
        console.log('No duplicates found!');
        return;
    }

    console.log(`Found ${duplicates.length} app(s) with duplicate logos:`);

    const { deletedCount, savedBytes } = await deleteDuplicates(duplicates, dryRun);

    console.log('\n' + '='.repeat(50));
    console.log(` Summary`);
    console.log('='.repeat(50));
    console.log(`Duplicates found: ${deletedCount}`);
    console.log(`Space to recover: ${(savedBytes / 1024).toFixed(1)}KB`);

    if (dryRun) {
        console.log('\nRun with --delete to actually remove duplicates');
    } else {
        console.log(`\nDeleted ${deletedCount} duplicate files`);
    }
}

main().catch(console.error);
