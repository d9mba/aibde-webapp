'use client';

import { useState, useEffect, useRef } from 'react';
import useSWR from 'swr';

interface TaxonomyItem {
    value: string;
    label: string;
}

const fetcher = async (url: string) => {
    const r = await fetch(url);
    if (!r.ok) {
        const text = await r.text().catch(() => '');
        throw new Error(`${r.status}: ${text || r.statusText}`);
    }
    return r.json();
};

/**
 * Search-as-you-type hook for taxonomy data (categories, tasks, tags).
 * Fetches matching items from the API as the user types, with debouncing.
 */
export function useTaxonomySearch(
    endpoint: '/api/categories' | '/api/tasks' | '/api/tags',
    nameField: 'categoryName' | 'taskName' | 'tagName',
) {
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    // Debounce search input (300ms)
    useEffect(() => {
        timerRef.current = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(timerRef.current);
    }, [search]);

    // Build API URL - fetch initial batch + search results
    const apiUrl = debouncedSearch.length >= 1
        ? `${endpoint}?search=${encodeURIComponent(debouncedSearch)}&limit=50`
        : `${endpoint}?limit=50`;

    const { data, error, isLoading, isValidating } = useSWR(apiUrl, fetcher, {
        revalidateOnFocus: false,
        keepPreviousData: true,
    });

    // Map API response to ComboboxOption format
    const items: TaxonomyItem[] = (data?.data || (Array.isArray(data) ? data : []))
        .map((item: Record<string, unknown>) => ({
            value: String((nameField in item ? item[nameField] : '') ?? ''),
            label: String((nameField in item ? item[nameField] : '') ?? ''),
        }))
        .filter((item: TaxonomyItem) => item.value !== '' && item.value != null);

    return {
        options: items,
        loading: isValidating || (!data && isLoading),
        error,
        onSearchChange: setSearch,
    };
}
