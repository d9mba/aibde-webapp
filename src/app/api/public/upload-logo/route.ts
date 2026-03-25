import { NextRequest, NextResponse } from 'next/server';
import { uploadFile, generateUniqueFilename } from '@/services/storage.service';
import { checkRateLimit, rateLimits, getClientIp } from '@/lib/rate-limit';

// Max 5MB for submission logos
const MAX_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// POST /api/public/upload-logo — Public logo upload for tool submissions (rate-limited)
export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        // Rate limit by IP to prevent abuse - fail closed if no identifier
        const identifier = getClientIp(request);
        if (!identifier) {
            return NextResponse.json(
                { error: 'Unable to determine client IP. Try again later.' },
                { status: 429 }
            );
        }
        
        const rateLimit = await checkRateLimit(`upload-logo:${identifier}`, rateLimits.sensitive);
        if (!rateLimit.success) {
            return NextResponse.json({ error: 'Too many uploads. Try again later.' }, { status: 429 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json({ error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP, SVG' }, { status: 400 });
        }

        if (file.size > MAX_SIZE) {
            return NextResponse.json({ error: 'File too large. Maximum size: 5MB' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // Compress to WebP if possible
        let finalBuffer: Uint8Array = new Uint8Array(buffer);
        let finalMimeType = file.type;
        let filename = generateUniqueFilename(file.name);

        if (file.type !== 'image/svg+xml' && file.type !== 'image/gif') {
            try {
                const sharp = (await import('sharp')).default;
                const webpBuffer = await sharp(buffer)
                    .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
                    .webp({ quality: 82 })
                    .toBuffer();

                if (webpBuffer.length < buffer.length) {
                    finalBuffer = new Uint8Array(webpBuffer);
                    finalMimeType = 'image/webp';
                    filename = filename.replace(/\.[^.]+$/, '.webp');
                }
            } catch {
                // Compression failed, use original
            }
        }

        const folder = 'submission-logos';
        const relativePath = `/${folder}/${filename}`;

        await uploadFile(finalBuffer, `${folder}/${filename}`, finalMimeType);

        const cdnUrl = process.env.NEXT_PUBLIC_CDN_URL || process.env.R2_DEV_URL || '';
        const fullUrl = cdnUrl ? `${cdnUrl}${relativePath}` : relativePath;

        return NextResponse.json({
            path: relativePath,
            url: fullUrl,
        }, { status: 201 });
    } catch (err) {
        console.error('[Public Upload Logo] Error:', err);
        return NextResponse.json({ error: 'Failed to upload logo' }, { status: 500 });
    }
}
