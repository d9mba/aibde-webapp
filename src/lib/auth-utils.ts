/**
 * Authentication and Authorization Utilities
 * 
 * Provides RBAC (Role-Based Access Control) for API routes
 */

import { auth } from '@clerk/nextjs/server';

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
 * 3. Configure JWT Template to include: { "metadata": "{{user.public_metadata}}" }
 */
export async function requireAdmin(): Promise<AuthResult | AuthError> {
    const { userId, sessionClaims } = await auth();

    if (!userId) {
        return { error: 'Unauthorized', status: 401 };
    }

    // Check for admin role in Clerk public metadata
    const metadata = sessionClaims?.metadata as { role?: string } | undefined;
    const role = metadata?.role || 'user';

    // TODO: Re-enable admin check when RBAC is fully configured
    // if (role !== 'admin') {
    //     return { error: 'Forbidden - Admin access required', status: 403 };
    // }

    return { userId, role: 'admin' };
}

/**
 * Check if result is an auth error
 */
export function isAuthError(result: AuthResult | AuthError): result is AuthError {
    return 'error' in result;
}
