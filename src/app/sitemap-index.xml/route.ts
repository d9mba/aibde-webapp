import { NextResponse } from 'next/server';
import { getAllSitemapIds } from '../sitemap';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.browseforai.com';

function escapeXml(str: string | number): string {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Sitemap index at /sitemap-index.xml — lists all sitemap URLs (static + paginated tools, categories, tasks).
 * Using a separate path avoids conflict with Next.js metadata sitemap (which serves /sitemap/[id].xml).
 * robots.txt references this URL.
 */
export async function GET(): Promise<NextResponse> {
    const ids = await getAllSitemapIds();
    const now = new Date().toISOString();
    const sitemapEntries = ids
        .map(
            (id) =>
                `  <sitemap>\n    <loc>${BASE_URL}/sitemap/${escapeXml(id)}.xml</loc>\n    <lastmod>${now}</lastmod>\n  </sitemap>`
        )
        .join('\n');

    const body = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries}
</sitemapindex>
`;

    return new NextResponse(body, {
        status: 200,
        headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        },
    });
}
