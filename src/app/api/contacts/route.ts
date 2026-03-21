import { NextResponse } from 'next/server';
import { requireAdmin, isAuthError } from '@/lib/auth-utils';

const GOOGLE_APPS_SCRIPT_URL = process.env.GOOGLE_APPS_SCRIPT_CONTACT_URL || '';

export interface ContactSubmission {
    id: number;
    timestamp: string;
    firstName: string;
    lastName: string;
    email: string;
    company: string;
    phone: string;
    toolUrl: string;
    reason: string;
    query: string;
    status: string;
    repliedDate: string;
    notes: string;
}

export async function GET() {
    // Check admin access
    const authResult = await requireAdmin();
    if (isAuthError(authResult)) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    if (!GOOGLE_APPS_SCRIPT_URL) {
        return NextResponse.json({ error: 'URL not configured', data: [] });
    }

    try {
        // Simple fetch - let Node handle redirects
        const res = await fetch(GOOGLE_APPS_SCRIPT_URL);
        const text = await res.text();

        // Try to parse as JSON
        if (text.startsWith('[') || text.startsWith('{')) {
            const contacts = JSON.parse(text) as ContactSubmission[];
            contacts.sort((a, b) =>
                new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
            );
            return NextResponse.json({ data: contacts });
        }

        // Not JSON - return error with details
        return NextResponse.json({
            error: 'Invalid response from Apps Script',
            debug: text.substring(0, 200),
            data: []
        });
    } catch (err) {
        return NextResponse.json({
            error: err instanceof Error ? err.message : 'Fetch failed',
            data: []
        });
    }
}
