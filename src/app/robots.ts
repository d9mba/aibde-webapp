import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.browseforai.com';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/dashboard', '/api', '/_next', '/search', '/login', '/submit/result', '/go'],
            },
        ],
        sitemap: `${BASE_URL}/sitemap-index.xml`,
    };
}
