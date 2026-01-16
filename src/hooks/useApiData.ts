'use client';

import useSWR, { SWRConfiguration, mutate } from 'swr';
import { AdminTool, Category, Task, Tag, Note } from '@/types';

// Default fetcher for SWR
const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) {
        const error = new Error('Failed to fetch data');
        throw error;
    }
    return res.json();
};

// SWR configuration with caching
const defaultConfig: SWRConfiguration = {
    revalidateOnFocus: false,     // Don't refetch on window focus
    revalidateOnReconnect: false, // Don't refetch on reconnect
    dedupingInterval: 60000,      // Dedupe requests within 1 minute
    errorRetryCount: 2,           // Retry twice on error
};

// Long cache config for rarely changing data
const longCacheConfig: SWRConfiguration = {
    ...defaultConfig,
    revalidateIfStale: false,     // Don't refetch stale data automatically
    dedupingInterval: 300000,     // 5 minute deduplication
};

// API endpoints
const API_ENDPOINTS = {
    tools: '/api/tools',
    categories: '/api/categories',
    tasks: '/api/tasks',
    tags: '/api/tags',
    notes: '/api/notes',
    settings: '/api/settings',
    publicTools: '/api/public/tools',
};

// Pagination response type
interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

/**
 * Hook for fetching paginated tools (admin)
 */
export function useTools(page = 1, limit = 50, options?: SWRConfiguration) {
    const { data, error, isLoading, mutate: revalidate } = useSWR<PaginatedResponse<AdminTool>>(
        `${API_ENDPOINTS.tools}?page=${page}&limit=${limit}`,
        fetcher,
        { ...defaultConfig, ...options }
    );

    return {
        tools: data?.data || [],
        pagination: data?.pagination,
        isLoading,
        isError: !!error,
        error,
        revalidate,
    };
}

/**
 * Hook for fetching all tools at once (admin - for search, etc.)
 */
export function useAllTools(options?: SWRConfiguration) {
    const { data, error, isLoading, mutate: revalidate } = useSWR<AdminTool[]>(
        `${API_ENDPOINTS.tools}?all=true`,
        fetcher,
        { ...longCacheConfig, ...options }
    );

    return {
        tools: data || [],
        isLoading,
        isError: !!error,
        error,
        revalidate,
    };
}

/**
 * Hook for fetching categories
 */
export function useCategories(options?: SWRConfiguration) {
    const { data, error, isLoading, mutate: revalidate } = useSWR<Category[]>(
        API_ENDPOINTS.categories,
        fetcher,
        { ...longCacheConfig, ...options }
    );

    return {
        categories: data || [],
        isLoading,
        isError: !!error,
        error,
        revalidate,
    };
}

/**
 * Hook for fetching tasks
 */
export function useTasks(options?: SWRConfiguration) {
    const { data, error, isLoading, mutate: revalidate } = useSWR<Task[]>(
        API_ENDPOINTS.tasks,
        fetcher,
        { ...longCacheConfig, ...options }
    );

    return {
        tasks: data || [],
        isLoading,
        isError: !!error,
        error,
        revalidate,
    };
}

/**
 * Hook for fetching tags
 */
export function useTags(options?: SWRConfiguration) {
    const { data, error, isLoading, mutate: revalidate } = useSWR<Tag[]>(
        API_ENDPOINTS.tags,
        fetcher,
        { ...longCacheConfig, ...options }
    );

    return {
        tags: data || [],
        isLoading,
        isError: !!error,
        error,
        revalidate,
    };
}

/**
 * Hook for fetching notes
 */
export function useNotes(options?: SWRConfiguration) {
    const { data, error, isLoading, mutate: revalidate } = useSWR<Note[]>(
        API_ENDPOINTS.notes,
        fetcher,
        { ...defaultConfig, ...options }
    );

    return {
        notes: data || [],
        isLoading,
        isError: !!error,
        error,
        revalidate,
    };
}

/**
 * Hook for fetching settings
 */
export function useSettings(options?: SWRConfiguration) {
    const { data, error, isLoading, mutate: revalidate } = useSWR(
        API_ENDPOINTS.settings,
        fetcher,
        { ...longCacheConfig, ...options }
    );

    return {
        settings: data || null,
        isLoading,
        isError: !!error,
        error,
        revalidate,
    };
}

/**
 * Hook for fetching public tools (paginated)
 */
export function usePublicTools(page = 1, limit = 20, options?: SWRConfiguration) {
    const { data, error, isLoading } = useSWR<PaginatedResponse<AdminTool>>(
        `${API_ENDPOINTS.publicTools}?page=${page}&limit=${limit}`,
        fetcher,
        { ...longCacheConfig, ...options }
    );

    return {
        tools: data?.data || [],
        pagination: data?.pagination,
        isLoading,
        isError: !!error,
        error,
    };
}

/**
 * Invalidate all API caches
 * Call this after mutations to refresh data
 */
export function invalidateAllCaches() {
    mutate(key => typeof key === 'string' && key.startsWith('/api/'), undefined, { revalidate: true });
}

/**
 * Invalidate specific API cache
 */
export function invalidateCache(endpoint: keyof typeof API_ENDPOINTS) {
    mutate(key => typeof key === 'string' && key.startsWith(API_ENDPOINTS[endpoint]), undefined, { revalidate: true });
}
