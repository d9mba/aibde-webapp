import { NextRequest, NextResponse } from 'next/server';
import { uploadFile, generateUniqueFilename } from '@/services/storage.service';
import sharp from 'sharp';

// Compress image while maintaining quality
async function compressImage(input: Uint8Array, mimeType: string): Promise<Uint8Array> {
    if (mimeType === 'image/svg+xml' || mimeType === 'image/gif') {
        return input;
    }

    try {
        if (input.length < 100 * 1024) return input;

        const maxDimension = 2000;
        const metadata = await sharp(input).metadata();
        const needsResize = (metadata.width && metadata.width > maxDimension) ||
            (metadata.height && metadata.height > maxDimension);

        let sharpInstance = sharp(input);

        if (needsResize) {
            sharpInstance = sharpInstance.resize(maxDimension, maxDimension, {
                fit: 'inside',
                withoutEnlargement: true,
            });
        }

        if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
            return await sharpInstance.jpeg({ quality: 85, progressive: true }).toBuffer();
        } else if (mimeType === 'image/png') {
            return await sharpInstance.png({ quality: 85, compressionLevel: 9 }).toBuffer();
        } else if (mimeType === 'image/webp') {
            return await sharpInstance.webp({ quality: 85 }).toBuffer();
        }

        return input;
    } catch {
        return input;
    }
}

// POST /api/upload/from-url - Download image from URL and upload to R2
export async function POST(request: NextRequest) {
    try {
        const { url, type = 'logo', name = '' } = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
        }

        // Validate URL
        try {
            new URL(url);
        } catch {
            return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
        }

        // Fetch image from URL (server-side, bypasses CORS)
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
        });

        if (!response.ok) {
            return NextResponse.json({ error: 'Failed to fetch image from URL' }, { status: 400 });
        }

        const contentType = response.headers.get('content-type') || 'image/jpeg';

        // Validate content type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
        const isValidType = allowedTypes.some(t => contentType.includes(t));
        if (!isValidType) {
            return NextResponse.json({ error: 'URL does not point to a valid image' }, { status: 400 });
        }

        // Get the image buffer
        const arrayBuffer = await response.arrayBuffer();
        const originalBuffer = new Uint8Array(arrayBuffer);
        const originalSize = originalBuffer.length;

        // Validate size (max 10MB)
        if (originalSize > 10 * 1024 * 1024) {
            return NextResponse.json({ error: 'Image too large (max 10MB)' }, { status: 400 });
        }

        // Compress image
        const isImage = contentType.startsWith('image/') && !contentType.includes('svg');
        const processedBuffer = isImage
            ? await compressImage(originalBuffer, contentType)
            : originalBuffer;

        // Determine folder based on type
        const folder = type === 'logo' ? 'logos' : type === 'image' ? 'images' : 'uploads';

        // Generate filename - use custom name if provided
        const urlPath = new URL(url).pathname;
        const urlFilename = urlPath.split('/').pop() || 'image.jpg';
        const extension = urlFilename.includes('.') ? urlFilename.split('.').pop() : 'jpg';

        let filename: string;
        if (name) {
            const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
            const suffix = Math.random().toString(36).slice(2, 6);
            filename = `${slug}-${suffix}.${extension}`;
        } else {
            filename = generateUniqueFilename(`image.${extension}`);
        }
        const relativePath = `/${folder}/${filename}`;

        // Upload to R2
        await uploadFile(processedBuffer, `${folder}/${filename}`, contentType);

        // Construct full URL using CDN_URL for production, fallback to R2_PUBLIC_URL
        const cdnUrl = process.env.NEXT_PUBLIC_CDN_URL || process.env.R2_PUBLIC_URL || '';
        const fullUrl = cdnUrl ? `${cdnUrl}/${folder}/${filename}` : relativePath;

        return NextResponse.json({
            url: fullUrl,  // Full URL for display in browser
            path: relativePath,  // Relative path for storage in DB
            filename,
            originalSize,
            compressedSize: processedBuffer.length,
            compressionRatio: originalSize > 0 ? Math.round((1 - processedBuffer.length / originalSize) * 100) : 0,
            type: contentType,
            source: url,
        }, { status: 201 });

    } catch (err) {
        console.error('URL upload error:', err);
        return NextResponse.json({ error: 'Failed to process image from URL' }, { status: 500 });
    }
}
