/**
 * Centralized URL utilities for CDN path handling
 * This consolidates duplicated URL helper functions from multiple files
 */

// CDN URL for assets - supports multiple environment variable names
export const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL ||
    process.env.R2_PUBLIC_URL ||
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
    '';

/**
 * Convert a relative path to a full CDN URL
 * @param path - Relative path or full URL
 * @returns Full CDN URL or undefined if path is empty
 */
export function toFullUrl(path: string | undefined | null): string | undefined {
    if (!path) return undefined;
    // Already a full URL, return as-is
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    // No CDN configured, return path as-is
    if (!CDN_URL) return path;
    // Prepend CDN URL
    return `${CDN_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

/**
 * Overloaded version that returns empty string instead of undefined
 * Useful for components that need a guaranteed string
 */
export function getFullUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    if (!CDN_URL) return path;
    return `${CDN_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

/**
 * Extract relative path from a full URL by stripping CDN domain
 * @param url - Full URL or relative path
 * @returns Relative path starting with / or the original if not matching
 */
export function extractRelativePath(url: string | undefined | null): string | null {
    if (!url) return null;
    // If it's already a relative path starting with /, return as is
    if (url.startsWith('/') && !url.startsWith('//')) return url;

    try {
        const urlObj = new URL(url);
        // Return just the pathname (relative path)
        return urlObj.pathname;
    } catch {
        // Not a valid URL, return as-is
        return url;
    }
}

/**
 * Convert full URL to relative path for database storage
 * Strips the CDN domain and returns just the path
 */
export function toRelativePath(url: string | undefined | null): string {
    if (!url) return '';
    // Already relative
    if (url.startsWith('/') && !url.startsWith('//')) return url;
    // Strip CDN URL if present
    if (CDN_URL && url.startsWith(CDN_URL)) {
        return url.substring(CDN_URL.length);
    }
    // Try to extract pathname from full URL
    try {
        const urlObj = new URL(url);
        return urlObj.pathname;
    } catch {
        return url;
    }
}

/**
 * Ensure a value is always an array
 * Handles string (comma-separated), array, or undefined
 */
export function toArray(value: string | string[] | undefined | null): string[] {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    // If it's a string, it might be comma-separated or a single value
    if (typeof value === 'string') {
        return value.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [];
}
