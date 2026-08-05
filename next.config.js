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
            "default-src 'self' https://challenges.cloudflare.com",
            // 'unsafe-inline': Required by Next.js for inline scripts during page hydration
            // 'unsafe-eval': Only needed in development for Next.js HMR; Clerk SDK/PostHog work without it in production
            `script-src 'self' 'unsafe-inline' ${process.env.NODE_ENV !== 'production' ? "'unsafe-eval' " : ''}https://challenges.cloudflare.com https://*.clerk.accounts.dev https://clerk.browseforai.com https://us-assets.i.posthog.com https://www.googletagmanager.com https://www.google-analytics.com https://static.cloudflareinsights.com https://www.clarity.ms https://*.clarity.ms`,
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: blob: https:",
            "connect-src 'self' https://*.supabase.co https://challenges.cloudflare.com https://*.clerk.accounts.dev https://clerk.browseforai.com https://*.upstash.io https://us.i.posthog.com https://us.posthog.com https://us-assets.i.posthog.com https://www.google-analytics.com https://www.googletagmanager.com https://cloudflareinsights.com https://www.clarity.ms https://*.clarity.ms https://live.dodopayments.com https://test.dodopayments.com",
            "frame-src 'self' https://challenges.cloudflare.com https://*.clerk.accounts.dev https://www.youtube.com https://drive.google.com",
            "worker-src 'self' blob:",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'none'",
            "upgrade-insecure-requests",
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
        // Packages that use Node.js native streams (kState/TransformStream internals)
        // must run natively — bundling them causes "transformAlgorithm is not a function"
        'file-type',
        'sharp',
        '@aws-sdk/client-s3',
        'csv-parse',
    ],
    images: {
        domains: [],
        remotePatterns: [
            { protocol: 'https', hostname: 'cdn.browseforai.com' },
            { protocol: 'https', hostname: 'pub-1585beb392424c639abc85d5b9baf9be.r2.dev' },
            { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
            { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
            { protocol: 'https', hostname: 'asset.brandfetch.io' },
            { protocol: 'https', hostname: 'img.clerk.com' },
            { protocol: 'https', hostname: 'www.youtube.com' },
            { protocol: 'https', hostname: 'drive.google.com' },

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
