/**
 * Input sanitization utilities for API routes.
 *
 * Centralised so every call-site uses the same rules.
 */

import crypto from 'crypto';

/**
 * Escape PostgREST filter meta-characters in user-supplied values.
 *
 * Characters like `.`, `,`, `(`, `)` have special meaning inside
 * Supabase `.or()` / `.filter()` strings. Injecting them lets an
 * attacker alter the query's semantics.
 *
 * We strip them entirely rather than percent-encoding because
 * PostgREST's ILIKE handler does not un-encode percent sequences.
 */
export function escapeFilterValue(value: string): string {
    // Remove characters that act as PostgREST filter-string operators
    return value.replace(/[.,()\\]/g, '');
}

/**
 * Generate a cryptographically secure random hex suffix for filenames.
 *
 * Replaces `Math.random().toString(36)` which is NOT cryptographically
 * secure and can produce collisions under high concurrency.
 *
 * @param bytes Number of random bytes (default 6 → 12 hex chars)
 */
export function secureRandomSuffix(bytes = 6): string {
    return crypto.randomBytes(bytes).toString('hex');
}
