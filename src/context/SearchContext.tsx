'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AdminTool } from '@/types';

interface SearchContextType {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    isMainSearchFocused: boolean;
    setIsMainSearchFocused: (focused: boolean) => void;
    // Shared tools for search recommendations across components
    sharedTools: AdminTool[];
    setSharedTools: (tools: AdminTool[]) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isMainSearchFocused, setIsMainSearchFocused] = useState(false);
    const [sharedTools, setSharedTools] = useState<AdminTool[]>([]);

    return (
        <SearchContext.Provider value={{
            searchQuery,
            setSearchQuery,
            isMainSearchFocused,
            setIsMainSearchFocused,
            sharedTools,
            setSharedTools
        }}>
            {children}
        </SearchContext.Provider>
    );
}

export function useSearch() {
    const context = useContext(SearchContext);
    if (!context) {
        throw new Error('useSearch must be used within a SearchProvider');
    }
    return context;
}

// Optional hook that doesn't throw if used outside provider
export function useSearchOptional() {
    return useContext(SearchContext);
}
