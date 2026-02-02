import { NextResponse } from 'next/server';

// Note: This must be PostHog's actual API endpoint, NOT the proxy/ingestion URL
const POSTHOG_API_HOST = 'https://app.posthog.com';
const POSTHOG_API_KEY = process.env.POSTHOG_PERSONAL_API_KEY;
const POSTHOG_PROJECT_ID = process.env.POSTHOG_PROJECT_ID;

interface HogQLQueryResponse {
    results: unknown[][];
    columns: string[];
}

/**
 * GET /api/public/impressions
 * Public endpoint to get tool impression counts
 * No authentication required - returns only aggregate counts
 */
export async function GET() {
    if (!POSTHOG_API_KEY || !POSTHOG_PROJECT_ID) {
        return NextResponse.json({ impressions: {} });
    }

    const hogqlQuery = `
        SELECT 
            properties.tool_slug as tool_slug,
            countIf(event = 'tool_impression') as impressions
        FROM events
        WHERE 
            timestamp >= now() - interval 365 day
            AND event = 'tool_impression'
            AND properties.tool_slug IS NOT NULL
        GROUP BY properties.tool_slug
        ORDER BY impressions DESC
        LIMIT 500
    `;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(`${POSTHOG_API_HOST}/api/projects/${POSTHOG_PROJECT_ID}/query/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${POSTHOG_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: {
                    kind: 'HogQLQuery',
                    query: hogqlQuery,
                },
            }),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            return NextResponse.json({ impressions: {} });
        }

        const data: HogQLQueryResponse = await response.json();

        // Check if PostHog returned an error in the body
        if ((data as any).error) {
            return NextResponse.json({ impressions: {} });
        }

        const impressions: Record<string, number> = {};
        data.results.forEach((row) => {
            const slug = row[0] as string;
            const count = row[1] as number;
            if (slug) {
                impressions[slug] = count || 0;
            }
        });

        return NextResponse.json({ impressions }, {
            headers: {
                'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
            },
        });
    } catch {
        return NextResponse.json({ impressions: {} });
    }
}
