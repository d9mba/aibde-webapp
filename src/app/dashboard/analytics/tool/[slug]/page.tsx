'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft, Eye, MousePointer, ExternalLink, TrendingUp, TrendingDown,
    RefreshCw, Loader2, BarChart3, Calendar, Clock
} from 'lucide-react';

interface DailyTrend {
    date: string;
    impressions: number;
    clicks: number;
    page_views: number;
    website_visits: number;
    avg_time_seconds: number | null;
}

interface ToolStats {
    impressions: number;
    clicks: number;
    page_views: number;
    website_visits: number;
    avg_time_seconds: number | null;
}

export default function ToolAnalyticsPage() {
    const params = useParams();
    const router = useRouter();
    const toolSlug = params.slug as string;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dailyTrend, setDailyTrend] = useState<DailyTrend[]>([]);
    const [stats, setStats] = useState<ToolStats | null>(null);
    const [previousStats, setPreviousStats] = useState<ToolStats | null>(null);


    // Date range state - default to today (local time)
    const [startDate, setStartDate] = useState<string>(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });
    const [endDate, setEndDate] = useState<string>(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });

    // Use refs to track dates for Apply button (not auto-fetch)
    const [appliedStartDate, setAppliedStartDate] = useState(startDate);
    const [appliedEndDate, setAppliedEndDate] = useState(endDate);

    // Track which preset is selected
    const [selectedPreset, setSelectedPreset] = useState<'today' | 'yesterday' | '7days' | 'alltime' | 'custom'>('today');

    const fetchData = useCallback(async (fetchStartDate: string, fetchEndDate: string) => {
        setLoading(true);
        setError(null);
        try {
            // Fetch daily trend
            const trendRes = await fetch('/api/analytics/posthog', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'tool_daily_trend',
                    toolSlug,
                    startDate: fetchStartDate,
                    endDate: fetchEndDate,
                }),
            });
            if (trendRes.ok) {
                const data = await trendRes.json();
                setDailyTrend(data.results || []);

                // Calculate totals from trend data
                if (data.results?.length) {
                    const daysWithTime = data.results.filter((d: DailyTrend) => d.avg_time_seconds && d.avg_time_seconds > 0);
                    const avgTime = daysWithTime.length > 0
                        ? daysWithTime.reduce((sum: number, d: DailyTrend) => sum + (d.avg_time_seconds || 0), 0) / daysWithTime.length
                        : null;

                    const totals = data.results.reduce((acc: ToolStats, day: DailyTrend) => ({
                        impressions: acc.impressions + day.impressions,
                        clicks: acc.clicks + day.clicks,
                        page_views: acc.page_views + day.page_views,
                        website_visits: acc.website_visits + day.website_visits,
                        avg_time_seconds: avgTime,
                    }), { impressions: 0, clicks: 0, page_views: 0, website_visits: 0, avg_time_seconds: avgTime });
                    setStats(totals);
                } else {
                    setStats({ impressions: 0, clicks: 0, page_views: 0, website_visits: 0, avg_time_seconds: null });
                }
            }

            // Fetch previous period for comparison
            const daysDiff = Math.ceil((new Date(fetchEndDate).getTime() - new Date(fetchStartDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
            const prevEnd = new Date(fetchStartDate);
            prevEnd.setDate(prevEnd.getDate() - 1);
            const prevStart = new Date(prevEnd);
            prevStart.setDate(prevStart.getDate() - daysDiff + 1);

            const prevRes = await fetch('/api/analytics/posthog', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'tool_daily_trend',
                    toolSlug,
                    startDate: prevStart.toISOString().split('T')[0],
                    endDate: prevEnd.toISOString().split('T')[0],
                }),
            });
            if (prevRes.ok) {
                const data = await prevRes.json();
                if (data.results?.length) {
                    const totals = data.results.reduce((acc: ToolStats, day: DailyTrend) => ({
                        impressions: acc.impressions + day.impressions,
                        clicks: acc.clicks + day.clicks,
                        page_views: acc.page_views + day.page_views,
                        website_visits: acc.website_visits + day.website_visits,
                        avg_time_seconds: null,
                    }), { impressions: 0, clicks: 0, page_views: 0, website_visits: 0, avg_time_seconds: null });
                    setPreviousStats(totals);
                } else {
                    setPreviousStats(null);
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load');
        } finally {
            setLoading(false);
        }
    }, [toolSlug]);

    // Only fetch on initial mount
    useEffect(() => {
        fetchData(appliedStartDate, appliedEndDate);
    }, [toolSlug]); // eslint-disable-line react-hooks/exhaustive-deps

    // Handle Apply button click
    const handleApply = () => {
        setAppliedStartDate(startDate);
        setAppliedEndDate(endDate);
        fetchData(startDate, endDate);
    };

    const getChange = (current: number, previous: number) => {
        if (!previous) return null;
        return ((current - previous) / previous) * 100;
    };

    const formatChange = (change: number | null) => {
        if (change === null) return null;
        const isPositive = change >= 0;
        return (
            <span className={`flex items-center gap-1 text-sm ${isPositive ? 'text-accent-green' : 'text-accent-red'}`}>
                {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {isPositive ? '+' : ''}{change.toFixed(1)}%
            </span>
        );
    };

    const maxValue = Math.max(...dailyTrend.map(d => Math.max(d.impressions, d.clicks, d.page_views, d.website_visits)), 1);

    return (
        <div className="p-4 sm:p-6 max-w-[1200px] mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => router.back()}
                    className="p-2 bg-bg-secondary border border-border rounded-lg hover:bg-bg-tertiary transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="flex-1">
                    <h1 className="text-xl sm:text-2xl font-bold text-text-primary">{toolSlug}</h1>
                    <p className="text-sm text-text-secondary">Tool Analytics</p>
                </div>
                <button
                    onClick={() => fetchData(appliedStartDate, appliedEndDate)}
                    disabled={loading}
                    className="px-4 py-2 bg-bg-secondary border border-border rounded-lg flex items-center gap-2 hover:bg-bg-tertiary disabled:opacity-50"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Date Range */}
            <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-bg-card border border-border rounded-xl">
                <Calendar size={18} className="text-accent-primary" />
                <span className="text-sm text-text-secondary">Date Range:</span>
                <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-bg-secondary border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary"
                />
                <span className="text-text-tertiary">to</span>
                <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-bg-secondary border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary"
                />
                <button
                    onClick={handleApply}
                    className="px-3 py-1.5 bg-accent-primary text-white text-sm rounded-lg hover:bg-accent-primary/90"
                >
                    Apply
                </button>

                {/* Quick date buttons */}
                <div className="flex gap-1 ml-2">
                    <button
                        onClick={() => {
                            const today = new Date();
                            const td = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                            setStartDate(td);
                            setEndDate(td);
                            setAppliedStartDate(td);
                            setAppliedEndDate(td);
                            setSelectedPreset('today');
                            fetchData(td, td);
                        }}
                        className={`px-2 py-1 text-xs rounded ${selectedPreset === 'today' ? 'bg-accent-primary text-white' : 'bg-bg-secondary border border-border text-text-secondary hover:bg-bg-tertiary'}`}
                    >
                        Today
                    </button>
                    <button
                        onClick={() => {
                            const yesterday = new Date();
                            yesterday.setDate(yesterday.getDate() - 1);
                            const yd = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
                            setStartDate(yd);
                            setEndDate(yd);
                            setAppliedStartDate(yd);
                            setAppliedEndDate(yd);
                            setSelectedPreset('yesterday');
                            fetchData(yd, yd);
                        }}
                        className={`px-2 py-1 text-xs rounded ${selectedPreset === 'yesterday' ? 'bg-accent-primary text-white' : 'bg-bg-secondary border border-border text-text-secondary hover:bg-bg-tertiary'}`}
                    >
                        Yesterday
                    </button>
                    <button
                        onClick={() => {
                            const end = new Date();
                            const ed = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
                            const start = new Date();
                            start.setDate(start.getDate() - 6);
                            const sd = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
                            setStartDate(sd);
                            setEndDate(ed);
                            setAppliedStartDate(sd);
                            setAppliedEndDate(ed);
                            setSelectedPreset('7days');
                            fetchData(sd, ed);
                        }}
                        className={`px-2 py-1 text-xs rounded ${selectedPreset === '7days' ? 'bg-accent-primary text-white' : 'bg-bg-secondary border border-border text-text-secondary hover:bg-bg-tertiary'}`}
                    >
                        7 Days
                    </button>
                    <button
                        onClick={() => {
                            const end = new Date();
                            const ed = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
                            const start = new Date();
                            start.setFullYear(start.getFullYear() - 1);
                            const sd = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
                            setStartDate(sd);
                            setEndDate(ed);
                            setAppliedStartDate(sd);
                            setAppliedEndDate(ed);
                            setSelectedPreset('alltime');
                            fetchData(sd, ed);
                        }}
                        className={`px-2 py-1 text-xs rounded ${selectedPreset === 'alltime' ? 'bg-accent-primary text-white' : 'bg-bg-secondary border border-border text-text-secondary hover:bg-bg-tertiary'}`}
                    >
                        All Time
                    </button>
                </div>

                {/* Comparison Info */}
                <div className="ml-auto text-xs text-text-tertiary bg-bg-secondary px-3 py-1.5 rounded-lg">
                    Comparing with previous {Math.ceil((new Date(appliedEndDate).getTime() - new Date(appliedStartDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} days
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-accent-red/10 border border-accent-red/30 rounded-xl text-accent-red">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="animate-spin text-accent-primary" size={48} />
                </div>
            ) : (
                <>
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-bg-card border border-border rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Eye size={18} className="text-accent-blue" />
                                <span className="text-sm text-text-secondary">Impressions</span>
                            </div>
                            <div className="text-2xl font-bold text-text-primary">{(stats?.impressions || 0).toLocaleString()}</div>
                            {previousStats && formatChange(getChange(stats?.impressions || 0, previousStats.impressions))}
                        </div>
                        <div className="bg-bg-card border border-border rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <MousePointer size={18} className="text-accent-primary" />
                                <span className="text-sm text-text-secondary">Clicks</span>
                            </div>
                            <div className="text-2xl font-bold text-text-primary">{(stats?.clicks || 0).toLocaleString()}</div>
                            {previousStats && formatChange(getChange(stats?.clicks || 0, previousStats.clicks))}
                        </div>
                        <div className="bg-bg-card border border-border rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <BarChart3 size={18} className="text-accent-green" />
                                <span className="text-sm text-text-secondary">Page Views</span>
                            </div>
                            <div className="text-2xl font-bold text-text-primary">{(stats?.page_views || 0).toLocaleString()}</div>
                            {previousStats && formatChange(getChange(stats?.page_views || 0, previousStats.page_views))}
                        </div>
                        <div className="bg-bg-card border border-border rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <ExternalLink size={18} className="text-accent-orange" />
                                <span className="text-sm text-text-secondary">Outbound</span>
                            </div>
                            <div className="text-2xl font-bold text-text-primary">{(stats?.website_visits || 0).toLocaleString()}</div>
                            {previousStats && formatChange(getChange(stats?.website_visits || 0, previousStats.website_visits))}
                        </div>
                    </div>

                    {/* CTR & Avg Time Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="bg-bg-card border border-border rounded-xl p-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-text-secondary">Click-Through Rate (CTR)</span>
                                <span className="text-2xl font-bold text-accent-primary">
                                    {stats && stats.impressions > 0 ? ((stats.clicks / stats.impressions) * 100).toFixed(2) + '%' : '0%'}
                                </span>
                            </div>
                        </div>
                        <div className="bg-bg-card border border-border rounded-xl p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Clock size={18} className="text-accent-yellow" />
                                    <span className="text-sm text-text-secondary">Avg Time on Page</span>
                                </div>
                                <span className="text-2xl font-bold text-accent-yellow">
                                    {stats?.avg_time_seconds
                                        ? stats.avg_time_seconds >= 60
                                            ? `${Math.floor(stats.avg_time_seconds / 60)}m ${Math.round(stats.avg_time_seconds % 60)}s`
                                            : `${Math.round(stats.avg_time_seconds)}s`
                                        : '-'
                                    }
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Daily Trend Chart */}
                    <div className="bg-bg-card border border-border rounded-xl p-5">
                        <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                            <BarChart3 size={18} className="text-accent-primary" />
                            Daily Trend
                        </h3>
                        {dailyTrend.length > 0 ? (
                            <div className="relative h-64">
                                {/* Y-axis label */}
                                <div className="absolute -left-2 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-text-tertiary font-medium">
                                    Impressions
                                </div>
                                {/* Y-axis values */}
                                <div className="absolute left-4 top-0 bottom-8 w-12 flex flex-col justify-between text-xs text-text-tertiary text-right">
                                    <span>{maxValue.toLocaleString()}</span>
                                    <span>{Math.round(maxValue / 2).toLocaleString()}</span>
                                    <span>0</span>
                                </div>
                                {/* Chart area */}
                                <div className="ml-20 mr-4 h-52 flex items-end gap-1 border-l border-b border-border">
                                    {dailyTrend.map((day) => {
                                        const barHeightPx = maxValue > 0 ? Math.round((day.impressions / maxValue) * 200) : 0;
                                        return (
                                            <div key={day.date} className="flex-1 flex flex-col justify-end h-full group relative">
                                                <div
                                                    className="w-full bg-accent-primary rounded-t transition-all hover:bg-accent-primary/80"
                                                    style={{ height: `${Math.max(barHeightPx, 4)}px` }}
                                                />
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-bg-tertiary border border-border px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 whitespace-nowrap z-20 pointer-events-none shadow-lg">
                                                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                    <br />
                                                    Imp: {day.impressions} | Clicks: {day.clicks}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {/* X-axis */}
                                <div className="ml-20 mr-4 flex justify-between mt-2 text-xs text-text-tertiary">
                                    {dailyTrend.length <= 14 ? (
                                        dailyTrend.map((day) => (
                                            <span key={day.date} className="flex-1 text-center">
                                                {new Date(day.date).getDate()}
                                            </span>
                                        ))
                                    ) : (
                                        <>
                                            <span>{new Date(dailyTrend[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                            <span>{new Date(dailyTrend[dailyTrend.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                        </>
                                    )}
                                </div>
                                {/* X-axis label */}
                                <div className="text-center text-xs text-text-tertiary mt-2 font-medium">
                                    Date
                                </div>
                            </div>
                        ) : (
                            <div className="h-64 flex items-center justify-center text-text-tertiary">
                                No data for this period
                            </div>
                        )}
                    </div>

                    {/* Quick Links */}
                    <div className="mt-6 flex flex-wrap gap-3">
                        <Link
                            href={`/app/${toolSlug}`}
                            className="px-4 py-2 bg-bg-secondary border border-border rounded-lg text-sm flex items-center gap-2 hover:bg-bg-tertiary transition-colors"
                        >
                            <ExternalLink size={16} /> View Tool Page
                        </Link>
                        <a
                            href={`https://us.posthog.com/project/291386/events?properties=%5B%7B%22key%22%3A%22tool_slug%22%2C%22value%22%3A%22${toolSlug}%22%7D%5D`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-accent-teal text-white rounded-lg text-sm flex items-center gap-2 hover:bg-accent-teal/90 transition-colors"
                        >
                            <ExternalLink size={16} /> View in PostHog
                        </a>
                    </div>
                </>
            )}
        </div>
    );
}
