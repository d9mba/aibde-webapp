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
                const res = await fetch('/api/analytics/posthog', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'top_tools', days: 365 }),
                });

                if (res.ok) {
                    const data = await res.json();
                    const impressionMap: ToolImpressions = {};

                    if (data.results) {
                        data.results.forEach((row: { tool_slug: string; impressions: number }) => {
                            if (row.tool_slug) {
                                impressionMap[row.tool_slug] = row.impressions || 0;
                            }
                        });
                    }

                    setImpressions(impressionMap);
                }
                // Silently fail for non-authenticated users - they just see 0 impressions
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
