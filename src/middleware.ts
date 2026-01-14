import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Routes that need authentication
const isProtectedRoute = createRouteMatcher([
    '/dashboard(.*)',
])

// Routes where Clerk should be active (login pages)
const isAuthRoute = createRouteMatcher([
    '/login(.*)',
])

export default clerkMiddleware(async (auth, req) => {
    const pathname = req.nextUrl.pathname;

    // Only apply Clerk logic to protected and auth routes
    if (isProtectedRoute(req)) {
        const { userId } = await auth()
        if (!userId) {
            // Redirect to homepage instead of login (keeps login secret)
            return NextResponse.redirect(new URL('/', req.url))
        }
    }

    // For all other routes (homepage, /app/*, etc.), just continue without Clerk checks
})

export const config = {
    // Only run middleware on specific routes to minimize Clerk overhead
    matcher: [
        // Dashboard routes need authentication
        '/dashboard/:path*',
        // Login routes need Clerk
        '/login/:path*',
        // API routes that need auth
        '/api/:path*',
    ],
}
