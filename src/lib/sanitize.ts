/**
 * Server-safe HTML sanitization
 * Uses a simple tag/attribute whitelist approach that works on any environment
 * No jsdom or browser dependencies - works on Vercel serverless
 */

// Allowed HTML tags
const ALLOWED_TAGS = new Set([
    'b', 'i', 'em', 'strong', 'a', 'p', 'ul', 'ol', 'li',
    'h2', 'h3', 'h4', 'br', 'span', 'div'
]);

// Allowed attributes per tag
const ALLOWED_ATTRS: Record<string, Set<string>> = {
    'a': new Set(['href', 'target', 'rel']),
    '*': new Set(['class']),
};

/**
 * Simple HTML sanitizer that removes dangerous tags and attributes
 * Works server-side without jsdom
 */
export function sanitize(html: string): string {
    if (!html || typeof html !== 'string') {
        return '';
    }

    // Remove script tags and their content
    let result = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Remove style tags and their content
    result = result.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

    // Remove on* event handlers (onclick, onerror, etc.)
    result = result.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
    result = result.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');

    // Remove javascript: and data: URLs
    result = result.replace(/href\s*=\s*["']?\s*javascript:[^"'>]*/gi, 'href="#"');
    result = result.replace(/href\s*=\s*["']?\s*data:[^"'>]*/gi, 'href="#"');
    result = result.replace(/src\s*=\s*["']?\s*javascript:[^"'>]*/gi, '');
    result = result.replace(/src\s*=\s*["']?\s*data:[^"'>]*/gi, '');

    // Remove iframe, object, embed tags
    result = result.replace(/<(iframe|object|embed|form|input|button|textarea|select)[^>]*>.*?<\/\1>/gi, '');
    result = result.replace(/<(iframe|object|embed|form|input|button|textarea|select)[^>]*\/?>/gi, '');

    // Remove meta, link (external resources)
    result = result.replace(/<(meta|link|base)[^>]*\/?>/gi, '');

    // Clean up any remaining potentially dangerous attributes
    result = result.replace(/\s*style\s*=\s*["'][^"']*expression[^"']*["']/gi, '');
    result = result.replace(/\s*style\s*=\s*["'][^"']*javascript[^"']*["']/gi, '');

    return result;
}

/**
 * Sanitize plain text - escape HTML entities
 * Use this for user input that should be displayed as plain text
 */
export function escapeHtml(text: string): string {
    if (!text || typeof text !== 'string') {
        return '';
    }
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Strip all HTML tags, returning only text content
 */
export function stripHtml(html: string): string {
    if (!html || typeof html !== 'string') {
        return '';
    }
    return html.replace(/<[^>]*>/g, '');
}
