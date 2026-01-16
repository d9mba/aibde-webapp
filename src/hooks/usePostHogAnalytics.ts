'use client';

import { useState, useEffect, useCallback } from 'react';

interface ToolAnalytics {
    impressions: number;
    clicks: number;
    page_views: number;
    website_visits: number;
    avg_time: number;
}

interface TopTool {
    tool_slug: string;
    tool_name: string;
    impressions: number;
    clicks: number;
    page_views: number;
    website_visits: number;
}

interface DailyActivity {
    date: string;
    events: number;
}

interface HourlyActivity {
    hour: number;
    events: number;
}

interface UsePostHogAnalyticsReturn {
    loading: boolean;
    error: string | null;
    isConfigured: boolean;
    topTools: TopTool[];
    dailyActivity: DailyActivity[];
    hourlyActivity: HourlyActivity[];
    getToolStats: (toolSlug: string) => Promise<ToolAnalytics | null>;
    refresh: () => void;
}

/**
 * Hook to fetch PostHog analytics data
 */
export function usePostHogAnalytics(): UsePostHogAnalyticsReturn {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isConfigured, setIsConfigured] = useState(false);
    const [topTools, setTopTools] = useState<TopTool[]>([]);
    const [dailyActivity, setDailyActivity] = useState<DailyActivity[]>([]);
    const [hourlyActivity, setHourlyActivity] = useState<HourlyActivity[]>([]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // Fetch top tools
            const topToolsRes = await fetch('/api/analytics/posthog', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'top_tools', days: 7 }),
            });

            if (!topToolsRes.ok) {
                const data = await topToolsRes.json();
                if (data.details?.includes('not configured')) {
                    setIsConfigured(false);
                    setLoading(false);
                    return;
                }
                throw new Error(data.error || 'Failed to fetch top tools');
            }

            setIsConfigured(true);
            const topToolsData = await topToolsRes.json();
            setTopTools(topToolsData.results || []);

            // Fetch daily activity
            const dailyRes = await fetch('/api/analytics/posthog', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'daily_activity', days: 7 }),
            });
            if (dailyRes.ok) {
                const dailyData = await dailyRes.json();
                setDailyActivity(dailyData.results || []);
            }

            // Fetch hourly activity
            const hourlyRes = await fetch('/api/analytics/posthog', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'hourly_activity' }),
            });
            if (hourlyRes.ok) {
                const hourlyData = await hourlyRes.json();
                setHourlyActivity(hourlyData.results || []);
            }

        } catch (err) {
            console.error('[PostHog Analytics] Error:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const getToolStats = useCallback(async (toolSlug: string): Promise<ToolAnalytics | null> => {
        try {
            const res = await fetch('/api/analytics/posthog', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'tool_stats', toolSlug, days: 7 }),
            });

            if (!res.ok) return null;

            const data = await res.json();
            const results = data.results || [];

            // Aggregate results by event type
            const stats: ToolAnalytics = {
                impressions: 0,
                clicks: 0,
                page_views: 0,
                website_visits: 0,
                avg_time: 0,
            };

            for (const row of results) {
                switch (row.event) {
                    case 'tool_impression':
                        stats.impressions = row.count;
                        break;
                    case 'tool_clicked':
                        stats.clicks = row.count;
                        break;
                    case 'tool_page_viewed':
                        stats.page_views = row.count;
                        break;
                    case 'tool_website_visited':
                        stats.website_visits = row.count;
                        break;
                }
            }

            return stats;
        } catch {
            return null;
        }
    }, []);

    return {
        loading,
        error,
        isConfigured,
        topTools,
        dailyActivity,
        hourlyActivity,
        getToolStats,
        refresh: fetchData,
    };
}
