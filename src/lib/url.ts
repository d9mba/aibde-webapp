/**
 * Centralized URL utilities for CDN path handling
 */

export const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL ||
    process.env.R2_DEV_URL ||
    '';

/**
 * Convert a relative path to a full CDN URL.
 * Returns undefined if path is empty/null.
 */
export function toFullUrl(path: string | undefined | null): string | undefined {
    if (!path) return undefined;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    if (!CDN_URL) return path;
    return `${CDN_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

/**
 * Overloaded version that returns empty string instead of undefined.
 * Useful for components that need a guaranteed string.
 */
export function getFullUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    if (!CDN_URL) return path;
    return `${CDN_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

/**
 * Convert a full URL to a relative path for database storage.
 * Strips the CDN domain and returns just the path.
 * External (non-CDN) URLs are returned as-is.
 */
export function toRelativePath(url: string | undefined | null): string {
    if (!url) return '';
    if (url.startsWith('/') && !url.startsWith('//')) return url;
    if (CDN_URL) {
        try {
            const parsedUrl = new URL(url);
            const cdnOrigin = new URL(CDN_URL).origin;
            if (parsedUrl.origin === cdnOrigin) {
                return parsedUrl.pathname + parsedUrl.search + parsedUrl.hash;
            }
        } catch { /* invalid URL, return as-is */ }
    }
    return url;
}

/**
 * Ensure a value is always an array.
 * Handles string (comma-separated), array, or undefined.
 */
export function toArray(value: string | string[] | undefined | null): string[] {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
        return value.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [];
}
