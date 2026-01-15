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
