/** @type {import('next').NextConfig} */

// Security headers to protect against common attacks
const securityHeaders = [
    {
        key: 'X-Frame-Options',
        value: 'DENY',
    },
    {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
    },
    {
        key: 'X-XSS-Protection',
        value: '1; mode=block',
    },
    {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
    },
    {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=()',
    },
];

const nextConfig = {
    reactStrictMode: true,
    // Enable turbopack for Next.js 16+ with SVG support
    turbopack: {
        rules: {
            '*.svg': {
                loaders: ['@svgr/webpack'],
                as: '*.js',
            },
        },
    },
    // Configure webpack to handle SVG imports as React components
    webpack(config) {
        // Find and modify the existing SVG rule
        const fileLoaderRule = config.module.rules.find((rule) =>
            rule.test?.test?.('.svg')
        );

        if (!fileLoaderRule) {
            return config;
        }

        const existingNot = Array.isArray(fileLoaderRule.resourceQuery?.not)
            ? fileLoaderRule.resourceQuery.not
            : [];
        const resourceQueryNot = [...existingNot, /url/];

        config.module.rules.push(
            // Reapply existing rule for svg imports ending with ?url
            {
                ...fileLoaderRule,
                test: /\.svg$/i,
                resourceQuery: /url/, // *.svg?url
            },
            // Convert all other *.svg imports to React components
            {
                test: /\.svg$/i,
                issuer: fileLoaderRule.issuer,
                resourceQuery: { not: resourceQueryNot },
                use: ['@svgr/webpack'],
            }
        );

        fileLoaderRule.exclude = /\.svg$/i;

        return config;
    },
    // Fix ESM compatibility issues with jsdom/dompurify on Vercel serverless
    serverExternalPackages: [
        'isomorphic-dompurify',
        'dompurify',
        'jsdom',
    ],
    images: {
        domains: [],
        remotePatterns: [
            // TODO: Replace with your actual R2 bucket hostname
            {
                protocol: 'https',
                hostname: 'pub-*.r2.dev', // Cloudflare R2 buckets
            },
            // Trusted image providers
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com', // Google user avatars
            },
            {
                protocol: 'https',
                hostname: 'avatars.githubusercontent.com', // GitHub avatars
            },
            {
                protocol: 'https',
                hostname: 'asset.brandfetch.io', // Brand logos
            },
        ],
    },
    // Improve development stability
    onDemandEntries: {
        // Keep pages in memory for longer
        maxInactiveAge: 60 * 1000,
        // Number of pages to keep in memory
        pagesBufferLength: 5,
    },
    // Disable powered by header
    poweredByHeader: false,
    // Sitemap index lives at /sitemap-index.xml (metadata sitemap serves /sitemap/[id].xml only)
    async redirects() {
        return [{ source: '/sitemap.xml', destination: '/sitemap-index.xml', permanent: true }];
    },
    // Apply security headers to all routes
    async headers() {
        return [
            {
                // Apply to all routes
                source: '/:path*',
                headers: securityHeaders,
            },
        ];
    },
};

module.exports = nextConfig;
