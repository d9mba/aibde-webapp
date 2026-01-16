import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isAuthError } from '@/lib/auth-utils';

const POSTHOG_HOST = 'https://app.posthog.com';
const POSTHOG_API_KEY = process.env.POSTHOG_PERSONAL_API_KEY;
const POSTHOG_PROJECT_ID = process.env.POSTHOG_PROJECT_ID;

interface HogQLQueryResponse {
    results: unknown[][];
    columns: string[];
    types: string[];
}

/**
 * POST /api/analytics/posthog - Query PostHog analytics
 * 
 * Body:
 *   - query: HogQL query string
 *   - type: 'tool_stats' | 'daily_activity' | 'hourly_activity' | 'top_tools'
 *   - toolSlug?: string (for tool-specific queries)
 */
export async function POST(request: NextRequest) {
    try {
        // SECURITY: Admin only
        const authResult = await requireAdmin();
        if (isAuthError(authResult)) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        if (!POSTHOG_API_KEY || !POSTHOG_PROJECT_ID) {
            return NextResponse.json({
                error: 'PostHog API not configured',
                details: 'Missing POSTHOG_PERSONAL_API_KEY or POSTHOG_PROJECT_ID env vars'
            }, { status: 500 });
        }

        const { type, toolSlug, days = 7 } = await request.json();

        let hogqlQuery = '';

        switch (type) {
            case 'tool_stats':
                // Get stats for a specific tool
                hogqlQuery = `
                    SELECT 
                        properties.tool_slug as tool_slug,
                        event,
                        count() as count
                    FROM events
                    WHERE 
                        timestamp >= now() - interval ${days} day
                        AND properties.tool_slug = '${toolSlug}'
                        AND event IN ('tool_impression', 'tool_clicked', 'tool_page_viewed', 'tool_website_visited')
                    GROUP BY properties.tool_slug, event
                    ORDER BY count DESC
                `;
                break;

            case 'top_tools':
                // Get top tools by impressions with avg time from tool_page_left events
                hogqlQuery = `
                    SELECT 
                        properties.tool_slug as tool_slug,
                        properties.tool_name as tool_name,
                        countIf(event = 'tool_impression') as impressions,
                        countIf(event = 'tool_clicked') as clicks,
                        countIf(event = 'tool_page_viewed') as page_views,
                        countIf(event = 'tool_website_visited') as website_visits,
                        avgIf(properties.time_spent_seconds, event = 'tool_page_left' AND properties.time_spent_seconds > 0) as avg_time_seconds
                    FROM events
                    WHERE 
                        timestamp >= now() - interval ${days} day
                        AND event IN ('tool_impression', 'tool_clicked', 'tool_page_viewed', 'tool_website_visited', 'tool_page_left')
                    GROUP BY properties.tool_slug, properties.tool_name
                    ORDER BY impressions DESC
                    LIMIT 25
                `;
                break;

            case 'daily_activity':
                // Get daily activity for last N days - count all events
                hogqlQuery = `
                    SELECT 
                        toDate(timestamp) as date,
                        count() as events
                    FROM events
                    WHERE 
                        timestamp >= now() - interval ${days} day
                    GROUP BY date
                    ORDER BY date ASC
                `;
                break;

            case 'hourly_activity':
                // Get hourly activity for last 24 hours
                hogqlQuery = `
                    SELECT 
                        toHour(timestamp) as hour,
                        count() as events
                    FROM events
                    WHERE 
                        timestamp >= now() - interval 24 hour
                    GROUP BY hour
                    ORDER BY hour ASC
                `;
                break;

            case 'avg_time_on_page':
                // Get average time spent on tool pages
                hogqlQuery = `
                    SELECT 
                        properties.tool_slug as tool_slug,
                        avg(properties.time_spent_seconds) as avg_time
                    FROM events
                    WHERE 
                        timestamp >= now() - interval ${days} day
                        AND event = 'tool_page_left'
                        AND properties.time_spent_seconds > 0
                    GROUP BY properties.tool_slug
                    ORDER BY avg_time DESC
                    LIMIT 20
                `;
                break;

            case 'category_stats':
                // Get stats by category
                hogqlQuery = `
                    SELECT 
                        properties.tool_category as category,
                        countIf(event = 'tool_impression') as impressions,
                        countIf(event = 'tool_clicked') as clicks,
                        countIf(event = 'tool_page_viewed') as page_views
                    FROM events
                    WHERE 
                        timestamp >= now() - interval ${days} day
                        AND event IN ('tool_impression', 'tool_clicked', 'tool_page_viewed')
                        AND properties.tool_category IS NOT NULL
                    GROUP BY properties.tool_category
                    ORDER BY impressions DESC
                    LIMIT 15
                `;
                break;

            case 'filter_stats':
                // Get filter usage stats (category, task, pricing clicks)
                hogqlQuery = `
                    SELECT 
                        properties.filter_type as filter_type,
                        properties.filter_value as filter_value,
                        count() as uses
                    FROM events
                    WHERE 
                        timestamp >= now() - interval ${days} day
                        AND event = 'filter_used'
                    GROUP BY properties.filter_type, properties.filter_value
                    ORDER BY uses DESC
                    LIMIT 30
                `;
                break;

            case 'search_queries':
                // Get top search queries
                hogqlQuery = `
                    SELECT 
                        properties.search_query as query,
                        count() as searches
                    FROM events
                    WHERE 
                        timestamp >= now() - interval ${days} day
                        AND event = 'search_performed'
                        AND properties.search_query IS NOT NULL
                    GROUP BY properties.search_query
                    ORDER BY searches DESC
                    LIMIT 20
                `;
                break;

            case 'summary':
                // Get overall summary stats including avg time on site and shares
                hogqlQuery = `
                    SELECT 
                        countIf(event = '$pageview') as pageviews,
                        countIf(event = 'tool_impression') as impressions,
                        countIf(event = 'tool_clicked') as clicks,
                        countIf(event = 'tool_page_viewed') as tool_views,
                        countIf(event = 'tool_website_visited') as website_visits,
                        countIf(event = 'search_performed') as searches,
                        countIf(event IN ('share_link_copied', 'share_completed', 'share_social_clicked')) as shares,
                        count(DISTINCT properties.distinct_id) as unique_visitors,
                        avgIf(properties.time_spent_seconds, event = 'tool_page_left' AND properties.time_spent_seconds > 0) as avg_time_on_site
                    FROM events
                    WHERE timestamp >= now() - interval ${days} day
                `;
                break;

            case 'realtime':
                // Get last 5 minutes activity
                hogqlQuery = `
                    SELECT 
                        event,
                        properties.tool_name as tool_name,
                        properties.tool_slug as tool_slug,
                        timestamp
                    FROM events
                    WHERE 
                        timestamp >= now() - interval 5 minute
                        AND event IN ('tool_clicked', 'tool_page_viewed', 'tool_website_visited', '$pageview')
                    ORDER BY timestamp DESC
                    LIMIT 20
                `;
                break;

            case 'referrer_stats':
                // Get traffic sources / referrers
                hogqlQuery = `
                    SELECT 
                        if(properties.$referring_domain = '', 'Direct', properties.$referring_domain) as referrer,
                        count() as visits
                    FROM events
                    WHERE 
                        timestamp >= now() - interval ${days} day
                        AND event = '$pageview'
                    GROUP BY referrer
                    ORDER BY visits DESC
                    LIMIT 15
                `;
                break;

            case 'page_urls':
                // Get most visited pages
                hogqlQuery = `
                    SELECT 
                        properties.$pathname as page,
                        count() as views
                    FROM events
                    WHERE 
                        timestamp >= now() - interval ${days} day
                        AND event = '$pageview'
                        AND properties.$pathname IS NOT NULL
                    GROUP BY properties.$pathname
                    ORDER BY views DESC
                    LIMIT 20
                `;
                break;

            default:
                return NextResponse.json({ error: 'Invalid query type' }, { status: 400 });
        }

        // Make request to PostHog API
        const response = await fetch(`${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/query/`, {
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
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[PostHog API] Error:', response.status, errorText);
            return NextResponse.json({
                error: 'PostHog API error',
                status: response.status,
                details: errorText,
            }, { status: response.status });
        }

        const data: HogQLQueryResponse = await response.json();

        // Transform results to objects
        const results = data.results.map((row) => {
            const obj: Record<string, unknown> = {};
            data.columns.forEach((col, i) => {
                obj[col] = row[i];
            });
            return obj;
        });

        return NextResponse.json({
            success: true,
            type,
            results,
            columns: data.columns,
        });

    } catch (err) {
        console.error('[PostHog API] Error:', err);
        return NextResponse.json({ error: 'Failed to query PostHog' }, { status: 500 });
    }
}
