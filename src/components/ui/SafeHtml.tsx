'use client';

import { useState, useEffect } from 'react';

interface SafeHtmlProps {
    html: string;
    className?: string;
}

/**
 * SafeHtml - Client-only XSS-safe HTML renderer
 * 
 * Uses DOMPurify to sanitize HTML before rendering.
 * Only runs on client to avoid SSR/Edge conflicts.
 * 
 * @example
 * <SafeHtml html={description} className="prose" />
 */
export function SafeHtml({ html, className }: SafeHtmlProps) {
    const [cleanHtml, setCleanHtml] = useState<string>('');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);

        if (html && typeof window !== 'undefined') {
            // Dynamic import to avoid SSR issues
            import('dompurify').then((DOMPurify) => {
                const clean = DOMPurify.default.sanitize(html, {
                    FORBID_TAGS: ['svg', 'math', 'iframe', 'style', 'script', 'form', 'input', 'button'],
                    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
                    ALLOW_DATA_ATTR: false,
                });
                setCleanHtml(clean);
            });
        }
    }, [html]);

    // Show nothing during SSR, show content after hydration
    if (!mounted || !html) return null;

    return (
        <div
            className={className}
            dangerouslySetInnerHTML={{ __html: cleanHtml }}
        />
    );
}

/**
 * Sanitize HTML string without rendering
 * For use in client components only
 */
export async function sanitizeHtml(html: string): Promise<string> {
    if (!html || typeof window === 'undefined') return html || '';

    const DOMPurify = (await import('dompurify')).default;
    return DOMPurify.sanitize(html, {
        FORBID_TAGS: ['svg', 'math', 'iframe', 'style', 'script', 'form', 'input', 'button'],
        FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
        ALLOW_DATA_ATTR: false,
    });
}
