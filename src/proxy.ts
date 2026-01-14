import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Routes that need authentication (dashboard and private API routes)
const isProtectedRoute = createRouteMatcher([
    '/dashboard(.*)',
    '/api(.*)',  // SECURITY: All API routes require auth by default
])

// Public API routes that don't require auth
const isPublicApiRoute = createRouteMatcher([
    '/api/public(.*)',  // Truly public endpoints
])

// Routes where Clerk should be active (login pages)
const isAuthRoute = createRouteMatcher([
    '/login(.*)',
])

// Proxy function (renamed from middleware per Next.js 16 convention)
export const proxy = clerkMiddleware(async (auth, req) => {
    const pathname = req.nextUrl.pathname;

    // Skip auth for public API routes
    if (isPublicApiRoute(req)) {
        return; // Allow through without auth
    }

    // Apply auth to protected routes
    if (isProtectedRoute(req)) {
        const { userId } = await auth()
        if (!userId) {
            // For API routes, return 401
            if (pathname.startsWith('/api/')) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            }
            // For dashboard, redirect to homepage (keeps login secret)
            return NextResponse.redirect(new URL('/', req.url))
        }
    }

    // For all other routes (homepage, /app/*, etc.), just continue without Clerk checks
})

export const config = {
    // Only run proxy on specific routes to minimize Clerk overhead
    matcher: [
        // Dashboard routes need authentication
        '/dashboard/:path*',
        // Login routes need Clerk
        '/login/:path*',
        // API routes that need auth
        '/api/:path*',
    ],
}

// Default export for Next.js
export default proxy;
