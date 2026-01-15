/**
 * Server-safe HTML sanitization using DOMPurify + JSDOM
 * This avoids ESM/CommonJS issues with isomorphic-dompurify
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { JSDOM } = require('jsdom');
import createDOMPurify from 'dompurify';

// Create a JSDOM window for DOMPurify
const window = new JSDOM('').window;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DOMPurify = createDOMPurify(window as any);

/**
 * Sanitize HTML to prevent XSS attacks
 */
export function sanitize(html: string): string {
    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'ul', 'ol', 'li', 'h2', 'h3', 'h4', 'br', 'span'],
        ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
        ALLOW_DATA_ATTR: false,
    });
}

/**
 * Sanitize plain text - escape HTML entities
 */
export function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
