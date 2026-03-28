'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function PageProgress() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [progress, setProgress] = useState(0);
    const [active, setActive] = useState(false);
    const tickRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
    const hideRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const completeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const safetyInnerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const startTimeRef = useRef(0);
    const isNavigatingRef = useRef(false);

    const cleanup = useCallback(() => {
        if (tickRef.current != null) clearInterval(tickRef.current);
        if (hideRef.current != null) clearTimeout(hideRef.current);
        if (completeTimerRef.current != null) clearTimeout(completeTimerRef.current);
        if (safetyInnerRef.current != null) clearTimeout(safetyInnerRef.current);
    }, []);

    // Complete and hide the bar, ensuring minimum visible duration of 500ms
    const complete = useCallback(() => {
        cleanup();

        const elapsed = Date.now() - startTimeRef.current;
        const remaining = Math.max(0, 500 - elapsed);

        hideRef.current = setTimeout(() => {
            setProgress(100);
            completeTimerRef.current = setTimeout(() => {
                setActive(false);
                setProgress(0);
                // Defer resetting isNavigatingRef until after the fade-out completes
                // This prevents a new navigation from showing a second progress bar
                isNavigatingRef.current = false;
            }, 350);
        }, remaining);
    }, [cleanup]);

    // Start the bar. All setState calls are deferred via setTimeout so this
    // is safe to call from inside history.pushState (which runs in React's
    // useInsertionEffect and disallows synchronous state updates).
    const start = useCallback(() => {
        if (isNavigatingRef.current) return; // already running
        isNavigatingRef.current = true;
        startTimeRef.current = Date.now();
        cleanup();

        safetyInnerRef.current = setTimeout(() => {
            // Check if navigation has already completed before setting up the interval
            if (!isNavigatingRef.current) return;

            setActive(true);
            setProgress(15);

            tickRef.current = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 90) return 90;
                    const step = prev < 30 ? 6 : prev < 60 ? 3 : 1;
                    return Math.min(prev + step, 90);
                });
            }, 250);
        }, 0);
    }, [cleanup]);

    // Intercept <Link> / <a> clicks
    useEffect(() => {
        function shouldIgnore(anchor: HTMLAnchorElement, e: MouseEvent): boolean {
            const href = anchor.getAttribute('href');
            if (!href) return true;
            if (anchor.target === '_blank') return true;
            if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return true;
            if (e.ctrlKey || e.metaKey || e.shiftKey) return true;
            try {
                const url = new URL(href, window.location.origin);
                if (url.origin !== window.location.origin) return true;
                return url.pathname + url.search === window.location.pathname + window.location.search;
            } catch {
                return true;
            }
        }

        function handleClick(e: MouseEvent) {
            const anchor = (e.target as HTMLElement).closest('a');
            if (!anchor || shouldIgnore(anchor, e)) return;
            start();
        }

        document.addEventListener('click', handleClick, { capture: true, passive: true });
        return () => document.removeEventListener('click', handleClick, true);
    }, [start]);

    // Intercept programmatic router.push / router.replace
    useEffect(() => {
        const origPush = history.pushState.bind(history);
        const origReplace = history.replaceState.bind(history);
        const normalize = (u: string) => u.replace(/\/$/, '') || '/';
        const resolveUrl = (u: string) => {
            try {
                const parsed = new URL(u, window.location.href);
                return normalize(parsed.pathname + parsed.search);
            } catch {
                return normalize(u);
            }
        };

        history.pushState = function (...args) {
            const url = args[2];
            if (url && typeof url === 'string') {
                if (resolveUrl(url) !== normalize(window.location.pathname + window.location.search)) {
                    const res = origPush(...args);
                    start();
                    return res;
                }
            } else {
                const before = normalize(window.location.pathname + window.location.search);
                const res = origPush(...args);
                const after = normalize(window.location.pathname + window.location.search);
                if (before !== after) start();
                return res;
            }
            return origPush(...args);
        };

        history.replaceState = function (...args) {
            const url = args[2];
            if (url && typeof url === 'string') {
                if (resolveUrl(url) !== normalize(window.location.pathname + window.location.search)) {
                    start();
                }
            }
            return origReplace(...args);
        };

        return () => {
            history.pushState = origPush;
            history.replaceState = origReplace;
        };
    }, [start]);

    // Complete when the new route renders
    useEffect(() => {
        if (!isNavigatingRef.current) return;

        if ('requestIdleCallback' in window) {
            const id = requestIdleCallback(() => complete(), { timeout: 2000 });
            return () => cancelIdleCallback(id);
        }
        const t = setTimeout(complete, 300);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname, searchParams]);

    // Safety: never show for more than 8 s
    useEffect(() => {
        if (!active) return;
        const t = setTimeout(() => {
            cleanup();
            setProgress(100);
            safetyInnerRef.current = setTimeout(() => {
                setActive(false);
                setProgress(0);
                isNavigatingRef.current = false;
            }, 350);
        }, 8000);
        return () => clearTimeout(t);
    }, [active, cleanup]);

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
