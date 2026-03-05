import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// SECURITY: HMAC-sign the admin_access cookie value with a timestamp to prevent replay
const COOKIE_MAX_AGE_MS = 3600 * 1000; // 1 hour

async function hmacSign(payload: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function signCookieValue(secret: string): Promise<string> {
    const timestamp = Date.now().toString();
    const payload = `admin_access:${timestamp}`;
    const sig = await hmacSign(payload, secret);
    return `${payload}|${sig}`;
}

async function verifyCookieValue(cookieValue: string, secret: string): Promise<boolean> {
    const parts = cookieValue.split('|');
    if (parts.length !== 2) return false;
    const [payload, sig] = parts;

    // Verify the HMAC signature
    const expected = await hmacSign(payload, secret);
    if (sig.length !== expected.length) return false;
    let mismatch = 0;
    for (let i = 0; i < expected.length; i++) {
        mismatch |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
    }
    if (mismatch !== 0) return false;

    // Verify the payload format and timestamp freshness
    const colonIdx = payload.indexOf(':');
    if (colonIdx === -1) return false;
    const timestamp = parseInt(payload.slice(colonIdx + 1), 10);
    if (Number.isNaN(timestamp)) return false;
    return (Date.now() - timestamp) < COOKIE_MAX_AGE_MS;
}

// 1. Define Routes
const isSecretEntry = createRouteMatcher(['/login/:secret']) // Matches /login/super-secret
const isLoginPage = createRouteMatcher(['/login(.*)', '/sign-in(.*)']) // Matches /login, /login/factor-one
const isPublicApiRoute = createRouteMatcher(['/api/public(.*)', '/api/cron(.*)', '/api/vote', '/api/submit-tool', '/api/contact', '/api/search', '/api/tools/by-category', '/api/tools/by-task'])
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
            // Mask the IP for logging: take first IP from x-forwarded-for, handle IPv4/IPv6
            const rawIp = req.headers.get('x-forwarded-for') || 'unknown';
            const firstIp = rawIp.split(',')[0]?.trim() || 'unknown';
            let maskedIp = '***';
            if (firstIp !== 'unknown') {
                if (firstIp.includes('.')) {
                    // IPv4: show first two octets, mask the rest
                    const octets = firstIp.split('.');
                    maskedIp = octets.length >= 2 ? `${octets[0]}.${octets[1]}.x.x` : '***';
                } else if (firstIp.includes(':')) {
                    // IPv6: show first two hextets, mask the rest
                    const hextets = firstIp.split(':');
                    maskedIp = hextets.length >= 2 ? `${hextets[0]}:${hextets[1]}::/masked` : '***';
                }
            }
            console.error(`[Security] Invalid login secret attempt from: ${maskedIp}`);
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
        // If user is logged in (admin), allow all access
        if (userId) {
            return NextResponse.next();
        }

        // Block CLI/non-browser access (missing Sec-Fetch-Mode header)
        const fetchMode = req.headers.get('sec-fetch-mode');
        if (!fetchMode) {
            return NextResponse.json({ error: 'access denied' }, { status: 403 });
        }

        // Direct browser navigation is already blocked by the /api check above
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
