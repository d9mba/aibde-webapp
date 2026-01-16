import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const POSTHOG_HOST = 'https://app.posthog.com';
const POSTHOG_API_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;

/**
 * GET /go/[slug] - Redirect to tool website with tracking
 * 
 * - Affiliate enabled: Redirect to affiliate URL (no UTM params)
 * - Non-affiliate: Redirect to website URL with UTM params
 * - Tracks outbound click in PostHog (server-side)
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;

    if (!slug) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    try {
        // Fetch tool by slug
        const { data: tool, error } = await supabaseAdmin
            .from('tools')
            .select('id, name, website_url, affiliate_url, affiliate_enabled')
            .eq('app_username', slug)
            .eq('status', 'published')
            .single();

        if (error) {
            console.error('[/go] Error fetching tool:', error);
            return NextResponse.redirect(new URL('/', request.url));
        }

        if (!tool) {
            console.error('[/go] Tool not found for slug:', slug);
            return NextResponse.redirect(new URL('/', request.url));
        }

        let redirectUrl: string;
        let isAffiliate = false;

        if (tool.affiliate_enabled && tool.affiliate_url) {
            // Affiliate link - use as-is (no UTM params)
            redirectUrl = tool.affiliate_url;
            isAffiliate = true;
        } else if (tool.website_url) {
            // Non-affiliate - add UTM params
            redirectUrl = addUtmParams(tool.website_url);
        } else {
            // No URL found - redirect to tool page
            return NextResponse.redirect(new URL(`/app/${slug}`, request.url));
        }

        // Ensure URL has protocol
        if (!redirectUrl.startsWith('http://') && !redirectUrl.startsWith('https://')) {
            redirectUrl = `https://${redirectUrl}`;
        }

        // Track outbound click in PostHog (server-side, fire-and-forget)
        trackOutboundClick({
            toolId: tool.id,
            toolName: tool.name,
            toolSlug: slug,
            destinationUrl: redirectUrl,
            isAffiliate,
            isPremium: false, // TODO: add back when premium column exists
            userAgent: request.headers.get('user-agent') || '',
            referer: request.headers.get('referer') || '',
        });

        // Redirect with 302 (temporary)
        return NextResponse.redirect(redirectUrl, 302);

    } catch {
        // Error - redirect to homepage
        return NextResponse.redirect(new URL('/', request.url));
    }
}

/**
 * Track outbound click in PostHog (server-side)
 */
async function trackOutboundClick(data: {
    toolId: string;
    toolName: string;
    toolSlug: string;
    destinationUrl: string;
    isAffiliate: boolean;
    isPremium: boolean;
    userAgent: string;
    referer: string;
}) {
    if (!POSTHOG_API_KEY) return;

    try {
        await fetch(`${POSTHOG_HOST}/capture/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                api_key: POSTHOG_API_KEY,
                event: 'outbound_redirect',
                distinct_id: `server_${Date.now()}`,
                properties: {
                    tool_id: data.toolId,
                    tool_name: data.toolName,
                    tool_slug: data.toolSlug,
                    destination_url: data.destinationUrl,
                    is_affiliate: data.isAffiliate,
                    is_premium: data.isPremium,
                    $current_url: `/go/${data.toolSlug}`,
                    $referrer: data.referer,
                    $user_agent: data.userAgent,
                },
            }),
        });
    } catch {
        // Silently fail - don't block redirect
    }
}

/**
 * Add UTM tracking parameters to URL
 */
function addUtmParams(url: string): string {
    try {
        const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
        urlObj.searchParams.set('ref', 'aibde');
        urlObj.searchParams.set('utm_source', 'aibde');
        urlObj.searchParams.set('utm_medium', 'referral');
        return urlObj.toString();
    } catch {
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}ref=aibde&utm_source=aibde&utm_medium=referral`;
    }
}
