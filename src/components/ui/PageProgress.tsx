'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function PageProgress() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [progress, setProgress] = useState(0);
    const [active, setActive] = useState(false);
    const tickRef = useRef<NodeJS.Timeout>(undefined);
    const hideRef = useRef<NodeJS.Timeout>(undefined);
    const completeTimerRef = useRef<NodeJS.Timeout>(undefined);
    const safetyInnerRef = useRef<NodeJS.Timeout>(undefined);
    const startTimeRef = useRef(0);
    const isNavigatingRef = useRef(false);

    const cleanup = useCallback(() => {
        if (tickRef.current) clearInterval(tickRef.current);
        if (hideRef.current) clearTimeout(hideRef.current);
        if (completeTimerRef.current) clearTimeout(completeTimerRef.current);
        if (safetyInnerRef.current) clearTimeout(safetyInnerRef.current);
    }, []);

    // Complete and hide progress bar with minimum visible duration
    const complete = useCallback(() => {
        cleanup();
        isNavigatingRef.current = false;

        // Ensure bar is visible for at least 600ms
        const elapsed = Date.now() - startTimeRef.current;
        const remaining = Math.max(0, 600 - elapsed);

        hideRef.current = setTimeout(() => {
            setProgress(100);
            completeTimerRef.current = setTimeout(() => {
                setActive(false);
                setProgress(0);
            }, 400);
        }, remaining);
    }, [cleanup]);

    // Start progress bar with ticking animation
    const start = useCallback(() => {
        cleanup();
        // Idempotent: always (re)initialize the progress UI
        isNavigatingRef.current = true;
        startTimeRef.current = Date.now();
        setActive(true);
        setProgress(15);

        tickRef.current = setInterval(() => {
            setProgress(prev => {
                if (prev >= 90) return 90;
                const increment = prev < 30 ? 6 : prev < 60 ? 3 : 1;
                return Math.min(prev + increment, 90);
            });
        }, 250);
    }, [cleanup]);

    // Intercept clicks on internal links
    useEffect(() => {
        function shouldIgnore(anchor: HTMLAnchorElement, e: MouseEvent): boolean {
            const href = anchor.getAttribute('href');
            if (!href) return true;
            if (anchor.target === '_blank') return true;
            if (href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return true;
            if (e.ctrlKey || e.metaKey || e.shiftKey) return true;

            // Same page check
            const url = new URL(href, window.location.origin);
            if (url.pathname + url.search === window.location.pathname + window.location.search) return true;

            return false;
        }

        function handleClick(e: MouseEvent) {
            const anchor = (e.target as HTMLElement).closest('a');
            if (!anchor || shouldIgnore(anchor, e)) return;
            start();
        }

        // Use capture phase to catch clicks before Next.js processes them
        document.addEventListener('click', handleClick, { capture: true, passive: true });
        return () => document.removeEventListener('click', handleClick, true);
    }, [start]);

    // Also intercept programmatic navigation (router.push)
    // Note: start() is deferred with setTimeout because Next.js 16 calls
    // pushState/replaceState from useInsertionEffect, which forbids state updates.
    useEffect(() => {
        const originalPushState = history.pushState.bind(history);
        const originalReplaceState = history.replaceState.bind(history);

        history.pushState = function (...args) {
            if (!isNavigatingRef.current) {
                isNavigatingRef.current = true;
                setTimeout(start, 0);
            }
            return originalPushState(...args);
        };

        history.replaceState = function (...args) {
            const url = args[2];
            if (url && typeof url === 'string') {
                const normalize = (u: string): string => u.replace(/\/$/, '') || '/';
                if (normalize(url) !== normalize(window.location.pathname + window.location.search)) {
                    if (!isNavigatingRef.current) {
                        isNavigatingRef.current = true;
                        setTimeout(start, 0);
                    }
                }
            }
            return originalReplaceState(...args);
        };

        return () => {
            history.pushState = originalPushState;
            history.replaceState = originalReplaceState;
        };
    }, [start]);

    // Complete when route changes (use idle callback to wait for page content to settle)
    useEffect(() => {
        if (!isNavigatingRef.current) return;

        // Wait for browser to be idle (page done rendering) before completing
        if ('requestIdleCallback' in window) {
            const id = requestIdleCallback(() => complete(), { timeout: 2000 });
            return () => cancelIdleCallback(id);
        }
        // Fallback for Safari
        const timer = setTimeout(complete, 300);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname, searchParams, complete]);

    // Safety timeout - never show bar for more than 8 seconds
    useEffect(() => {
        if (!active) return;
        const safety = setTimeout(() => {
            cleanup();
            isNavigatingRef.current = false;
            setProgress(100);
            safetyInnerRef.current = setTimeout(() => { setActive(false); setProgress(0); }, 400);
        }, 8000);
        return () => clearTimeout(safety);
    }, [active, cleanup]);

    // Cleanup on unmount
    useEffect(() => cleanup, [cleanup]);

    if (!active && progress === 0) return null;

    return (
        <div
            className="fixed top-0 left-0 right-0 z-[9999] h-[2.5px] pointer-events-none"
            style={{ opacity: progress > 0 ? 1 : 0, transition: 'opacity 0.3s ease' }}
        >
            <div
                className="h-full bg-accent-primary"
                style={{
                    width: `${progress}%`,
                    transition: progress === 0 ? 'none' : progress === 100 ? 'width 0.2s ease' : 'width 0.4s ease',
                    boxShadow: '0 0 8px rgba(52, 178, 123, 0.5)',
                }}
            />
        </div>
    );
}
