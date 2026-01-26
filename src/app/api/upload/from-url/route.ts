import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { uploadFile, generateUniqueFilename } from '@/services/storage.service';
import sharp from 'sharp';
import dns from 'dns/promises';

// Block private/internal IP ranges to prevent SSRF
function isPrivateIP(ip: string): boolean {
    // Block private IP ranges (10.x, 192.168.x, 127.x, 172.16-31.x, 0.x, 169.254.x, ::1)
    if (/^(127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|0\.|169\.254\.|::1|fc00:|fe80:)/.test(ip)) {
        return true;
    }
    return false;
}

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

// SECURITY: Resolve DNS and check if IP is private (prevents DNS rebinding)
async function validateHostname(hostname: string): Promise<void> {
    try {
        const { address } = await dns.lookup(hostname);
        if (isPrivateIP(address)) {
            throw new Error('Internal IP blocked');
        }
    } catch (e) {
        if (e instanceof Error && e.message === 'Internal IP blocked') {
            throw e;
        }
        throw new Error('DNS resolution failed or blocked');
    }
}

async function compressImage(input: Uint8Array, mimeType: string): Promise<Uint8Array> {
    // SVG and GIF are not compressed
    if (mimeType === 'image/gif' || mimeType === 'image/svg+xml') {
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
    // Import rate limiter at runtime to avoid edge compatibility issues
    const { checkRateLimit, rateLimits } = await import('@/lib/rate-limit');

    try {
        // SECURITY: Require authentication
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // SECURITY: Rate limiting - 10 uploads per minute per user
        const rateLimit = await checkRateLimit(`upload:${userId}`, rateLimits.upload);
        if (!rateLimit.success) {
            return NextResponse.json(
                { error: 'Rate limit exceeded. Please wait before uploading more.' },
                { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)) } }
            );
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

        // SECURITY: Validate hostname via DNS resolution to prevent DNS rebinding attacks
        try {
            await validateHostname(parsedUrl.hostname);
        } catch (e) {
            console.error(`[Security] SSRF blocked: ${e instanceof Error ? e.message : 'Unknown error'} for URL: ${url}`);
            return NextResponse.json({ error: 'Invalid URL: blocked for security reasons' }, { status: 400 });
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
                // SECURITY: Disable automatic redirects to prevent redirect-based SSRF
                redirect: 'error',
            });
        } catch (fetchError) {
            // Handle redirect errors specifically
            if (fetchError instanceof Error && fetchError.message.includes('redirect')) {
                return NextResponse.json({ error: 'URL redirects are not allowed for security reasons' }, { status: 400 });
            }
            throw fetchError;
        } finally {
            clearTimeout(timeout);
        }

        if (!response.ok) {
            return NextResponse.json({ error: 'Failed to fetch image from URL' }, { status: 400 });
        }

        const contentType = response.headers.get('content-type') || 'image/jpeg';

        // SECURITY: Validate content type - SVG allowed (safe when served from CDN with proper headers)
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
        const isValidType = allowedTypes.some(t => contentType.includes(t));
        if (!isValidType) {
            return NextResponse.json({ error: 'URL does not point to a valid image (JPEG, PNG, GIF, WebP, SVG only)' }, { status: 400 });
        }

        // Check content-length header first if available
        const contentLength = response.headers.get('content-length');
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (contentLength && parseInt(contentLength) > maxSize) {
            return NextResponse.json({ error: 'Image too large (max 10MB)' }, { status: 400 });
        }

        // SECURITY: Stream the body with size limit to prevent memory exhaustion (DoS)
        // This protects against zip bombs and fake Content-Length headers
        const reader = response.body?.getReader();
        if (!reader) {
            return NextResponse.json({ error: 'Failed to read response body' }, { status: 500 });
        }

        const chunks: Uint8Array[] = [];
        let totalSize = 0;

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                totalSize += value.length;

                // SECURITY: Abort immediately if size exceeds limit
                if (totalSize > maxSize) {
                    reader.cancel();
                    return NextResponse.json({ error: 'Image too large (max 10MB)' }, { status: 400 });
                }

                chunks.push(value);
            }
        } finally {
            reader.releaseLock();
        }

        // Combine chunks into single buffer
        const originalBuffer = new Uint8Array(totalSize);
        let offset = 0;
        for (const chunk of chunks) {
            originalBuffer.set(chunk, offset);
            offset += chunk.length;
        }
        const originalSize = totalSize;

        // Compress image (skip SVG and GIF)
        const isCompressible = contentType.startsWith('image/') && !contentType.includes('svg') && !contentType.includes('gif');
        const processedBuffer = isCompressible
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
