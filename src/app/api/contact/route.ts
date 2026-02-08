import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_APPS_SCRIPT_URL = process.env.GOOGLE_APPS_SCRIPT_URL || '';
const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY || '';

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

async function verifyTurnstile(token: string): Promise<boolean> {
    if (!TURNSTILE_SECRET_KEY) {
        console.warn('[Contact API] Turnstile secret key not configured, skipping verification');
        return true;
    }

    try {
        const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                secret: TURNSTILE_SECRET_KEY,
                response: token,
            }),
        });

        const data = await response.json();
        return data.success === true;
    } catch (err) {
        console.error('[Contact API] Turnstile verification error:', err);
        return false;
    }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
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

        if (GOOGLE_APPS_SCRIPT_URL) {
            try {
                const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...formData,
                        timestamp: new Date().toISOString(),
                        source: 'aibde-contact-form',
                    }),
                });

                if (!response.ok) {
                    console.error('[Contact API] Google Apps Script error:', response.status);
                }
            } catch (err) {
                console.error('[Contact API] Failed to send to Google Apps Script:', err);
            }
        } else {
            // No Google Apps Script URL configured - form submission is lost
            // Consider adding database storage as a fallback
        }

        return NextResponse.json({
            success: true,
            message: 'Thank you for contacting us! We\'ll get back to you soon.',
        });

    } catch (err) {
        console.error('[Contact API] Error:', err);
        return NextResponse.json(
            { error: 'Failed to process form submission' },
            { status: 500 }
        );
    }
}
