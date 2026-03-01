import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// SECURITY: HMAC-sign the admin_access cookie value
async function signCookieValue(secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode('admin_access'));
    return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyCookieValue(cookieValue: string, secret: string): Promise<boolean> {
    const expected = await signCookieValue(secret);
    if (cookieValue.length !== expected.length) return false;
    // Constant-time comparison
    let mismatch = 0;
    for (let i = 0; i < expected.length; i++) {
        mismatch |= cookieValue.charCodeAt(i) ^ expected.charCodeAt(i);
    }
    return mismatch === 0;
}

// 1. Define Routes
const isSecretEntry = createRouteMatcher(['/login/:secret']) // Matches /login/super-secret
const isLoginPage = createRouteMatcher(['/login(.*)', '/sign-in(.*)']) // Matches /login, /login/factor-one
const isPublicApiRoute = createRouteMatcher(['/api/public(.*)', '/api/cron(.*)', '/api/vote', '/api/submit-tool', '/api/contact', '/api/search'])
const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/api(.*)'])

export const proxy = clerkMiddleware(async (auth, req) => {
    const path = req.nextUrl.pathname

    // ----------------------------------------------------------------
    // 🔒 SECURITY: HIDDEN LOGIN FLOW (checked BEFORE auth to prevent bypass)
    // ----------------------------------------------------------------

    // Clerk's internal auth sub-routes that must be allowed through
    const clerkRoutes = ['factor-one', 'factor-two', 'sso-callback', 'verify', 'reset-password', 'continue']
    const lastSegment = path.split('/').pop() || ''

    // STEP 1: Protect the Login Page FIRST (before Clerk auth resolves)
    // Block /login access unless user has admin_access cookie
    // Allow Clerk's internal auth sub-routes (factor-one, sso-callback, etc.)
    if (isLoginPage(req) && !clerkRoutes.includes(lastSegment)) {
        const hasAccess = req.cookies.get('admin_access');

        // Check if this is the secret entry route
        if (isSecretEntry(req)) {
            const urlSecret = path.split('/').pop();
            const validSecret = process.env.ADMIN_LOGIN_SECRET;

            if (!validSecret) {
                console.error('[Security] ADMIN_LOGIN_SECRET not configured');
                return NextResponse.redirect(new URL('/', req.url));
            }

            // Constant-time comparison to prevent timing attacks
            const encoder = new TextEncoder();
            const secretBytes = encoder.encode(urlSecret || '');
            const validBytes = encoder.encode(validSecret);
            const secretHash = new Uint8Array(await crypto.subtle.digest('SHA-256', secretBytes));
            const validHash = new Uint8Array(await crypto.subtle.digest('SHA-256', validBytes));
            // Non-short-circuiting XOR accumulator — always iterates all bytes
            let acc = secretHash.length ^ validHash.length;
            const len = Math.max(secretHash.length, validHash.length);
            for (let i = 0; i < len; i++) {
                acc |= (secretHash[i] ?? 0) ^ (validHash[i] ?? 0);
            }
            const isMatch = acc === 0;

            if (isMatch) {
                // Valid secret — set HMAC-signed cookie and redirect to /login
                const { userId } = await auth()
                if (userId) {
                    return NextResponse.redirect(new URL('/dashboard', req.url));
                }
                const response = NextResponse.redirect(new URL('/login', req.url));
                const signedValue = await signCookieValue(validSecret);
                response.cookies.set('admin_access', signedValue, {
                    path: '/',
                    maxAge: 3600,
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax'
                });
                return response;
            }

            // Invalid secret — redirect to home silently
            console.error(`[Security] Invalid login secret attempt from: ${req.headers.get('x-forwarded-for') || 'unknown'}`);
            return NextResponse.redirect(new URL('/', req.url));
        }

        // Not a secret entry — must have valid HMAC-signed admin_access cookie
        if (!hasAccess) {
            return NextResponse.redirect(new URL('/', req.url));
        }
        const adminSecret = process.env.ADMIN_LOGIN_SECRET;
        if (!adminSecret || !(await verifyCookieValue(hasAccess.value, adminSecret))) {
            return NextResponse.redirect(new URL('/', req.url));
        }
    }

    const { userId } = await auth()

    // ----------------------------------------------------------------
    // 🛡️ STANDARD ROUTE PROTECTION
    // ----------------------------------------------------------------

    // Block direct browser navigation to ALL /api routes (all environments)
    // Programmatic fetch calls (from client JS) still work
    if (path.startsWith('/api')) {
        const fetchDest = req.headers.get('sec-fetch-dest');
        const fetchMode = req.headers.get('sec-fetch-mode');

        // Admins can still browse API routes directly
        if (!userId && fetchDest === 'document' && fetchMode === 'navigate') {
            return new NextResponse(null, { status: 403 });
        }
    }

    // Allow Public APIs - but block direct browser access AND CLI access for non-admins
    if (isPublicApiRoute(req)) {
        // SECURITY: Block direct browser navigation AND CLI/non-browser access
        // Browsers always send Sec-Fetch-Mode header, CLI tools don't
        const fetchDest = req.headers.get('sec-fetch-dest');
        const fetchMode = req.headers.get('sec-fetch-mode');

        // If user is logged in (admin), allow all access
        if (userId) {
            return NextResponse.next();
        }

        // Block CLI/non-browser access (missing Sec-Fetch-Mode header)
        if (!fetchMode) {
            return NextResponse.json({ error: 'access denied' }, { status: 403 });
        }

        // Block direct browser navigation (document request)
        // Allow: fetch calls (cors, same-origin with fetchDest=empty)
        if (fetchDest === 'document' && fetchMode === 'navigate') {
            // Redirect to search page with full original path as query (readable format)
            return new NextResponse(null, { status: 403 });
        }

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
