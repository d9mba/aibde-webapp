'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getImpressionsAction } from '@/lib/actions';

interface ToolImpressions {
    [slug: string]: number;
}

interface ImpressionsContextType {
    impressions: ToolImpressions;
    loading: boolean;
    getImpressions: (slug: string) => number;
}

const ImpressionsContext = createContext<ImpressionsContextType>({
    impressions: {},
    loading: false,
    getImpressions: () => 0,
});

export function useImpressions() {
    return useContext(ImpressionsContext);
}

export function ImpressionsProvider({ children }: { children: ReactNode }) {
    const [impressions, setImpressions] = useState<ToolImpressions>({});
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        const fetchImpressions = async () => {
            try {
                const data = await getImpressionsAction();
                setImpressions(data);
            } catch {
                // Silently fail - impressions will default to 0
            } finally {
                setLoading(false);
            }
        };

        fetchImpressions();
    }, [mounted]);

    const getImpressions = (slug: string) => impressions[slug] || 0;

    return (
        <ImpressionsContext.Provider value={{ impressions, loading, getImpressions }}>
            {children}
        </ImpressionsContext.Provider>
    );
}
