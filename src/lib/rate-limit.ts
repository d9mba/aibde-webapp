/**
 * Redis-based rate limiter using Upstash
 * 
 * Production-ready rate limiting with:
 * - Distributed state (works across serverless instances)
 * - Sliding window algorithm for smooth rate limiting
 * - Fail-closed: denies requests if Redis unavailable
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Redis client (uses env vars automatically)
// UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
let redis: Redis | null = null;

try {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        redis = new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL,
            token: process.env.UPSTASH_REDIS_REST_TOKEN,
        });
    }
} catch (error) {
    console.error('[RateLimit] Failed to initialize Redis:', error);
}

// Rate limiters for different use cases
const rateLimiters = redis ? {
    upload: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 per minute
        analytics: true,
        prefix: 'ratelimit:upload',
    }),
    standard: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(60, '1 m'), // 60 per minute
        analytics: true,
        prefix: 'ratelimit:standard',
    }),
    read: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(120, '1 m'), // 120 per minute
        analytics: true,
        prefix: 'ratelimit:read',
    }),
    sensitive: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 per minute
        analytics: true,
        prefix: 'ratelimit:sensitive',
    }),
} : null;

// Config interface for backward compatibility
interface RateLimitConfig {
    maxRequests: number;
    windowMs: number;
}

interface RateLimitResult {
    success: boolean;
    remaining: number;
    resetTime: number;
}

// Rate limit presets (for reference and fallback)
export const rateLimits = {
    upload: { maxRequests: 10, windowMs: 60 * 1000 },
    standard: { maxRequests: 60, windowMs: 60 * 1000 },
    read: { maxRequests: 120, windowMs: 60 * 1000 },
    sensitive: { maxRequests: 5, windowMs: 60 * 1000 },
};

// Type for preset names
type RateLimitPreset = keyof typeof rateLimits;

// Track whether the Redis-unavailable warning has already been logged (once per cold start)
let rateLimitOutageLogged = false;

/**
 * Check rate limit for a given identifier
 * Uses Redis if available, denies request if not (fail-closed)
 */
export async function checkRateLimit(
    identifier: string,
    config: RateLimitConfig
): Promise<RateLimitResult> {
    // Determine which preset to use based on config
    let preset: RateLimitPreset = 'standard';
    if (config.maxRequests === 10) preset = 'upload';
    else if (config.maxRequests === 120) preset = 'read';
    else if (config.maxRequests === 5) preset = 'sensitive';

    // If Redis is available, use it
    if (rateLimiters && rateLimiters[preset]) {
        try {
            const result = await rateLimiters[preset].limit(identifier);
            return {
                success: result.success,
                remaining: result.remaining,
                resetTime: result.reset,
            };
        } catch (error) {
            console.error('[RateLimit] Redis error, denying request as safety measure:', error);
            return {
                success: false,
                remaining: 0,
                resetTime: Date.now() + config.windowMs,
            };
        }
    } else if (!redis) {
        // Log warning once per cold start
        if (!rateLimitOutageLogged) {
            rateLimitOutageLogged = true;
            console.warn('[RateLimit] Redis not configured — denying requests as safety measure');
        }
    }

    // Fallback: deny request when rate limiting is unavailable
    // SECURITY: Defaulting to allow would let attackers exploit Redis outages
    return {
        success: false,
        remaining: 0,
        resetTime: Date.now() + config.windowMs,
    };
}

/**
 * Check if Upstash Redis is configured
 */
export function isRedisConfigured(): boolean {
    return redis !== null;
}

/**
 * Extract client IP from a request for rate-limit identification.
 *
 * Returns a per-request identifier:
 * - x-forwarded-for header (first IP) if present (trustworthy behind reverse proxy)
 * - x-real-ip header if present
 * - 'anonymous' as shared fallback bucket when no IP can be determined
 *
 * NOTE: When 'anonymous' is returned, all unidentifiable clients share a single bucket,
 * so rate limits on 'anonymous' requests are less restrictive than IP-based limits.
 * To mitigate abuse, consider applying stricter checks or failing closed (rejecting
 * requests with no identifiable client) at call sites that handle sensitive operations.
 */
export function getClientIp(request: { headers: { get: (name: string) => string | null } }): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const clientIp = forwarded?.split(',')[0]?.trim() || null;
    if (clientIp) return clientIp;
    const realIp = request.headers.get('x-real-ip')?.trim() || null;
    if (realIp) return realIp;
    return 'anonymous';
}
