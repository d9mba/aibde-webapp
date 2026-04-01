import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';

// Validate R2 configuration
const r2AccountId = process.env.R2_ACCOUNT_ID;
const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID;
const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME || '';
const publicUrl = process.env.R2_DEV_URL || '';

// Warn if R2 is not configured (but don't throw - storage is optional)
if (!r2AccountId || !r2AccessKeyId || !r2SecretAccessKey || !bucketName) {
    console.warn(
        '[Storage] R2 storage not fully configured. File uploads will fail. ' +
        'Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME.'
    );
}

// Configure S3 client for Cloudflare R2
const r2Client = new S3Client({
    region: 'auto',
    endpoint: r2AccountId ? `https://${r2AccountId}.r2.cloudflarestorage.com` : undefined,
    credentials: {
        accessKeyId: r2AccessKeyId || '',
        secretAccessKey: r2SecretAccessKey || '',
    },
});

/**
 * Upload a file to Cloudflare R2
 * @param file - File buffer or Blob
 * @param path - Path in bucket (e.g., 'logos/my-tool.png')
 * @param contentType - MIME type
 * @returns Public URL of uploaded file
 */
export async function uploadFile(
    file: Buffer | Uint8Array,
    path: string,
    contentType: string
): Promise<string> {
    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: path,
        Body: file,
        ContentType: contentType,
    });

    await r2Client.send(command);

    return `${publicUrl}/${path}`;
}

/**
 * Delete a file from Cloudflare R2
 * @param path - Path in bucket
 */
export async function deleteFile(path: string): Promise<void> {
    const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: path,
    });

    await r2Client.send(command);
}

/**
 * Get the public URL for a file path
 * @param path - Path in bucket
 * @returns Public URL
 */
export function getPublicUrl(path: string): string {
    return `${publicUrl}/${path}`;
}

/**
 * Extract the path from a public URL (supports both R2 and CDN URLs)
 * @param url - Full public URL
 * @returns Path in bucket
 */
export function getPathFromUrl(url: string): string | null {
    // Check R2 public URL
    if (url.startsWith(publicUrl)) {
        return url.replace(`${publicUrl}/`, '');
    }
    // Check CDN URL (files uploaded via CDN but stored in R2)
    const cdnUrl = process.env.NEXT_PUBLIC_CDN_URL || '';
    if (cdnUrl && url.startsWith(cdnUrl)) {
        return url.replace(`${cdnUrl}/`, '');
    }
    return null;
}

/**
 * Generate a unique filename
 * @param originalName - Original filename
 * @returns Unique filename with timestamp
 */
export function generateUniqueFilename(originalName: string): string {
    const ext = originalName.split('.').pop() || 'bin';
    const timestamp = Date.now();
    // SEC-02: Use crypto-secure random bytes instead of Math.random()
    const random = crypto.randomBytes(6).toString('hex');
    return `${timestamp}-${random}.${ext}`;
}
