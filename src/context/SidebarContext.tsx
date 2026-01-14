'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface SidebarContextType {
    isPinned: boolean;
    setIsPinned: (pinned: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
    const [isPinned, setIsPinned] = useState(false);

    return (
        <SidebarContext.Provider value={{ isPinned, setIsPinned }}>
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebar() {
    const context = useContext(SidebarContext);
    if (context === undefined) {
        throw new Error('useSidebar must be used within a SidebarProvider');
    }
    return context;
}
