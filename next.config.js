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
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
    },
    {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=()',
    },
    {
        key: 'Content-Security-Policy',
        value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://*.clerk.accounts.dev https://clerk.aibde.tech https://us-assets.i.posthog.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: blob: https:",
            "connect-src 'self' https://*.supabase.co https://challenges.cloudflare.com https://*.clerk.accounts.dev https://clerk.aibde.tech https://*.upstash.io https://us.i.posthog.com https://us.posthog.com",
            "frame-src https://challenges.cloudflare.com https://*.clerk.accounts.dev",
            "worker-src 'self' blob:",
            "object-src 'none'",
            "base-uri 'self'",
        ].join('; '),
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
            throw new Error('Could not find SVG file loader rule in webpack config');
        }

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
                resourceQuery: { not: [...(Array.isArray(fileLoaderRule.resourceQuery?.not) ? fileLoaderRule.resourceQuery.not : []), /url/] },
                use: ['@svgr/webpack'],
            }
        );

        // Modify the existing rule to exclude *.svg
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
            { protocol: 'https', hostname: 'cdn.aibde.tech' },
            { protocol: 'https', hostname: 'pub-1585beb392424c639abc85d5b9baf9be.r2.dev' },
            { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
            { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
            { protocol: 'https', hostname: 'asset.brandfetch.io' },
            { protocol: 'https', hostname: 'img.clerk.com' },
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
