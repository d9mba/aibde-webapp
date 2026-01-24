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

    try {
        // Fetch user from Clerk to get public metadata
        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        const publicMetadata = user.publicMetadata as { role?: string } | undefined;
        const role = publicMetadata?.role || 'user';

        // SECURITY: Enforce admin role check
        if (role !== 'admin') {
            console.error(`[Security] Unauthorized admin access attempt by userId: ${userId}`);
            return { error: 'Forbidden - Admin access required', status: 403 };
        }

        return { userId, role: 'admin' };
    } catch (err) {
        console.error('[Auth] Error fetching user:', err);
        return { error: 'Auth service error', status: 500 };
    }
}

/**
 * Check if result is an auth error
 */
export function isAuthError(result: AuthResult | AuthError): result is AuthError {
    return 'error' in result;
}
