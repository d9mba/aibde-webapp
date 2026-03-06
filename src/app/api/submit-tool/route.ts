import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, rateLimits, getClientIp } from '@/lib/rate-limit';
import { verifyTurnstile } from '@/lib/turnstile';

const GOOGLE_APPS_SCRIPT_URL = process.env.GOOGLE_APPS_SCRIPT_TOOL_SUBMISSIONS_URL || '';

const MAX_LEN = { name: 100, email: 254, toolName: 200, url: 500, shortDesc: 1000, longDesc: 5000, tags: 500, features: 2000 };

interface SocialLink {
    platform: string;
    url: string;
}

interface ToolSubmissionData {
    // Submitter info
    submitterName: string;
    submitterEmail: string;

    // Basic tool info
    toolName: string;
    toolUrl: string;
    shortDescription: string;
    longDescription?: string;

    // Classification
    pricing?: string;
    releasedDate?: string;
    tags?: string;
    features?: string;

    // Affiliate
    hasAffiliateProgram?: boolean;
    affiliateUrl?: string;

    // Social & Media
    socialLinks?: SocialLink[];
    imageUrls?: string;
    videoUrls?: string;

    // Security
    turnstileToken: string;

    // Legacy field (for backward compatibility)
    description?: string;
}



export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const identifier = getClientIp(request);
        const rateLimit = await checkRateLimit(`submit:${identifier}`, rateLimits.sensitive);
        if (!rateLimit.success) {
            return NextResponse.json(
                { error: 'Too many submissions. Try again later.' },
                { status: 429, headers: { 'Retry-After': String(Math.max(1, Math.ceil((rateLimit.resetTime - Date.now()) / 1000))) } }
            );
        }

        const body: ToolSubmissionData = await request.json();

        if (!body.submitterName || !body.submitterEmail || !body.toolName || !body.toolUrl || !body.shortDescription) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        if (body.submitterName.length > MAX_LEN.name) {
            return NextResponse.json({ error: 'Submitter name too long' }, { status: 400 });
        }
        if (body.submitterEmail.length > MAX_LEN.email) {
            return NextResponse.json({ error: 'Email too long' }, { status: 400 });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.submitterEmail)) {
            return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
        }
        const lengthErrors: string[] = [];
        if (body.toolName.length > MAX_LEN.toolName) lengthErrors.push('Tool name too long');
        if (body.toolUrl.length > MAX_LEN.url) lengthErrors.push('Tool URL too long');
        if (lengthErrors.length > 0) {
            return NextResponse.json({ error: lengthErrors.join('; ') }, { status: 400 });
        }
        if (body.shortDescription.length > MAX_LEN.shortDesc) {
            return NextResponse.json({ error: 'Short description too long' }, { status: 400 });
        }
        if (body.longDescription && body.longDescription.length > MAX_LEN.longDesc) {
            return NextResponse.json({ error: 'Long description too long' }, { status: 400 });
        }
        if (body.tags && body.tags.length > MAX_LEN.tags) {
            return NextResponse.json({ error: 'Tags too long' }, { status: 400 });
        }
        if (body.features && body.features.length > MAX_LEN.features) {
            return NextResponse.json({ error: 'Features too long' }, { status: 400 });
        }

        if (!body.turnstileToken) {
            return NextResponse.json(
                { error: 'Security verification required' },
                { status: 400 }
            );
        }

        const isTurnstileValid = await verifyTurnstile(body.turnstileToken);
        if (!isTurnstileValid) {
            return NextResponse.json(
                { error: 'Security verification failed. Please try again.' },
                { status: 400 }
            );
        }

        // Remove turnstileToken from data before saving
        const { turnstileToken: _, ...formData } = body;

        // Format social links for spreadsheet
        const socialLinksFormatted = body.socialLinks
            ?.filter(link => link.url)
            .map(link => `${link.platform}: ${link.url}`)
            .join('\n') || '';

        // Prepare data for Google Sheets
        const sheetData = {
            timestamp: new Date().toISOString(),
            status: 'pending',
            source: 'aibde-submit-form',
            submitterName: body.submitterName,
            submitterEmail: body.submitterEmail,
            toolName: body.toolName,
            toolUrl: body.toolUrl,
            shortDescription: body.shortDescription,
            longDescription: body.longDescription || '',
            pricing: body.pricing || '',
            releasedDate: body.releasedDate || '',
            tags: body.tags || '',
            features: body.features || '',
            hasAffiliateProgram: body.hasAffiliateProgram ? 'Yes' : 'No',
            affiliateUrl: body.affiliateUrl || '',
            socialLinks: socialLinksFormatted,
            imageUrls: body.imageUrls || '',
            videoUrls: body.videoUrls || '',
        };

        // If Google Apps Script URL is configured, send to Google Sheets
        // Use waitUntil to make it non-blocking (user doesn't wait for Google)
        if (GOOGLE_APPS_SCRIPT_URL) {
            // Dynamic import to avoid issues in non-Vercel environments
            import('@vercel/functions').then(({ waitUntil }) => {
                waitUntil(
                    fetch(GOOGLE_APPS_SCRIPT_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(sheetData),
                    }).catch(err => {
                        console.error('[Submit Tool API] Background Google Sheets sync failed:', err);
                    })
                );
            }).catch(() => {
                // Fallback for non-Vercel environments (development)
                fetch(GOOGLE_APPS_SCRIPT_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(sheetData),
                }).catch(err => {
                    console.error('[Submit Tool API] Google Sheets sync failed:', err);
                });
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Tool submitted successfully! We\'ll review it soon.',
        });

    } catch (err) {
        console.error('[Submit Tool API] Error:', err);
        return NextResponse.json(
            { error: 'Failed to process submission' },
            { status: 500 }
        );
    }
}
