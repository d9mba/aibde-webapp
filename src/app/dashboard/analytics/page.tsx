'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAdmin, AdminTool, Category, Task } from '@/context/AdminContext';
import { renderIcon } from '@/components/features/admin/AdminLayout';
import {
    Search, Eye, MousePointer, Clock, ExternalLink, TrendingUp, BarChart3, X,
    RefreshCw, Loader2, Users, Globe, Tag, Filter, Zap, Activity
} from 'lucide-react';

// CDN URL helper
const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || '';
const getFullUrl = (path: string): string => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${CDN_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

interface SummaryStats {
    pageviews: number;
    impressions: number;
    clicks: number;
    tool_views: number;
    website_visits: number;
    searches: number;
    shares: number;
    unique_visitors: number;
    avg_time_on_site: number | null;
}

interface TopTool {
    tool_slug: string;
    tool_name: string;
    impressions: number;
    clicks: number;
    page_views: number;
    website_visits: number;
    avg_time_seconds: number | null;
}

interface FilterStat {
    filter_type: string;
    filter_value: string;
    uses: number;
}

interface SearchQuery {
    query: string;
    searches: number;
    avg_results: number;
}

interface DailyData {
    date: string;
    events: number;
}

interface HourlyData {
    hour: number;
    events: number;
}

interface RealtimeEvent {
    event: string;
    tool_name: string;
    tool_slug: string;
    timestamp: string;
}

export default function AnalysisPage() {
    const { tools, categories, tasks } = useAdmin();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isConfigured, setIsConfigured] = useState(true);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [selectedTab, setSelectedTab] = useState<'overview' | 'tools' | 'categories' | 'realtime'>('overview');
    const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('week');

    // Get days based on time range
    const getDays = () => {
        switch (timeRange) {
            case 'today': return 1;
            case 'week': return 7;
            case 'month': return 30;
        }
    };

    // Data states
    const [summary, setSummary] = useState<SummaryStats | null>(null);
    const [topTools, setTopTools] = useState<TopTool[]>([]);
    const [dailyActivity, setDailyActivity] = useState<DailyData[]>([]);
    const [hourlyActivity, setHourlyActivity] = useState<HourlyData[]>([]);
    const [filterStats, setFilterStats] = useState<FilterStat[]>([]);
    const [searchQueries, setSearchQueries] = useState<SearchQuery[]>([]);
    const [realtimeEvents, setRealtimeEvents] = useState<RealtimeEvent[]>([]);
    const [referrerStats, setReferrerStats] = useState<{ referrer: string; visits: number }[]>([]);
    const [pageUrls, setPageUrls] = useState<{ page: string; views: number }[]>([]);

    // Tools tab state
    const [toolsSearch, setToolsSearch] = useState('');
    const [toolsSortBy, setToolsSortBy] = useState<'impressions' | 'clicks' | 'page_views' | 'ctr'>('impressions');
    const [toolsPage, setToolsPage] = useState(1);
    const TOOLS_PER_PAGE = 25;

    // Fetch helper
    const fetchData = useCallback(async (type: string, extraParams = {}) => {
        const res = await fetch('/api/analytics/posthog', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, days: getDays(), ...extraParams }),
        });
        if (!res.ok) {
            const data = await res.json();
            if (data.details?.includes('not configured')) {
                setIsConfigured(false);
                return null;
            }
            throw new Error(data.error || 'API Error');
        }
        return (await res.json()).results;
    }, [timeRange]);

    // Load all data
    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [summaryData, topToolsData, dailyData, hourlyData, filterData, searchData, referrerData, pageData] = await Promise.all([
                fetchData('summary'),
                fetchData('top_tools'),
                fetchData('daily_activity'),
                fetchData('hourly_activity'),
                fetchData('filter_stats'),
                fetchData('search_queries'),
                fetchData('referrer_stats'),
                fetchData('page_urls'),
            ]);

            if (summaryData?.[0]) setSummary(summaryData[0]);
            if (topToolsData) setTopTools(topToolsData);
            if (dailyData) setDailyActivity(dailyData);
            if (hourlyData) setHourlyActivity(hourlyData);
            if (filterData) setFilterStats(filterData);
            if (searchData) setSearchQueries(searchData);
            if (referrerData) setReferrerStats(referrerData);
            if (pageData) setPageUrls(pageData);
            setLastRefresh(new Date());
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load');
        } finally {
            setLoading(false);
        }
    }, [fetchData]);

    // Load realtime
    const loadRealtime = useCallback(async () => {
        try {
            const data = await fetchData('realtime');
            if (data) setRealtimeEvents(data);
        } catch { /* ignore */ }
    }, [fetchData]);

    useEffect(() => {
        loadData();
    }, [loadData, timeRange]);

    // Auto-refresh
    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(() => {
            if (selectedTab === 'realtime') {
                loadRealtime();
            } else {
                loadData();
            }
        }, 30000);
        return () => clearInterval(interval);
    }, [autoRefresh, selectedTab, loadData, loadRealtime]);

    // Load realtime when tab selected
    useEffect(() => {
        if (selectedTab === 'realtime') loadRealtime();
    }, [selectedTab, loadRealtime]);

    // Stats calculations
    const publishedCount = tools.filter((t: AdminTool) => t.status === 'published').length;
    const maxDaily = Math.max(...dailyActivity.map(d => d.events), 1);
    const maxHourly = Math.max(...hourlyActivity.map(h => h.events), 1);
    const categoryFilters = filterStats.filter(f => f.filter_type === 'category');
    const taskFilters = filterStats.filter(f => f.filter_type === 'task');
    const pricingFilters = filterStats.filter(f => f.filter_type === 'pricing');

    // Filtered & sorted tools for Tools tab
    const filteredTools = topTools
        .filter(t => !toolsSearch || (t.tool_name || t.tool_slug).toLowerCase().includes(toolsSearch.toLowerCase()))
        .sort((a, b) => {
            if (toolsSortBy === 'ctr') {
                const ctrA = a.impressions > 0 ? a.clicks / a.impressions : 0;
                const ctrB = b.impressions > 0 ? b.clicks / b.impressions : 0;
                return ctrB - ctrA;
            }
            return (b[toolsSortBy] || 0) - (a[toolsSortBy] || 0);
        });
    const totalToolPages = Math.ceil(filteredTools.length / TOOLS_PER_PAGE);
    const paginatedTools = filteredTools.slice((toolsPage - 1) * TOOLS_PER_PAGE, toolsPage * TOOLS_PER_PAGE);

    // Selected tool for detail view
    const [selectedToolSlug, setSelectedToolSlug] = useState<string | null>(null);
    const selectedToolData = topTools.find(t => t.tool_slug === selectedToolSlug);

    // Format time in seconds to readable string
    const formatTime = (seconds: number | null): string => {
        if (!seconds || seconds < 1) return '-';
        if (seconds < 60) return `${Math.round(seconds)}s`;
        const mins = Math.floor(seconds / 60);
        const secs = Math.round(seconds % 60);
        return `${mins}m ${secs}s`;
    };

    const StatCard = ({ icon: Icon, label, value, color = 'text-text-primary', subtext }: {
        icon: React.ElementType; label: string; value: string | number; color?: string; subtext?: string;
    }) => (
        <div className="bg-bg-card border border-border rounded-xl p-4 hover:border-border-hover transition-colors">
            <div className="flex items-center gap-2 mb-2">
                <div className={`p-2 rounded-lg ${color.replace('text-', 'bg-')}/10`}>
                    <Icon className={color} size={18} />
                </div>
                <span className="text-sm text-text-secondary">{label}</span>
            </div>
            <div className={`text-2xl font-bold ${color}`}>{typeof value === 'number' ? value.toLocaleString() : value}</div>
            {subtext && <p className="text-xs text-text-tertiary mt-1">{subtext}</p>}
        </div>
    );

    return (
        <div className="p-3 sm:p-6 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-text-primary flex items-center gap-2 sm:gap-3">
                        <BarChart3 className="text-accent-primary" size={24} />
                        Analytics
                    </h1>
                    <p className="text-text-secondary text-xs sm:text-sm mt-1" suppressHydrationWarning>
                        Last updated: {lastRefresh.toLocaleTimeString()}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    {/* Time Range Selector */}
                    <div className="flex bg-bg-secondary p-1 rounded-lg">
                        {[
                            { value: 'today', label: 'Today' },
                            { value: 'week', label: 'Week' },
                            { value: 'month', label: 'Month' },
                        ].map(({ value, label }) => (
                            <button
                                key={value}
                                onClick={() => setTimeRange(value as typeof timeRange)}
                                className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm rounded-md transition-colors ${timeRange === value
                                    ? 'bg-accent-primary text-white'
                                    : 'text-text-secondary hover:text-text-primary'
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    <label className="hidden sm:flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                        <input
                            type="checkbox"
                            checked={autoRefresh}
                            onChange={(e) => setAutoRefresh(e.target.checked)}
                            className="rounded border-border"
                        />
                        Auto
                    </label>
                    <button
                        onClick={loadData}
                        disabled={loading}
                        className="px-3 sm:px-4 py-2 bg-bg-secondary border border-border rounded-lg text-xs sm:text-sm flex items-center gap-2 hover:bg-bg-tertiary transition-colors disabled:opacity-50"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                    <a
                        href="https://us.posthog.com/project/291386"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hidden sm:flex px-4 py-2 bg-accent-teal text-white rounded-lg text-sm items-center gap-2 hover:bg-accent-teal/90 transition-colors"
                    >
                        <ExternalLink size={16} /> PostHog
                    </a>
                </div>
            </div>

            {/* Status Banners */}
            {!isConfigured && (
                <div className="mb-6 p-4 bg-accent-yellow/10 border border-accent-yellow/30 rounded-xl flex items-center gap-3">
                    <Activity className="text-accent-yellow" size={24} />
                    <div className="flex-1">
                        <p className="font-medium text-text-primary">PostHog API Not Connected</p>
                        <p className="text-sm text-text-secondary">Add POSTHOG_PERSONAL_API_KEY and POSTHOG_PROJECT_ID to .env.local</p>
                    </div>
                </div>
            )}
            {error && (
                <div className="mb-6 p-4 bg-accent-red/10 border border-accent-red/30 rounded-xl text-accent-red">
                    Error: {error}
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-bg-secondary p-1 rounded-lg overflow-x-auto">
                {[
                    { id: 'overview', label: 'Overview', mobileLabel: 'Overview', icon: BarChart3 },
                    { id: 'tools', label: 'Tools', mobileLabel: 'Tools', icon: Eye },
                    { id: 'categories', label: 'Categories & Tasks', mobileLabel: 'Categories', icon: Tag },
                    { id: 'realtime', label: 'Live', mobileLabel: 'Live', icon: Zap },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setSelectedTab(tab.id as typeof selectedTab)}
                        className={`px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 transition-colors whitespace-nowrap ${selectedTab === tab.id
                            ? 'bg-accent-primary text-white'
                            : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
                            }`}
                    >
                        <tab.icon size={14} />
                        <span className="sm:hidden">{tab.mobileLabel}</span>
                        <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                ))}
            </div>

            {loading && !summary ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="animate-spin text-accent-primary" size={48} />
                </div>
            ) : (
                <>
                    {/* OVERVIEW TAB */}
                    {selectedTab === 'overview' && (
                        <>
                            {/* Summary Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
                                <StatCard icon={Users} label="Visitors" value={summary?.unique_visitors || 0} color="text-accent-primary" />
                                <StatCard icon={Globe} label="Page Views" value={summary?.pageviews || 0} color="text-accent-blue" />
                                <StatCard icon={Eye} label="Impressions" value={summary?.impressions || 0} color="text-accent-green" />
                                <StatCard icon={MousePointer} label="Clicks" value={summary?.clicks || 0} color="text-accent-orange" />
                                <StatCard icon={BarChart3} label="Tool Views" value={summary?.tool_views || 0} color="text-accent-teal" />
                                <StatCard icon={ExternalLink} label="Outbound" value={summary?.website_visits || 0} color="text-accent-teal" />
                                <StatCard icon={Search} label="Searches" value={summary?.searches || 0} color="text-accent-yellow" />
                            </div>

                            {/* Charts Row */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                {/* Daily Activity */}
                                <div className="bg-bg-card border border-border rounded-xl p-5">
                                    <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                                        <BarChart3 size={18} className="text-accent-primary" /> Daily Activity ({timeRange === 'today' ? 'Today' : timeRange === 'week' ? 'Last 7 Days' : 'Last 30 Days'})
                                    </h3>
                                    {dailyActivity.length > 0 ? (
                                        <div className="flex items-end justify-between gap-2 h-40">
                                            {dailyActivity.map((day) => {
                                                const height = maxDaily > 0 ? (day.events / maxDaily) * 140 : 10;
                                                const dateLabel = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                                                return (
                                                    <div key={day.date} className="flex-1 flex flex-col items-center justify-end h-full">
                                                        <div className="w-full relative group flex flex-col justify-end" style={{ height: '140px' }}>
                                                            <div
                                                                className="w-full bg-gradient-to-t from-accent-primary to-accent-primary/60 rounded-t-md transition-all group-hover:from-accent-primary group-hover:to-accent-primary/80"
                                                                style={{ height: `${Math.max(height, 10)}px` }}
                                                            />
                                                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-bg-tertiary px-2 py-1 rounded text-xs text-text-primary opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                                                {day.events.toLocaleString()}
                                                            </div>
                                                        </div>
                                                        <span className="text-xs text-text-tertiary text-center mt-1">{dateLabel.split(' ')[0]}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="h-40 flex items-center justify-center text-text-tertiary">No data</div>
                                    )}
                                </div>

                                {/* Hourly Activity */}
                                <div className="bg-bg-card border border-border rounded-xl p-5">
                                    <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                                        <Clock size={18} className="text-accent-green" /> Today's Activity by Hour
                                    </h3>
                                    {hourlyActivity.length > 0 ? (
                                        <>
                                            <div className="flex items-end justify-between gap-0.5 h-40">
                                                {Array.from({ length: 24 }, (_, i) => {
                                                    const hourData = hourlyActivity.find(h => h.hour === i);
                                                    const events = hourData?.events || 0;
                                                    const height = maxHourly > 0 ? (events / maxHourly) * 130 : 4;
                                                    const isPeak = i >= 9 && i <= 18;
                                                    return (
                                                        <div key={i} className="flex-1 group relative flex flex-col justify-end" style={{ height: '140px' }}>
                                                            <div
                                                                className={`w-full rounded-t transition-all ${isPeak ? 'bg-accent-green' : 'bg-text-tertiary/40'} group-hover:opacity-80`}
                                                                style={{ height: `${Math.max(height, 4)}px` }}
                                                            />
                                                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-bg-tertiary px-2 py-1 rounded text-xs text-text-primary opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                                                {i}:00 - {events}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <div className="flex justify-between mt-2 text-xs text-text-tertiary">
                                                <span>12am</span><span>6am</span><span>12pm</span><span>6pm</span><span>11pm</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="h-40 flex items-center justify-center text-text-tertiary">No data</div>
                                    )}
                                </div>
                            </div>

                            {/* Bottom Row - 5 cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                                {/* Top Tools */}
                                <div className="bg-bg-card border border-border rounded-xl p-5">
                                    <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                                        <TrendingUp size={18} className="text-accent-orange" /> Top Tools
                                    </h3>
                                    <div className="space-y-2">
                                        {topTools.slice(0, 6).map((tool, i) => (
                                            <div key={tool.tool_slug} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-bg-secondary transition-colors">
                                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${i < 3 ? 'bg-accent-primary text-white' : 'bg-bg-tertiary text-text-tertiary'}`}>
                                                    {i + 1}
                                                </span>
                                                <span className="flex-1 text-sm text-text-primary truncate">{tool.tool_name || tool.tool_slug}</span>
                                                <span className="text-xs text-accent-primary font-medium">{tool.impressions.toLocaleString()}</span>
                                            </div>
                                        ))}
                                        {topTools.length === 0 && <p className="text-text-tertiary text-sm text-center py-4">No data yet</p>}
                                    </div>
                                </div>

                                {/* Referrer Sources */}
                                <div className="bg-bg-card border border-border rounded-xl p-5">
                                    <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                                        <Globe size={18} className="text-accent-blue" /> Traffic Sources
                                    </h3>
                                    <div className="space-y-2">
                                        {referrerStats.slice(0, 6).map((ref, i) => (
                                            <div key={i} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-bg-secondary transition-colors">
                                                <span className="flex-1 text-sm text-text-primary truncate">{ref.referrer}</span>
                                                <span className="text-xs text-accent-blue font-medium">{ref.visits.toLocaleString()}</span>
                                            </div>
                                        ))}
                                        {referrerStats.length === 0 && <p className="text-text-tertiary text-sm text-center py-4">No data yet</p>}
                                    </div>
                                </div>

                                {/* Top Pages */}
                                <div className="bg-bg-card border border-border rounded-xl p-5">
                                    <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                                        <Eye size={18} className="text-accent-green" /> Top Pages
                                    </h3>
                                    <div className="space-y-2">
                                        {pageUrls.slice(0, 6).map((pg, i) => (
                                            <div key={i} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-bg-secondary transition-colors">
                                                <span className="flex-1 text-sm text-text-primary truncate">{pg.page || '/'}</span>
                                                <span className="text-xs text-accent-green font-medium">{pg.views.toLocaleString()}</span>
                                            </div>
                                        ))}
                                        {pageUrls.length === 0 && <p className="text-text-tertiary text-sm text-center py-4">No data yet</p>}
                                    </div>
                                </div>

                                {/* Top Searches */}
                                <div className="bg-bg-card border border-border rounded-xl p-5">
                                    <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                                        <Search size={18} className="text-accent-yellow" /> Search Queries
                                    </h3>
                                    <div className="space-y-2">
                                        {searchQueries.slice(0, 6).map((sq, i) => (
                                            <div key={i} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-bg-secondary transition-colors">
                                                <span className="flex-1 text-sm text-text-primary truncate">"{sq.query}"</span>
                                                <span className="text-xs text-text-tertiary">{sq.searches}×</span>
                                            </div>
                                        ))}
                                        {searchQueries.length === 0 && <p className="text-text-tertiary text-sm text-center py-4">No searches yet</p>}
                                    </div>
                                </div>

                                {/* Quick Stats */}
                                <div className="bg-bg-card border border-border rounded-xl p-5">
                                    <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                                        <Activity size={18} className="text-accent-teal" /> Platform
                                    </h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between p-2 bg-bg-secondary rounded-lg">
                                            <span className="text-sm text-text-secondary">Tools</span>
                                            <span className="font-bold text-accent-green">{publishedCount}</span>
                                        </div>
                                        <div className="flex justify-between p-2 bg-bg-secondary rounded-lg">
                                            <span className="text-sm text-text-secondary">Categories</span>
                                            <span className="font-bold text-accent-blue">{categories.length}</span>
                                        </div>
                                        <div className="flex justify-between p-2 bg-bg-secondary rounded-lg">
                                            <span className="text-sm text-text-secondary">Tasks</span>
                                            <span className="font-bold text-accent-orange">{tasks.length}</span>
                                        </div>
                                        <div className="flex justify-between p-2 bg-bg-secondary rounded-lg">
                                            <span className="text-sm text-text-secondary">Avg Page Session</span>
                                            <span className="font-bold text-accent-yellow">
                                                {summary && summary.pageviews > 0 && summary.unique_visitors > 0
                                                    ? `${Math.round(summary.pageviews / summary.unique_visitors)} /user`
                                                    : '-'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between p-2 bg-bg-secondary rounded-lg">
                                            <span className="text-sm text-text-secondary">Avg Time</span>
                                            <span className="font-bold text-accent-teal">
                                                {formatTime(summary?.avg_time_on_site || null)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between p-2 bg-bg-secondary rounded-lg">
                                            <span className="text-sm text-text-secondary">Shares</span>
                                            <span className="font-bold text-accent-purple">{summary?.shares || 0}</span>
                                        </div>
                                        <div className="flex justify-between p-2 bg-bg-secondary rounded-lg">
                                            <span className="text-sm text-text-secondary">Avg CTR</span>
                                            <span className="font-bold text-accent-primary">
                                                {summary && summary.impressions > 0
                                                    ? ((summary.clicks / summary.impressions) * 100).toFixed(1) + '%'
                                                    : '0%'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* TOOLS TAB */}
                    {selectedTab === 'tools' && (
                        <div className="flex gap-6">
                            {/* Main table */}
                            <div className="flex-1 min-w-0">
                                {/* Search & Filter Bar */}
                                <div className="flex gap-3 mb-4">
                                    <div className="flex-1 relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={18} />
                                        <input
                                            type="text"
                                            value={toolsSearch}
                                            onChange={(e) => { setToolsSearch(e.target.value); setToolsPage(1); }}
                                            placeholder="Search tools..."
                                            className="w-full pl-10 pr-4 py-2.5 bg-bg-card border border-border rounded-lg text-text-primary placeholder:text-text-tertiary focus:border-accent-primary focus:outline-none"
                                        />
                                    </div>
                                    <select
                                        value={toolsSortBy}
                                        onChange={(e) => setToolsSortBy(e.target.value as typeof toolsSortBy)}
                                        className="px-4 py-2.5 bg-bg-card border border-border rounded-lg text-text-primary focus:border-accent-primary focus:outline-none cursor-pointer"
                                    >
                                        <option value="impressions">Sort by Impressions</option>
                                        <option value="clicks">Sort by Clicks</option>
                                        <option value="page_views">Sort by Views</option>
                                        <option value="ctr">Sort by CTR</option>
                                    </select>
                                </div>

                                {/* Table */}
                                <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-bg-secondary">
                                                <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">#</th>
                                                <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">Tool</th>
                                                <th className="text-right px-4 py-3 text-sm font-medium text-text-secondary">Impressions</th>
                                                <th className="text-right px-4 py-3 text-sm font-medium text-text-secondary">Clicks</th>
                                                <th className="text-right px-4 py-3 text-sm font-medium text-text-secondary">Views</th>
                                                <th className="text-right px-4 py-3 text-sm font-medium text-text-secondary">Avg Time</th>
                                                <th className="text-right px-4 py-3 text-sm font-medium text-text-secondary">Outbound</th>
                                                <th className="text-right px-4 py-3 text-sm font-medium text-text-secondary">CTR</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginatedTools.map((tool, i) => (
                                                <tr
                                                    key={tool.tool_slug}
                                                    onClick={() => setSelectedToolSlug(tool.tool_slug)}
                                                    className={`border-t border-border cursor-pointer transition-colors ${selectedToolSlug === tool.tool_slug ? 'bg-accent-primary/10' : 'hover:bg-bg-secondary/50'}`}
                                                >
                                                    <td className="px-4 py-3 text-text-tertiary">{(toolsPage - 1) * TOOLS_PER_PAGE + i + 1}</td>
                                                    <td className="px-4 py-3">
                                                        <span className="font-medium text-text-primary">{tool.tool_name || tool.tool_slug}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-text-primary">{tool.impressions.toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-right text-accent-primary">{tool.clicks.toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-right text-text-secondary">{tool.page_views.toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-right text-accent-blue">{formatTime(tool.avg_time_seconds)}</td>
                                                    <td className="px-4 py-3 text-right text-accent-green">{tool.website_visits.toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-right font-medium text-accent-orange">
                                                        {tool.impressions > 0 ? ((tool.clicks / tool.impressions) * 100).toFixed(1) + '%' : '0%'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {paginatedTools.length === 0 && (
                                        <div className="p-8 text-center text-text-tertiary">
                                            {toolsSearch ? `No tools matching "${toolsSearch}"` : 'No tool data yet'}
                                        </div>
                                    )}
                                </div>

                                {/* Pagination */}
                                {totalToolPages > 1 && (
                                    <div className="flex items-center justify-between mt-4">
                                        <span className="text-sm text-text-tertiary">
                                            Showing {(toolsPage - 1) * TOOLS_PER_PAGE + 1}-{Math.min(toolsPage * TOOLS_PER_PAGE, filteredTools.length)} of {filteredTools.length}
                                        </span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setToolsPage(p => Math.max(1, p - 1))}
                                                disabled={toolsPage === 1}
                                                className="px-3 py-1.5 bg-bg-card border border-border rounded-lg text-sm disabled:opacity-50 hover:bg-bg-secondary transition-colors"
                                            >
                                                Previous
                                            </button>
                                            <span className="px-3 py-1.5 text-sm text-text-secondary">
                                                Page {toolsPage} of {totalToolPages}
                                            </span>
                                            <button
                                                onClick={() => setToolsPage(p => Math.min(totalToolPages, p + 1))}
                                                disabled={toolsPage === totalToolPages}
                                                className="px-3 py-1.5 bg-bg-card border border-border rounded-lg text-sm disabled:opacity-50 hover:bg-bg-secondary transition-colors"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Tool Detail Panel */}
                            <div className="w-80 flex-shrink-0">
                                {selectedToolData ? (
                                    <div className="bg-bg-card border border-border rounded-xl p-5 sticky top-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-semibold text-text-primary truncate">{selectedToolData.tool_name || selectedToolData.tool_slug}</h3>
                                            <button onClick={() => setSelectedToolSlug(null)} className="text-text-tertiary hover:text-text-primary">
                                                <X size={18} />
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 mb-4">
                                            <div className="bg-bg-secondary rounded-lg p-3 text-center">
                                                <div className="text-2xl font-bold text-text-primary">{selectedToolData.impressions.toLocaleString()}</div>
                                                <div className="text-xs text-text-tertiary">Impressions</div>
                                            </div>
                                            <div className="bg-bg-secondary rounded-lg p-3 text-center">
                                                <div className="text-2xl font-bold text-accent-primary">{selectedToolData.clicks.toLocaleString()}</div>
                                                <div className="text-xs text-text-tertiary">Clicks</div>
                                            </div>
                                            <div className="bg-bg-secondary rounded-lg p-3 text-center">
                                                <div className="text-2xl font-bold text-accent-blue">{selectedToolData.page_views.toLocaleString()}</div>
                                                <div className="text-xs text-text-tertiary">Page Views</div>
                                            </div>
                                            <div className="bg-bg-secondary rounded-lg p-3 text-center">
                                                <div className="text-2xl font-bold text-accent-green">{selectedToolData.website_visits.toLocaleString()}</div>
                                                <div className="text-xs text-text-tertiary">Outbound</div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 mb-4">
                                            <div className="bg-bg-secondary rounded-lg p-3 text-center">
                                                <div className="text-xl font-bold text-accent-yellow">{formatTime(selectedToolData.avg_time_seconds)}</div>
                                                <div className="text-xs text-text-tertiary">Avg Time</div>
                                            </div>
                                            <div className="bg-bg-secondary rounded-lg p-3 text-center">
                                                <div className="text-xl font-bold text-accent-orange">
                                                    {selectedToolData.impressions > 0 ? ((selectedToolData.clicks / selectedToolData.impressions) * 100).toFixed(1) + '%' : '0%'}
                                                </div>
                                                <div className="text-xs text-text-tertiary">CTR</div>
                                            </div>
                                        </div>
                                        <a
                                            href={`https://us.posthog.com/project/291386/events?properties=%5B%7B%22key%22%3A%22tool_slug%22%2C%22value%22%3A%22${selectedToolData.tool_slug}%22%7D%5D`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-2 w-full py-2 bg-accent-teal text-white rounded-lg text-sm font-medium hover:bg-accent-teal/90 transition-colors"
                                        >
                                            <ExternalLink size={14} /> View in PostHog
                                        </a>
                                    </div>
                                ) : (
                                    <div className="bg-bg-card border border-border rounded-xl p-8 text-center sticky top-4">
                                        <BarChart3 className="mx-auto mb-3 text-text-tertiary" size={40} />
                                        <p className="text-text-secondary font-medium">Select a Tool</p>
                                        <p className="text-xs text-text-tertiary mt-1">Click any row to see details</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* CATEGORIES & TASKS TAB */}
                    {selectedTab === 'categories' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Categories */}
                            <div className="bg-bg-card border border-border rounded-xl p-5">
                                <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                                    <Tag size={18} className="text-accent-teal" /> Category Clicks
                                </h3>
                                <div className="space-y-2">
                                    {categoryFilters.length > 0 ? categoryFilters.map((f, i) => (
                                        <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-bg-secondary">
                                            <span className="flex-1 text-sm text-text-primary truncate">{f.filter_value}</span>
                                            <span className="text-xs font-medium text-accent-teal">{f.uses}×</span>
                                        </div>
                                    )) : <p className="text-text-tertiary text-sm text-center py-4">No category clicks yet</p>}
                                </div>
                            </div>

                            {/* Tasks */}
                            <div className="bg-bg-card border border-border rounded-xl p-5">
                                <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                                    <Filter size={18} className="text-accent-orange" /> Task Clicks
                                </h3>
                                <div className="space-y-2">
                                    {taskFilters.length > 0 ? taskFilters.map((f, i) => (
                                        <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-bg-secondary">
                                            <span className="flex-1 text-sm text-text-primary truncate">{f.filter_value}</span>
                                            <span className="text-xs font-medium text-accent-orange">{f.uses}×</span>
                                        </div>
                                    )) : <p className="text-text-tertiary text-sm text-center py-4">No task clicks yet</p>}
                                </div>
                            </div>

                            {/* Pricing */}
                            <div className="bg-bg-card border border-border rounded-xl p-5">
                                <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                                    <TrendingUp size={18} className="text-accent-green" /> Pricing Filter Usage
                                </h3>
                                <div className="space-y-2">
                                    {pricingFilters.length > 0 ? pricingFilters.map((f, i) => (
                                        <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-bg-secondary">
                                            <span className="flex-1 text-sm text-text-primary capitalize">{f.filter_value}</span>
                                            <span className="text-xs font-medium text-accent-green">{f.uses}×</span>
                                        </div>
                                    )) : <p className="text-text-tertiary text-sm text-center py-4">No pricing filter usage yet</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* REALTIME TAB */}
                    {selectedTab === 'realtime' && (
                        <div className="bg-bg-card border border-border rounded-xl p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-text-primary flex items-center gap-2">
                                    <Zap size={18} className="text-accent-yellow" /> Live Activity (Last 5 min)
                                </h3>
                                <button onClick={loadRealtime} className="text-sm text-accent-primary hover:underline flex items-center gap-1">
                                    <RefreshCw size={14} /> Refresh
                                </button>
                            </div>
                            <div className="space-y-2">
                                {realtimeEvents.length > 0 ? realtimeEvents.map((evt, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-bg-secondary">
                                        <div className={`w-2 h-2 rounded-full ${evt.event === 'tool_website_visited' ? 'bg-accent-green' :
                                            evt.event === 'tool_page_viewed' ? 'bg-accent-blue' :
                                                evt.event === 'tool_clicked' ? 'bg-accent-orange' :
                                                    'bg-text-tertiary'
                                            }`} />
                                        <div className="flex-1">
                                            <span className="text-sm text-text-primary">{evt.tool_name || evt.event}</span>
                                            <span className="text-xs text-text-tertiary ml-2">{evt.event.replace('tool_', '').replace('_', ' ')}</span>
                                        </div>
                                        <span className="text-xs text-text-tertiary">
                                            {new Date(evt.timestamp).toLocaleTimeString()}
                                        </span>
                                    </div>
                                )) : (
                                    <div className="text-center py-8 text-text-tertiary">
                                        <Zap className="mx-auto mb-2 opacity-30" size={32} />
                                        <p>No recent activity</p>
                                        <p className="text-xs mt-1">Events will appear here in real-time</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
