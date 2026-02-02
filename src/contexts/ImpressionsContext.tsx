'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

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
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        const fetchImpressions = async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/public/impressions');

                if (res.ok) {
                    const data = await res.json();
                    if (data.impressions) {
                        setImpressions(data.impressions);
                    }
                }
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

