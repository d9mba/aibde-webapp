'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { AdminTool } from '@/types';

interface UseToolsOptions {
    /** Filter params appended to /api/tools */
    featured?: boolean;
    spotlight?: boolean;
    listing?: string;
    trending?: boolean;
    status?: string;
    search?: string;
    /** Items per page (default 50) */
    limit?: number;
    /** Initial page (default 1) */
    page?: number;
    /** Load all matching tools at once (use sparingly) */
    all?: boolean;
    /** Dependency value – refetch when this changes */
    deps?: number;
    /** Field set to load: 'card' (minimal) or 'table' (full) */
    fields?: 'card' | 'table';
}

interface UseToolsResult {
    tools: AdminTool[];
    loading: boolean;
    error: string | null;
    totalCount: number;
    page: number;
    totalPages: number;
    setPage: (p: number) => void;
    setSearch: (s: string) => void;
    search: string;
    refetch: () => void;
}

/**
 * Hook for fetching tools from the API with server-side filtering + pagination.
 * Replaces the old pattern of reading `tools` from AdminContext.
 */
export function useTools(options: UseToolsOptions = {}): UseToolsResult {
    const {
        featured, spotlight, listing, trending,
        status, limit = 50, page: initialPage = 1,
        all = false, deps = 0, fields,
    } = options;

    const [tools, setTools] = useState<AdminTool[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(initialPage);
    const [search, setSearch] = useState(options.search || '');

    const abortRef = useRef<AbortController | null>(null);

    const fetchTools = useCallback(async () => {
        // Abort any in-flight request before starting a new one
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (all) params.set('all', 'true');
            if (!all) {
                params.set('page', String(page));
                params.set('limit', String(limit));
            }
            if (search) params.set('search', search);
            if (status) params.set('status', status);
            if (featured) params.set('featured', 'true');
            if (spotlight) params.set('spotlight', 'true');
            if (listing) params.set('listing', listing);
            if (trending) params.set('trending', 'true');
            if (fields) params.set('fields', fields);

            const res = await fetch(`/api/tools?${params.toString()}`, { signal: controller.signal });
            if (!res.ok) {
                const bodyText = await res.text();
                let errorMsg = 'Failed to fetch tools';
                try { const err = JSON.parse(bodyText); errorMsg = err.error || errorMsg; } catch { errorMsg = bodyText || `HTTP ${res.status}: ${res.statusText}`; }
                throw new Error(errorMsg);
            }
            const json = await res.json();

            // API returns { data: [...], pagination: { total, page, limit, totalPages } }
            const data = json.data || json;
            setTools(Array.isArray(data) ? data : []);
            setTotalCount(json.pagination?.total ?? (Array.isArray(data) ? data.length : 0));
        } catch (err) {
            if (err instanceof DOMException && err.name === 'AbortError') return;
            setError(err instanceof Error ? err.message : 'Failed to fetch tools');
            setTools([]);
        } finally {
            if (!controller.signal.aborted) setLoading(false);
        }
    }, [page, search, status, featured, spotlight, listing, trending, limit, all, deps, fields]);

    useEffect(() => {
        fetchTools();
        return () => abortRef.current?.abort();
    }, [fetchTools]);

    useEffect(() => {
        if (options.page !== undefined && options.page !== page) setPage(options.page);
        // Sync external page prop to internal state. Only depends on options.page
    // intentionally — setPage is stable and page would create a render loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [options.page]);

    useEffect(() => {
        const optSearch = options.search ?? '';
        if (optSearch !== search) {
            setSearch(optSearch);
            setPage(1);
        }
        // Sync external search prop to internal state. Only depends on options.search
    // intentionally — setSearch/setPage are stable and search would create a loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [options.search]);

    const totalPages = all ? 1 : Math.max(1, Math.ceil(totalCount / Math.max(1, limit)));

    // Clamp page when totalPages shrinks below current page
    // Skip clamping on initial load (when totalCount is 0) to preserve initialPage
    useEffect(() => {
        if (totalCount > 0 && page > totalPages) {
            setPage(totalPages);
        }
    }, [page, totalPages, totalCount]);

    // Wrap setSearch to also reset pagination
    const handleSetSearch = useCallback((s: string) => {
        setSearch(s);
        setPage(1);
    }, []);

    // Memoize setPage for stable reference
    const handleSetPage = useCallback((p: number) => {
        setPage(prev => {
            const clamped = Math.min(Math.max(1, p), totalPages);
            return clamped !== prev ? clamped : prev;
        });
    }, [totalPages]);

    return {
        tools,
        loading,
        error,
        totalCount,
        page,
        totalPages,
        setPage: handleSetPage,
        setSearch: handleSetSearch,
        search,
        refetch: fetchTools,
    };
}
