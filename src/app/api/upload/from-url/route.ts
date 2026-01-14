import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { uploadFile, generateUniqueFilename } from '@/services/storage.service';
import sharp from 'sharp';

// Block private/internal IP ranges to prevent SSRF
function isPrivateUrl(urlString: string): boolean {
    try {
        const url = new URL(urlString);
        const hostname = url.hostname.toLowerCase();

        // Block localhost variants
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
            return true;
        }

        // Block private IP ranges
        const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
        if (ipv4Match) {
            const [, a, b] = ipv4Match.map(Number);
            // 10.x.x.x, 172.16-31.x.x, 192.168.x.x, 169.254.x.x (link-local)
            if (a === 10 || (a === 172 && b >= 16 && b <= 31) ||
                (a === 192 && b === 168) || (a === 169 && b === 254) ||
                a === 0 || a === 127) {
                return true;
            }
        }

        // Block internal hostnames
        if (hostname.endsWith('.local') || hostname.endsWith('.internal') ||
            hostname.includes('metadata') || hostname.includes('169.254.169.254')) {
            return true;
        }

        return false;
    } catch {
        return true; // Block invalid URLs
    }
}

// Compress image while maintaining quality
async function compressImage(input: Uint8Array, mimeType: string): Promise<Uint8Array> {
    if (mimeType === 'image/gif') {
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

// POST /api/upload/from-url - Download image from URL and upload to R2 (PROTECTED)
export async function POST(request: NextRequest) {
    try {
        // SECURITY: Require authentication
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { url, type = 'logo', name = '' } = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
        }

        // Validate URL format
        let parsedUrl: URL;
        try {
            parsedUrl = new URL(url);
        } catch {
            return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
        }

        // SECURITY: Block private/internal URLs to prevent SSRF
        if (isPrivateUrl(url)) {
            return NextResponse.json({ error: 'Invalid URL: internal addresses not allowed' }, { status: 400 });
        }

        // SECURITY: Only allow http/https protocols
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            return NextResponse.json({ error: 'Invalid URL: only HTTP/HTTPS allowed' }, { status: 400 });
        }

        // Fetch image from URL (server-side, bypasses CORS)
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

        let response: Response;
        try {
            response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                },
                signal: controller.signal,
                redirect: 'follow',
            });
        } finally {
            clearTimeout(timeout);
        }

        if (!response.ok) {
            return NextResponse.json({ error: 'Failed to fetch image from URL' }, { status: 400 });
        }

        const contentType = response.headers.get('content-type') || 'image/jpeg';

        // SECURITY: Validate content type - SVG REMOVED (XSS risk)
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        const isValidType = allowedTypes.some(t => contentType.includes(t));
        if (!isValidType) {
            return NextResponse.json({ error: 'URL does not point to a valid image (JPEG, PNG, GIF, WebP only)' }, { status: 400 });
        }

        // Check content-length header first if available
        const contentLength = response.headers.get('content-length');
        if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
            return NextResponse.json({ error: 'Image too large (max 10MB)' }, { status: 400 });
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
