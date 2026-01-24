import { NextRequest, NextResponse } from 'next/server';

// Google Apps Script Web App URL for saving to Google Sheets
const GOOGLE_APPS_SCRIPT_URL = process.env.GOOGLE_APPS_SCRIPT_URL || '';

// Cloudflare Turnstile secret key
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

// Verify Turnstile token with Cloudflare
async function verifyTurnstile(token: string): Promise<boolean> {
    if (!TURNSTILE_SECRET_KEY) {
        console.warn('[Contact API] Turnstile secret key not configured, skipping verification');
        return true; // Skip verification if not configured (for dev)
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

export async function POST(request: NextRequest) {
    try {
        const body: ContactFormData = await request.json();

        // Validate required fields
        if (!body.firstName || !body.lastName || !body.email || !body.query || !body.reason) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Verify Turnstile token
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

        // If Google Apps Script URL is configured, send to Google Sheets
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
