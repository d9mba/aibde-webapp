/**
 * Redis-based rate limiter using Upstash
 * 
 * Production-ready rate limiting with:
 * - Distributed state (works across serverless instances)
 * - Sliding window algorithm for smooth rate limiting
 * - In-memory fallback: degrades gracefully if Redis is unavailable
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

// --- In-memory fallback rate limiter (SEC-04) ---
// Used when Redis is unavailable to maintain protection without killing all traffic.
// Limits are intentionally stricter than Redis to account for per-instance state.
interface MemoryBucket {
    tokens: number;
    lastRefill: number;
}
const memoryBuckets = new Map<string, MemoryBucket>();
const MEMORY_PRUNE_INTERVAL = 60_000;
let lastMemoryPrune = Date.now();

function memoryRateLimit(identifier: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now();

    // Prune stale entries periodically to prevent memory growth
    if (now - lastMemoryPrune > MEMORY_PRUNE_INTERVAL) {
        lastMemoryPrune = now;
        for (const [key, bucket] of memoryBuckets.entries()) {
            if (now - bucket.lastRefill > config.windowMs * 2) {
                memoryBuckets.delete(key);
            }
        }
    }

    let bucket = memoryBuckets.get(identifier);
    if (!bucket || now - bucket.lastRefill >= config.windowMs) {
        // New window — refill tokens
        bucket = { tokens: config.maxRequests, lastRefill: now };
        memoryBuckets.set(identifier, bucket);
    }

    if (bucket.tokens > 0) {
        bucket.tokens--;
        return {
            success: true,
            remaining: bucket.tokens,
            resetTime: bucket.lastRefill + config.windowMs,
        };
    }

    return {
        success: false,
        remaining: 0,
        resetTime: bucket.lastRefill + config.windowMs,
    };
}

// Track whether the Redis-unavailable warning has already been logged (once per cold start)
let rateLimitOutageLogged = false;

/**
 * Check rate limit for a given identifier
 * Uses Redis if available, falls back to in-memory limiter if not
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
            // SEC-04: Redis error — degrade to in-memory instead of blocking all traffic
            console.error('[RateLimit] Redis error, falling back to in-memory limiter:', error);
            return memoryRateLimit(identifier, config);
        }
    }

    // SEC-04: No Redis configured — use in-memory fallback
    if (!rateLimitOutageLogged) {
        rateLimitOutageLogged = true;
        console.warn('[RateLimit] Redis not configured — using in-memory fallback (per-instance only)');
    }
    return memoryRateLimit(identifier, config);
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
 * Priority:
 * 1. x-forwarded-for (first IP — set by trusted reverse proxies like Cloudflare/Vercel)
 * 2. x-real-ip
 * 3. 'anonymous' shared fallback bucket
 *
 * NOTE: When 'anonymous' is returned, all unidentifiable clients share a single
 * bucket, making the effective per-user limit FAR more restrictive.
 */
export function getClientIp(request: { headers: { get: (name: string) => string | null } }): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const clientIp = forwarded?.split(',')[0]?.trim() || null;
    if (clientIp) return clientIp;
    const realIp = request.headers.get('x-real-ip')?.trim() || null;
    if (realIp) return realIp;
    return 'anonymous';
}

