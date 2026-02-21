import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.aibde.tech';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/dashboard/', '/api/', '/_next/', '/search'],
            },
        ],
        sitemap: `${BASE_URL}/sitemap-index.xml`,
    };
}
