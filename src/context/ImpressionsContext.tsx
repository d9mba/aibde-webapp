'use client';

import { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from 'react';
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
    loading: true,
    getImpressions: () => 0,
});

export function useImpressions() {
    return useContext(ImpressionsContext);
}

export function ImpressionsProvider({ children }: { children: ReactNode }) {
    const [impressions, setImpressions] = useState<ToolImpressions>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const fetchImpressions = async () => {
            try {
                const data = await getImpressionsAction();
                if (!cancelled) setImpressions(data);
            } catch (err) {
                if (process.env.NODE_ENV === 'development') {
                    console.warn('Failed to fetch impressions:', err);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchImpressions();
        return () => { cancelled = true; };
    }, []);

    const getImpressions = useCallback((slug: string) => impressions[slug] || 0, [impressions]);

    const value = useMemo(() => ({ impressions, loading, getImpressions }), [impressions, loading, getImpressions]);

    return (
        <ImpressionsContext.Provider value={value}>
            {children}
        </ImpressionsContext.Provider>
    );
}
