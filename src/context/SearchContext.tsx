'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SearchContextType {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    isMainSearchFocused: boolean;
    setIsMainSearchFocused: (focused: boolean) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isMainSearchFocused, setIsMainSearchFocused] = useState(false);

    return (
        <SearchContext.Provider value={{ searchQuery, setSearchQuery, isMainSearchFocused, setIsMainSearchFocused }}>
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
