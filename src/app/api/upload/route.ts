import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isAuthError } from '@/lib/auth-utils';
import { uploadFile, generateUniqueFilename } from '@/services/storage.service';
import sharp from 'sharp';

// Compress image while maintaining quality - converts to WebP for best compression
async function compressImage(buffer: Buffer, mimeType: string): Promise<{ buffer: Buffer; mimeType: string }> {
    // Skip compression for SVGs and GIFs (animated GIFs don't work well with sharp)
    if (mimeType === 'image/svg+xml' || mimeType === 'image/gif') {
        return { buffer, mimeType };
    }

    const originalSize = buffer.length;

    try {
        // Get image metadata
        const metadata = await sharp(buffer).metadata();

        // Determine max dimension (resize if too large)
        const maxDimension = 2000;
        const needsResize = (metadata.width && metadata.width > maxDimension) ||
            (metadata.height && metadata.height > maxDimension);

        let sharpInstance = sharp(buffer);

        // Resize if needed
        if (needsResize) {
            sharpInstance = sharpInstance.resize(maxDimension, maxDimension, {
                fit: 'inside',
                withoutEnlargement: true,
            });
        }

        // Always try WebP first - usually gives best compression
        const webpBuffer = await sharpInstance.clone().webp({ quality: 82 }).toBuffer();

        // Also try the original format optimized
        let originalFormatBuffer: Buffer;
        if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
            originalFormatBuffer = await sharpInstance.jpeg({ quality: 85, progressive: true }).toBuffer();
        } else if (mimeType === 'image/png') {
            originalFormatBuffer = await sharpInstance.png({ compressionLevel: 9 }).toBuffer();
        } else {
            originalFormatBuffer = buffer;
        }

        // Choose the smallest result
        const candidates = [
            { buffer: webpBuffer, mimeType: 'image/webp', size: webpBuffer.length },
            { buffer: originalFormatBuffer, mimeType, size: originalFormatBuffer.length },
            { buffer, mimeType, size: originalSize }, // Original unchanged
        ];

        const best = candidates.reduce((a, b) => a.size < b.size ? a : b);
        const savings = Math.round((1 - best.size / originalSize) * 100);

        // Only use compressed if we actually saved space
        if (best.size < originalSize) {
            return { buffer: best.buffer, mimeType: best.mimeType };
        }

        return { buffer, mimeType };
    } catch (error) {
        console.error('[Compress] Failed, using original:', error);
        return { buffer, mimeType };
    }
}

// POST /api/upload - Upload file to R2 with compression (protected)
export async function POST(request: NextRequest) {
    try {
        // SECURITY: Strict Admin Check - only admins can upload
        const authResult = await requireAdmin();
        if (isAuthError(authResult)) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const uploadType = formData.get('type') as string || 'default'; // logo, image, video, or default
        const customName = formData.get('name') as string || ''; // Tool name for friendly filenames

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // SECURITY: SVG allowed (safe when served from CDN with proper Content-Type headers)
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
            'video/mp4', 'video/webm', 'video/quicktime'
        ];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({
                error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP, SVG, MP4, WebM'
            }, { status: 400 });
        }

        // Validate file size (max 50MB for videos, 10MB for images - higher since we compress)
        const isVideo = file.type.startsWith('video/');
        const isImage = file.type.startsWith('image/');
        const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json({
                error: `File too large. Maximum size: ${isVideo ? '50MB' : '10MB'}`
            }, { status: 400 });
        }

        // Convert file to buffer early for validation
        const originalBuffer = Buffer.from(await file.arrayBuffer());

        // SECURITY: Validate file content matches claimed MIME type (magic byte validation)
        const { fileTypeFromBuffer } = await import('file-type');
        const detectedType = await fileTypeFromBuffer(originalBuffer);

        if (detectedType) {
            // Check if detected MIME matches claimed type
            const claimedMime = file.type.toLowerCase();
            const detectedMime = detectedType.mime.toLowerCase();

            // Allow close matches (e.g., image/jpg vs image/jpeg)
            const normalizedClaimed = claimedMime.replace('image/jpg', 'image/jpeg');
            const normalizedDetected = detectedMime.replace('image/jpg', 'image/jpeg');

            if (normalizedClaimed !== normalizedDetected) {
                return NextResponse.json({
                    error: `File type mismatch. Claimed: ${file.type}, Detected: ${detectedType.mime}`
                }, { status: 400 });
            }
        }
        // Note: Some file types (like some videos) may not be detected - allow them through

        // Determine folder based on upload type and file type
        let folder = 'uploads';
        if (uploadType === 'logo') {
            folder = 'logos';
        } else if (uploadType === 'image' || (uploadType === 'default' && isImage && !isVideo)) {
            folder = 'images';
        } else if (isVideo || uploadType === 'video') {
            folder = 'videos';
        }

        // Generate filename - use custom name if provided, otherwise random
        const ext = file.name.split('.').pop()?.toLowerCase() || 'png';

        // SECURITY: Validate extension doesn't contain path traversal
        if (ext.includes('..') || ext.includes('/') || ext.includes('\\')) {
            return NextResponse.json({ error: 'Invalid file extension' }, { status: 400 });
        }

        let filename: string;

        if (customName) {
            // SECURITY: Create safe slug - removes all non-alphanumeric except dashes
            const slug = customName
                .toLowerCase()
                .replace(/\.\./g, '') // Remove path traversal attempts
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '')
                .slice(0, 50); // Limit length

            // SECURITY: Prevent empty slugs after sanitization
            if (!slug) {
                return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
            }

            // Add short random suffix to ensure uniqueness
            const suffix = Math.random().toString(36).slice(2, 6);
            filename = `${slug}-${suffix}.${ext}`;
        } else {
            filename = generateUniqueFilename(file.name);
        }

        let finalMimeType = file.type;

        // originalBuffer was already created earlier for magic byte validation
        const originalSize = originalBuffer.length;

        // Compress images
        let finalBuffer: Uint8Array = new Uint8Array(originalBuffer);
        if (isImage) {
            const result = await compressImage(originalBuffer, file.type);
            finalBuffer = new Uint8Array(result.buffer);

            // If format changed (e.g., PNG -> WebP), update filename and mime
            if (result.mimeType !== file.type) {
                const newExt = result.mimeType === 'image/webp' ? '.webp' :
                    result.mimeType === 'image/jpeg' ? '.jpg' :
                        result.mimeType === 'image/png' ? '.png' : '';
                if (newExt) {
                    filename = filename.replace(/\.[^.]+$/, newExt);
                    finalMimeType = result.mimeType;
                }
            }
        }

        const compressedSize = finalBuffer.length;
        const relativePath = `/${folder}/${filename}`;

        // Upload to R2
        await uploadFile(finalBuffer, `${folder}/${filename}`, finalMimeType);

        // Construct full URL using CDN_URL for production, fallback to R2_PUBLIC_URL
        const cdnUrl = process.env.NEXT_PUBLIC_CDN_URL || process.env.R2_PUBLIC_URL || '';
        const fullUrl = cdnUrl ? `${cdnUrl}/${folder}/${filename}` : relativePath;

        // Return result with full URL for display
        return NextResponse.json({
            url: fullUrl,  // Full URL for display in browser
            path: relativePath,  // Relative path for storage in DB
            filename,
            originalSize,
            compressedSize,
            compressionRatio: originalSize > 0 ? Math.round((1 - compressedSize / originalSize) * 100) : 0,
            type: finalMimeType,
        }, { status: 201 });
    } catch (err) {
        console.error('[Upload] Error:', err);
        return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }
}

// DELETE /api/upload - Delete file from R2 (protected)
export async function DELETE(request: NextRequest) {
    try {
        // SECURITY: Strict Admin Check - only admins can delete
        const authResult = await requireAdmin();
        if (isAuthError(authResult)) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { searchParams } = new URL(request.url);
        const path = searchParams.get('path');

        if (!path) {
            return NextResponse.json({ error: 'No path provided' }, { status: 400 });
        }

        // Remove leading slash if present
        const cleanPath = path.startsWith('/') ? path.slice(1) : path;

        // Import deleteFile from r2
        const { deleteFile } = await import('@/services/storage.service');
        await deleteFile(cleanPath);

        return NextResponse.json({ success: true, message: 'File deleted' });
    } catch (err) {
        console.error('[Upload] Delete error:', err);
        return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
    }
}
