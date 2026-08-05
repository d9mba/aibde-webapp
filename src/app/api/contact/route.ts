import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { checkRateLimit, rateLimits, getClientIp } from '@/lib/rate-limit';
import { verifyTurnstile } from '@/lib/turnstile';

const GOOGLE_APPS_SCRIPT_URL = process.env.GOOGLE_APPS_SCRIPT_CONTACT_URL || '';
const isProduction = process.env.NODE_ENV === 'production';
const effectiveFingerprintSecret = (() => {
    if (process.env.CONTACT_FINGERPRINT_SECRET) return process.env.CONTACT_FINGERPRINT_SECRET;
    if (process.env.ADMIN_LOGIN_SECRET) return process.env.ADMIN_LOGIN_SECRET;
    if (process.env.NODE_ENV === 'production') {
        throw new Error('CONTACT_FINGERPRINT_SECRET or ADMIN_LOGIN_SECRET must be set in production');
    }
    console.warn('[contact] No fingerprint secret configured — using deterministic dev-only fallback');
    return 'dev-only-fingerprint-secret-not-for-production';
})();

interface ContactFormData {
    firstName: string;
    lastName: string;
    companyName?: string;
    email: string;
    contactNumber?: string;
    toolUrl?: string;
    query: string;
    reason: string;
    turnstileToken: string;
}


export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        // Rate limiting — runs first so config probes are also rate-limited
        const ip = getClientIp(request);
        let identifier: string;
        if (ip !== 'anonymous') {
            identifier = ip;
        } else {
            // Build a fingerprint from stable request headers
            // to reduce spoofing via client-controlled headers alone
            const ua = request.headers.get('user-agent') || '';
            const lang = request.headers.get('accept-language') || '';
            const accept = request.headers.get('accept') || '';
            const chUa = request.headers.get('sec-ch-ua') || '';
            const chPlatform = request.headers.get('sec-ch-ua-platform') || '';
            const chMobile = request.headers.get('sec-ch-ua-mobile') || '';
            const raw = `${ua}|${lang}|${accept}|${chUa}|${chPlatform}|${chMobile}`;
            const digest = createHmac('sha256', effectiveFingerprintSecret).update(raw).digest('hex').slice(0, 16);
            identifier = `anon:${digest}`;
        }
        const rateLimit = await checkRateLimit(`contact:${identifier}`, rateLimits.sensitive);
        if (!rateLimit.success) {
            return NextResponse.json(
                { error: 'Too many requests. Try again later.' },
                { status: 429, headers: { 'Retry-After': String(Math.max(1, Math.ceil((rateLimit.resetTime - Date.now()) / 1000))) } }
            );
        }

        // SEC: Config check runs after rate limiting to prevent unlimited probing
        if (isProduction && !GOOGLE_APPS_SCRIPT_URL) {
            console.error('[Contact API] Required backend configuration missing');
            return NextResponse.json(
                { error: 'Service temporarily unavailable' },
                { status: 500 }
            );
        }

        const body: ContactFormData = await request.json();

        if (!body.firstName || !body.lastName || !body.email || !body.query || !body.reason) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const MAX_LEN = { name: 100, email: 254, query: 500, reason: 2000, company: 200, contactNumber: 30, toolUrl: 500 };
        if (body.firstName.length > MAX_LEN.name || body.lastName.length > MAX_LEN.name) {
            return NextResponse.json({ error: 'Name fields too long' }, { status: 400 });
        }
        if (body.email.length > MAX_LEN.email) {
            return NextResponse.json({ error: 'Email too long' }, { status: 400 });
        }
        if (body.query.length > MAX_LEN.query || body.reason.length > MAX_LEN.reason) {
            return NextResponse.json({ error: 'Message too long' }, { status: 400 });
        }
        if (body.companyName && body.companyName.length > MAX_LEN.company) {
            return NextResponse.json({ error: 'Company name too long' }, { status: 400 });
        }
        if (body.contactNumber && body.contactNumber.length > MAX_LEN.contactNumber) {
            return NextResponse.json({ error: 'Contact number too long' }, { status: 400 });
        }
        if (body.toolUrl && body.toolUrl.length > MAX_LEN.toolUrl) {
            return NextResponse.json({ error: 'Tool URL too long' }, { status: 400 });
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

        const { turnstileToken: _, ...formData } = body;

        let sheetsError = false;
        if (GOOGLE_APPS_SCRIPT_URL) {
            try {
                const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...formData,
                        timestamp: new Date().toISOString(),
                        source: 'browseforai-contact-form',
                    }),
                });

                if (!response.ok) {
                    console.error('[Contact API] Google Apps Script error:', response.status);
                    sheetsError = true;
                }
            } catch (err) {
                console.error('[Contact API] Failed to send to Google Apps Script:', err);
                sheetsError = true;
            }
        } else {
            sheetsError = true;
        }

        return NextResponse.json({
            success: !sheetsError,
            sheetsError,
            message: sheetsError
                ? 'We encountered a problem saving your message. Please try again.'
                : 'Thank you for contacting us! We\'ll get back to you soon.',
        }, { status: sheetsError ? 502 : 200 });

    } catch (err) {
        console.error('[Contact API] Error:', err);
        return NextResponse.json(
            { error: 'Failed to process form submission' },
            { status: 500 }
        );
    }
}
