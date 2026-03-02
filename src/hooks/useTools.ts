'use client';

import { useState, useEffect, useCallback } from 'react';
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
        all = false, deps = 0,
    } = options;

    const [tools, setTools] = useState<AdminTool[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(initialPage);
    const [search, setSearch] = useState(options.search || '');

    const fetchTools = useCallback(async () => {
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

            const res = await fetch(`/api/tools?${params.toString()}`);
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to fetch tools');
            }
            const json = await res.json();

            // API returns { data: [...], pagination: { total, page, limit, totalPages } }
            const data = json.data || json;
            setTools(Array.isArray(data) ? data : []);
            setTotalCount(json.pagination?.total ?? (Array.isArray(data) ? data.length : 0));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch tools');
            setTools([]);
        } finally {
            setLoading(false);
        }
    }, [page, search, status, featured, spotlight, listing, trending, limit, all, deps]);

    useEffect(() => { fetchTools(); }, [fetchTools]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
        tools,
        loading,
        error,
        totalCount,
        page,
        totalPages,
        setPage,
        setSearch,
        search,
        refetch: fetchTools,
    };
}
