import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// 1. Define Routes
const isSecretEntry = createRouteMatcher(['/login/:secret']) // Matches /login/super-secret
const isLoginPage = createRouteMatcher(['/login(.*)', '/sign-in(.*)']) // Matches /login, /login/factor-one
const isPublicApiRoute = createRouteMatcher(['/api/public(.*)'])
const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/api(.*)'])

export const proxy = clerkMiddleware(async (auth, req) => {
    const { userId } = await auth()
    const path = req.nextUrl.pathname

    // ----------------------------------------------------------------
    // 🔒 SECURITY: HIDDEN LOGIN FLOW
    // ----------------------------------------------------------------

    // STEP 1: Handle Secret Entry (e.g. /login/my-secret-password)
    if (isSecretEntry(req)) {
        // Extract secret from URL (last segment)
        const urlSecret = path.split('/').pop();
        const validSecret = process.env.ADMIN_LOGIN_SECRET;

        if (!validSecret) {
            console.error('[Security] ADMIN_LOGIN_SECRET not configured');
            return NextResponse.redirect(new URL('/', req.url));
        }

        // If secret matches
        if (urlSecret === validSecret) {
            // Already signed in? Go straight to dashboard
            if (userId) {
                return NextResponse.redirect(new URL('/dashboard', req.url));
            }

            // Not signed in? Set cookie and redirect to Clerk sign-in
            const response = NextResponse.redirect(new URL('/login', req.url));
            // Set a cookie that allows access to the login page for 1 hour
            response.cookies.set('admin_access', 'true', {
                path: '/',
                maxAge: 3600, // 1 hour
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax'
            });
            return response;
        }

        // Invalid secret? Redirect to home (Stealth Mode)
        console.error(`[Security] Invalid login secret attempt from: ${req.headers.get('x-forwarded-for') || 'unknown'}`);
        return NextResponse.redirect(new URL('/', req.url));
    }

    // STEP 2: Protect the actual Login Page
    // If someone tries to go to /login directly without the cookie, kick them out.
    if (isLoginPage(req) && !userId) {
        const hasAccess = req.cookies.get('admin_access');
        if (!hasAccess) {
            return NextResponse.redirect(new URL('/', req.url));
        }
    }

    // ----------------------------------------------------------------
    // 🛡️ STANDARD ROUTE PROTECTION
    // ----------------------------------------------------------------

    // Allow Public APIs
    if (isPublicApiRoute(req)) {
        return NextResponse.next();
    }

    // Protect Dashboard & Private APIs
    if (isProtectedRoute(req)) {
        if (!userId) {
            if (path.startsWith('/api/')) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
            return NextResponse.redirect(new URL('/', req.url));
        }
    }
})

export const config = {
    matcher: [
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        '/(api|trpc)(.*)',
    ],
}

export default proxy
