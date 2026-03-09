/**
 * Authentication and Authorization Utilities
 * 
 * Provides RBAC (Role-Based Access Control) for API routes
 */

import { auth, clerkClient } from '@clerk/nextjs/server';

interface AuthResult {
    userId: string;
    role: string;
}

interface AuthError {
    error: string;
    status: number;
}

/**
 * Require authentication - returns userId or error
 */
export async function requireAuth(): Promise<AuthResult | AuthError> {
    const { userId } = await auth();

    if (!userId) {
        return { error: 'Unauthorized', status: 401 };
    }

    return { userId, role: 'user' };
}

// Short-lived cache for Clerk user lookups to prevent 429 rate limiting
// when multiple API routes call requireAdmin() concurrently (e.g. analytics page fires 7 parallel calls)
const userCache = new Map<string, { result: AuthResult | AuthError; expires: number }>();
const inflightRequests = new Map<string, Promise<AuthResult | AuthError>>();
const CACHE_TTL_MS = 10_000; // 10 seconds

/**
 * Require admin role - returns userId/role or error
 * 
 * To set up admin role in Clerk:
 * 1. Go to Clerk Dashboard → Users → Select user
 * 2. Add to Public Metadata: { "role": "admin" }
 */
export async function requireAdmin(): Promise<AuthResult | AuthError> {
    const { userId } = await auth();

    if (!userId) {
        return { error: 'Unauthorized', status: 401 };
    }

    // Check cache first
    const cached = userCache.get(userId);
    if (cached && Date.now() < cached.expires) {
        return cached.result;
    }

    // Deduplicate in-flight requests for the same user
    const inflight = inflightRequests.get(userId);
    if (inflight) return inflight;

    const fetchPromise = (async (): Promise<AuthResult | AuthError> => {
        try {
            const client = await clerkClient();
            const user = await client.users.getUser(userId);
            const publicMetadata = user.publicMetadata as { role?: string } | undefined;
            const role = publicMetadata?.role || 'user';

            if (role !== 'admin') {
                console.error(`[Security] Unauthorized admin access attempt by userId: ${userId}`);
                const result: AuthError = { error: 'Forbidden - Admin access required', status: 403 };
                userCache.set(userId, { result, expires: Date.now() + CACHE_TTL_MS });
                return result;
            }

            const result: AuthResult = { userId, role: 'admin' };
            userCache.set(userId, { result, expires: Date.now() + CACHE_TTL_MS });
            return result;
        } catch (err) {
            console.error('[Auth] Error fetching user:', err);
            // Don't cache errors — allow retry
            return { error: 'Auth service error', status: 500 };
        } finally {
            inflightRequests.delete(userId);
        }
    })();

    inflightRequests.set(userId, fetchPromise);
    return fetchPromise;
}

/**
 * Check if result is an auth error
 */
export function isAuthError(result: AuthResult | AuthError): result is AuthError {
    return 'error' in result;
}
