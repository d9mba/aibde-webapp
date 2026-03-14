'use client';

import { useEffect } from 'react';

export default function CleanUrlClient() {
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const url = new URL(window.location.href);
        if (url.search) {
            const clean = url.origin + url.pathname;
            window.history.replaceState({}, '', clean);
        }
    }, []);

    return null;
}

