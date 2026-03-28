'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { renderIcon } from '@/components/features/admin/AdminLayout';
import {
    Search, Eye, MousePointer, Clock, ExternalLink, TrendingUp, BarChart3, X,
    RefreshCw, Loader2, Users, Globe, Tag, Filter, Zap, Activity
} from 'lucide-react';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { getTimeRangeLabel } from '@/lib/formatters';
import { getFullUrl } from '@/lib/url';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
    const router = useRouter();

    const [publishedCount, setPublishedCount] = useState<number | null>(null);
    const [categoryCount, setCategoryCount] = useState<number | null>(null);
    const [taskCount, setTaskCount] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isConfigured, setIsConfigured] = useState(true);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [selectedTab, setSelectedTab] = useState<'overview' | 'tools' | 'categories' | 'realtime'>('overview');
    const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'custom'>('week');

    // Custom date range state
    const [customStartDate, setCustomStartDate] = useState<string>(() => {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        return d.toISOString().split('T')[0];
    });
    const [customEndDate, setCustomEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Comparison mode state
    const [compareMode, setCompareMode] = useState(false);
    const [compareStartDate, setCompareStartDate] = useState<string>(() => {
        const d = new Date();
        d.setDate(d.getDate() - 14);
        return d.toISOString().split('T')[0];
    });
    const [compareEndDate, setCompareEndDate] = useState<string>(() => {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        return d.toISOString().split('T')[0];
    });
    const [comparisonData, setComparisonData] = useState<SummaryStats | null>(null);

    // Get days/dates based on time range
    const getDateParams = () => {
        if (timeRange === 'custom') {
            return { startDate: customStartDate, endDate: customEndDate };
        }
        let days: number;
        switch (timeRange) {
            case 'today': days = 1; break;
            case 'week': days = 7; break;
            case 'month': days = 30; break;
            default: days = 7;
        }
        return { days };
    };

    const getDays = () => {
        switch (timeRange) {
            case 'today': return 1;
            case 'week': return 7;
            case 'month': return 30;
            case 'custom': {
                const start = new Date(customStartDate);
                const end = new Date(customEndDate);
                return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            }
        }
    };

    // Data states
    const [summary, setSummary] = useState<SummaryStats | null>(null);
    const [topTools, setTopTools] = useState<TopTool[]>([]);
    const topToolsRef = useRef<TopTool[]>([]);
    useEffect(() => { topToolsRef.current = topTools; }, [topTools]);
    const [dailyActivity, setDailyActivity] = useState<DailyData[]>([]);
    const [hourlyActivity, setHourlyActivity] = useState<HourlyData[]>([]);
    const [filterStats, setFilterStats] = useState<FilterStat[]>([]);
    const [searchQueries, setSearchQueries] = useState<SearchQuery[]>([]);
    const [realtimeEvents, setRealtimeEvents] = useState<RealtimeEvent[]>([]);
    const [referrerStats, setReferrerStats] = useState<{ referrer: string; visits: number }[]>([]);
    const [pageUrls, setPageUrls] = useState<{ page: string; views: number }[]>([]);

    // Tools tab state
    const [toolsSearch, setToolsSearch] = useState('');
    const [toolsSearchDebounced, setToolsSearchDebounced] = useState('');
    const [dbSearchResults, setDbSearchResults] = useState<TopTool[]>([]);
    const [dbSearchLoading, setDbSearchLoading] = useState(false);
    const [toolsSortBy, setToolsSortBy] = useState<'impressions' | 'clicks' | 'page_views' | 'ctr'>('impressions');
    const [toolsPage, setToolsPage] = useState(1);
    const TOOLS_PER_PAGE = 25;

    // Fetch helper
    const fetchData = useCallback(async (type: string, extraParams = {}) => {
        const res = await fetch('/api/analytics/posthog', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, ...getDateParams(), ...extraParams }),
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timeRange, customStartDate, customEndDate]);

    // Track whether we have any data loaded (ref to avoid useCallback dependency cycle)
    const hasDataRef = useRef(false);

    // Load data based on active tab — retries on PostHog API failures
    const loadData = useCallback(async (retryCount = 0) => {
        const MAX_RETRIES = 2;
        const RETRY_DELAY = 2000;
        setLoading(true);
        // Only clear error when we still have retries left or this is the first attempt
        if (retryCount === 0) setError(null);
        try {
            if (selectedTab === 'overview') {
                const [summaryData, topToolsData, dailyData, hourlyData, referrerData, pageData, searchData] = await Promise.all([
                    fetchData('summary'),
                    fetchData('top_tools'),
                    fetchData('daily_activity'),
                    fetchData('hourly_activity'),
                    fetchData('referrer_stats'),
                    fetchData('page_urls'),
                    fetchData('search_queries'),
                ]);
                if (summaryData?.[0]) setSummary(summaryData[0]);
                if (topToolsData) setTopTools(topToolsData);
                if (dailyData) setDailyActivity(dailyData);
                if (hourlyData) setHourlyActivity(hourlyData);
                if (referrerData) setReferrerStats(referrerData);
                if (pageData) setPageUrls(pageData);
                if (searchData) setSearchQueries(searchData);
            } else if (selectedTab === 'tools') {
                const topToolsData = await fetchData('top_tools');
                if (topToolsData) setTopTools(topToolsData);
            } else if (selectedTab === 'categories') {
                const [filterData, searchData] = await Promise.all([
                    fetchData('filter_stats'),
                    fetchData('search_queries'),
                ]);
                if (filterData) setFilterStats(filterData);
                if (searchData) setSearchQueries(searchData);
            }
            hasDataRef.current = true;
            setError(null);
            setLastRefresh(new Date());
            setLoading(false);
        } catch (err) {
            // Retry silently — keep showing loading skeleton instead of error
            if (retryCount < MAX_RETRIES) {
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                return loadData(retryCount + 1);
            }
            // All retries exhausted — only show error if we have no data at all
            if (!hasDataRef.current) {
                setError(err instanceof Error ? err.message : 'Failed to load');
            }
            setLoading(false);
        }
    }, [fetchData, selectedTab]);

    // Load realtime
    const loadRealtime = useCallback(async () => {
        try {
            const data = await fetchData('realtime');
            if (data) setRealtimeEvents(data);
        } catch { /* ignore */ }
    }, [fetchData]);

    useEffect(() => {
        if (selectedTab !== 'realtime') loadData();
    }, [loadData, timeRange, selectedTab]);

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

    // Fetch publishedCount from stats API instead of loading all tools
    useEffect(() => {
        fetch('/api/dashboard/stats')
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                const published = data?.counts?.published;
                if (typeof published === 'number') setPublishedCount(published);
                const cats = data?.counts?.categories;
                if (typeof cats === 'number') setCategoryCount(cats);
                const tasks = data?.counts?.tasks;
                if (typeof tasks === 'number') setTaskCount(tasks);
            })
            .catch(() => { });
    }, []);

    // Stats calculations
    const maxDaily = Math.max(...dailyActivity.map(d => d.events), 1);
    const maxHourly = Math.max(...hourlyActivity.map(h => h.events), 1);
    const categoryFilters = filterStats.filter(f => f.filter_type === 'category');
    const taskFilters = filterStats.filter(f => f.filter_type === 'task');
    const pricingFilters = filterStats.filter(f => f.filter_type === 'pricing');

    // Debounce tool search and fetch from DB when PostHog results are insufficient
    const dbSearchReqIdRef = useRef(0);
    useEffect(() => {
        const trimmed = toolsSearch.trim();
        if (trimmed === toolsSearchDebounced) return;
        const timer = setTimeout(() => setToolsSearchDebounced(trimmed), 400);
        return () => clearTimeout(timer);
    }, [toolsSearch, toolsSearchDebounced]);

    useEffect(() => {
        if (!toolsSearchDebounced) {
            setDbSearchResults([]);
            return;
        }
        const reqId = ++dbSearchReqIdRef.current;
        const controller = new AbortController();
        // Always fetch from DB so all published tools are searchable
        setDbSearchLoading(true);
        fetch(`/api/tools?search=${encodeURIComponent(toolsSearchDebounced)}&fields=card&limit=25&status=published`, { signal: controller.signal })
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (reqId !== dbSearchReqIdRef.current) return;
                if (!data?.data) return;
                // Deduplicate against current topTools via snapshot
                const posthogSlugs = new Set(topToolsRef.current.map(t => t.tool_slug));
                const newTools: TopTool[] = data.data
                    .filter((t: any) => t.appUsername && !posthogSlugs.has(t.appUsername))
                    .map((t: any) => ({
                        tool_slug: t.appUsername,
                        tool_name: t.name,
                        impressions: 0,
                        clicks: 0,
                        page_views: 0,
                        website_visits: 0,
                        avg_time_seconds: null,
                    }));
                setDbSearchResults(newTools);
            })
            .catch((err) => { if (reqId === dbSearchReqIdRef.current && err.name !== 'AbortError') console.error('[Analytics] DB search failed:', err); })
            .finally(() => { if (reqId === dbSearchReqIdRef.current) setDbSearchLoading(false); });
        return () => controller.abort();
    }, [toolsSearchDebounced]);

    // Filtered & sorted tools for Tools tab — merge PostHog + DB results, deduplicated
    const filteredTools = (() => {
        const merged = [...topTools, ...(toolsSearchDebounced ? dbSearchResults : [])];
        const seen = new Set<string>();
        return merged
            .filter((t) => {
                const key = t.tool_slug || t.tool_name;
                if (!key || seen.has(key)) return false;
                seen.add(key);
                return !toolsSearchDebounced || key.toLowerCase().includes(toolsSearchDebounced.toLowerCase());
            })
            .sort((a, b) => {
                if (toolsSortBy === 'ctr') {
                    const ctrA = a.impressions > 0 ? a.clicks / a.impressions : 0;
                    const ctrB = b.impressions > 0 ? b.clicks / b.impressions : 0;
                    return ctrB - ctrA;
                }
                return (b[toolsSortBy] || 0) - (a[toolsSortBy] || 0);
            });
    })();
    const totalToolPages = Math.ceil(filteredTools.length / TOOLS_PER_PAGE);
    const paginatedTools = filteredTools.slice((toolsPage - 1) * TOOLS_PER_PAGE, toolsPage * TOOLS_PER_PAGE);

    // Selected tool for detail view — check both PostHog and DB results
    const [selectedToolSlug, setSelectedToolSlug] = useState<string | null>(null);
    const selectedToolData = [...topTools, ...dbSearchResults].find(t => t.tool_slug === selectedToolSlug);

    // Tool-specific date filtering
    const [toolStartDate, setToolStartDate] = useState<string>(() => {
        const d = new Date();
        d.setDate(d.getDate() - 14);
        return d.toISOString().split('T')[0];
    });
    const [toolEndDate, setToolEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
    const [toolDailyTrend, setToolDailyTrend] = useState<{ date: string; impressions: number; clicks: number; page_views: number; website_visits: number }[]>([]);
    const [toolLoading, setToolLoading] = useState(false);

    // Fetch tool-specific data when dates change
    const fetchToolData = useCallback(async (slug: string) => {
        if (!slug) return;
        setToolLoading(true);
        try {
            const res = await fetch('/api/analytics/posthog', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'tool_daily_trend',
                    toolSlug: slug,
                    startDate: toolStartDate,
                    endDate: toolEndDate,
                }),
            });
            if (res.ok) {
                const data = await res.json();
                setToolDailyTrend(data.results || []);
            }
        } catch { /* ignore */ }
        setToolLoading(false);
    }, [toolStartDate, toolEndDate]);

    // Load tool data when selected or dates change
    useEffect(() => {
        if (selectedToolSlug) {
            fetchToolData(selectedToolSlug);
        }
    }, [selectedToolSlug, fetchToolData]);

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
        <div className="p-3 sm:p-6 max-w-[1600px] mx-auto overflow-x-hidden">
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
                            { value: 'custom', label: 'Custom' },
                        ].map(({ value, label }) => (
                            <button
                                key={value}
                                onClick={() => {
                                    setTimeRange(value as typeof timeRange);
                                    if (value === 'custom') setShowDatePicker(true);
                                    else setShowDatePicker(false);
                                }}
                                className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm rounded-md transition-colors ${timeRange === value
                                    ? 'bg-accent-primary text-white'
                                    : 'text-text-secondary hover:text-text-primary'
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Custom Date Range Picker */}
                    {(timeRange === 'custom' || showDatePicker) && (
                        <div className="flex items-center gap-2 bg-bg-card border border-border rounded-lg px-3 py-1.5">
                            <input
                                type="date"
                                value={customStartDate}
                                onChange={(e) => setCustomStartDate(e.target.value)}
                                className="bg-transparent text-text-primary text-xs sm:text-sm focus:outline-none"
                            />
                            <span className="text-text-tertiary">to</span>
                            <input
                                type="date"
                                value={customEndDate}
                                onChange={(e) => setCustomEndDate(e.target.value)}
                                className="bg-transparent text-text-primary text-xs sm:text-sm focus:outline-none"
                            />
                            <button
                                onClick={() => { setTimeRange('custom'); loadData(); }}
                                className="px-2 py-1 bg-accent-primary text-white text-xs rounded-md hover:bg-accent-primary/90"
                            >
                                Apply
                            </button>
                        </div>
                    )}

                    {/* Compare Mode Toggle */}
                    <label className="hidden sm:flex items-center gap-2 text-sm text-text-secondary cursor-pointer bg-bg-card border border-border rounded-lg px-3 py-1.5">
                        <input
                            type="checkbox"
                            checked={compareMode}
                            onChange={(e) => setCompareMode(e.target.checked)}
                            className="rounded border-border"
                        />
                        Compare
                    </label>

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
                        onClick={() => loadData()}
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

            {/* Compare Mode Period Selector */}
            {compareMode && (
                <div className="mb-6 p-4 bg-bg-card border border-accent-primary/30 rounded-xl">
                    <div className="flex flex-wrap items-center gap-4">
                        <span className="text-sm font-medium text-text-primary">Compare with:</span>
                        <div className="flex items-center gap-2 bg-bg-secondary rounded-lg px-3 py-1.5">
                            <span className="text-xs text-text-tertiary">Period B:</span>
                            <input
                                type="date"
                                value={compareStartDate}
                                onChange={(e) => setCompareStartDate(e.target.value)}
                                className="bg-transparent text-text-primary text-xs sm:text-sm focus:outline-none"
                            />
                            <span className="text-text-tertiary">to</span>
                            <input
                                type="date"
                                value={compareEndDate}
                                onChange={(e) => setCompareEndDate(e.target.value)}
                                className="bg-transparent text-text-primary text-xs sm:text-sm focus:outline-none"
                            />
                        </div>
                        <button
                            onClick={async () => {
                                // Fetch comparison data
                                const res = await fetch('/api/analytics/posthog', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ type: 'summary', startDate: compareStartDate, endDate: compareEndDate }),
                                });
                                if (res.ok) {
                                    const data = await res.json();
                                    if (data.results?.[0]) setComparisonData(data.results[0]);
                                }
                            }}
                            className="px-3 py-1.5 bg-accent-primary text-white text-sm rounded-lg hover:bg-accent-primary/90"
                        >
                            Load Comparison
                        </button>
                    </div>
                </div>
            )}

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

                            {/* Comparison Table */}
                            {compareMode && comparisonData && (
                                <div className="mb-6 bg-bg-card border border-border rounded-xl overflow-hidden">
                                    <div className="px-4 py-3 bg-bg-secondary border-b border-border">
                                        <h3 className="font-semibold text-text-primary flex items-center gap-2">
                                            <TrendingUp size={18} className="text-accent-primary" />
                                            Period Comparison
                                        </h3>
                                    </div>
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-bg-secondary/50">
                                                <th className="text-left px-4 py-2 text-sm font-medium text-text-secondary">Metric</th>
                                                <th className="text-right px-4 py-2 text-sm font-medium text-text-secondary">Current Period</th>
                                                <th className="text-right px-4 py-2 text-sm font-medium text-text-secondary">Compare Period</th>
                                                <th className="text-right px-4 py-2 text-sm font-medium text-text-secondary">Change</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {[
                                                { label: 'Page Views', current: summary?.pageviews || 0, compare: comparisonData.pageviews || 0 },
                                                { label: 'Unique Visitors', current: summary?.unique_visitors || 0, compare: comparisonData.unique_visitors || 0 },
                                                { label: 'Impressions', current: summary?.impressions || 0, compare: comparisonData.impressions || 0 },
                                                { label: 'Clicks', current: summary?.clicks || 0, compare: comparisonData.clicks || 0 },
                                                { label: 'Tool Views', current: summary?.tool_views || 0, compare: comparisonData.tool_views || 0 },
                                                { label: 'Website Visits', current: summary?.website_visits || 0, compare: comparisonData.website_visits || 0 },
                                                { label: 'Searches', current: summary?.searches || 0, compare: comparisonData.searches || 0 },
                                            ].map((row) => {
                                                const change = row.compare > 0 ? ((row.current - row.compare) / row.compare) * 100 : 0;
                                                const isPositive = change >= 0;
                                                return (
                                                    <tr key={row.label} className="border-t border-border">
                                                        <td className="px-4 py-3 text-sm text-text-primary">{row.label}</td>
                                                        <td className="px-4 py-3 text-sm text-right font-medium text-text-primary">{row.current.toLocaleString()}</td>
                                                        <td className="px-4 py-3 text-sm text-right text-text-secondary">{row.compare.toLocaleString()}</td>
                                                        <td className={`px-4 py-3 text-sm text-right font-medium ${isPositive ? 'text-accent-green' : 'text-accent-red'}`}>
                                                            {isPositive ? '+' : ''}{change.toFixed(1)}%
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Charts Row */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                {/* Daily Activity */}
                                <div className="bg-bg-card border border-border rounded-xl p-5">
                                    <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                                        <BarChart3 size={18} className="text-accent-primary" /> Daily Activity ({getTimeRangeLabel(timeRange)})
                                    </h3>
                                    {dailyActivity.length > 0 ? (
                                        <div className="relative h-48">
                                            {/* Single day (Today) - show a prominent stat card */}
                                            {dailyActivity.length === 1 ? (
                                                <div className="h-full flex flex-col items-center justify-center">
                                                    <div className="text-5xl font-bold text-accent-primary mb-2">
                                                        {dailyActivity[0].events.toLocaleString()}
                                                    </div>
                                                    <div className="text-sm text-text-secondary">Total Events Today</div>
                                                    <div className="text-xs text-text-tertiary mt-1">
                                                        {new Date(dailyActivity[0].date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                                                    </div>
                                                    {/* Progress bar visualization */}
                                                    <div className="w-full max-w-xs mt-4">
                                                        <div className="h-3 bg-bg-tertiary rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-accent-primary to-accent-primary/60 rounded-full transition-all"
                                                                style={{ width: '100%' }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                /* Multi-day - show bar chart with values */
                                                <>
                                                    {/* Y-axis labels */}
                                                    <div className="absolute left-0 top-0 bottom-8 w-8 flex flex-col justify-between text-xs text-text-tertiary">
                                                        <span>{maxDaily.toLocaleString()}</span>
                                                        <span>{Math.round(maxDaily / 2).toLocaleString()}</span>
                                                        <span>0</span>
                                                    </div>
                                                    {/* Chart area */}
                                                    <div className="ml-10 h-36 flex items-end gap-1">
                                                        {dailyActivity.map((day) => {
                                                            const height = maxDaily > 0 ? (day.events / maxDaily) * 100 : 5;
                                                            return (
                                                                <div
                                                                    key={day.date}
                                                                    className="flex-1 flex flex-col items-center justify-end h-full group"
                                                                >
                                                                    {/* Value on hover */}
                                                                    <div className="text-xs font-medium text-accent-primary opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                                                                        {day.events.toLocaleString()}
                                                                    </div>
                                                                    {/* Bar */}
                                                                    <div
                                                                        className="w-full bg-gradient-to-t from-accent-primary to-accent-primary/60 rounded-t-md transition-all hover:from-accent-primary hover:to-accent-primary/80 cursor-pointer relative"
                                                                        style={{ height: `${Math.max(height, 3)}%` }}
                                                                    >
                                                                        {/* Show value on bar if space allows */}
                                                                        {height > 20 && dailyActivity.length <= 7 && (
                                                                            <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white">
                                                                                {day.events}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                    {/* X-axis labels */}
                                                    <div className="ml-10 flex justify-between mt-2">
                                                        {dailyActivity.map((day) => (
                                                            <div key={day.date} className="flex-1 text-center">
                                                                <span className="text-xs text-text-tertiary">
                                                                    {dailyActivity.length <= 7
                                                                        ? new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3)
                                                                        : new Date(day.date).getDate()
                                                                    }
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
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
                                            <div className="flex items-end gap-0.5" style={{ height: '160px' }}>
                                                {Array.from({ length: 24 }, (_, i) => {
                                                    const hourData = hourlyActivity.find(h => h.hour === i);
                                                    const events = hourData?.events || 0;
                                                    const minHeight = events > 0 ? 12 : 4;
                                                    const barHeight = maxHourly > 0 ? Math.max((events / maxHourly) * 130, minHeight) : minHeight;
                                                    const currentHour = new Date().getHours();
                                                    const isCurrentHour = i === currentHour;
                                                    return (
                                                        <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                                                            {/* Count on top of bar */}
                                                            {events > 0 && (
                                                                <span className={`text-[10px] mb-0.5 ${isCurrentHour ? 'text-accent-primary font-bold' : 'text-text-secondary'}`}>{events}</span>
                                                            )}
                                                            <div
                                                                className={`w-full rounded-t cursor-pointer transition-opacity ${isCurrentHour ? 'animate-pulse ring-2 ring-accent-primary ring-offset-1 ring-offset-bg-card' : 'hover:opacity-80'}`}
                                                                style={{
                                                                    height: `${barHeight}px`,
                                                                    backgroundColor: '#10b981'
                                                                }}
                                                            />
                                                            {/* Instant tooltip */}
                                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-100 whitespace-nowrap z-20 pointer-events-none">
                                                                {i}:00 {isCurrentHour && '(now)'}
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
                                            <div
                                                key={tool.tool_slug}
                                                onClick={() => router.push(`/dashboard/analytics/tool/${tool.tool_slug}`)}
                                                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-bg-secondary transition-colors cursor-pointer"
                                            >
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
                                            <span className="font-bold text-accent-green">{publishedCount ?? '—'}</span>
                                        </div>
                                        <div className="flex justify-between p-2 bg-bg-secondary rounded-lg">
                                            <span className="text-sm text-text-secondary">Categories</span>
                                            <span className="font-bold text-accent-blue">{categoryCount ?? '—'}</span>
                                        </div>
                                        <div className="flex justify-between p-2 bg-bg-secondary rounded-lg">
                                            <span className="text-sm text-text-secondary">Tasks</span>
                                            <span className="font-bold text-accent-orange">{taskCount ?? '—'}</span>
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
                        <>
                            {/* Mobile Tool Detail Modal */}
                            {selectedToolData && (
                                <div className="fixed inset-0 bg-black/50 z-50 lg:hidden flex items-end sm:items-center justify-center" onClick={() => setSelectedToolSlug(null)}>
                                    <div className="bg-bg-card border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                                        <div className="sticky top-0 bg-bg-card px-4 py-3 border-b border-border flex items-center justify-between z-10">
                                            <h3 className="font-semibold text-text-primary truncate">{selectedToolData.tool_name || selectedToolData.tool_slug}</h3>
                                            <button onClick={() => setSelectedToolSlug(null)} className="text-text-tertiary hover:text-text-primary p-1">
                                                <X size={20} />
                                            </button>
                                        </div>
                                        <div className="p-4">
                                            {/* Date Range Picker */}
                                            <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-bg-secondary rounded-lg">
                                                <Clock size={16} className="text-accent-primary" />
                                                <input
                                                    type="date"
                                                    value={toolStartDate}
                                                    onChange={(e) => setToolStartDate(e.target.value)}
                                                    className="bg-bg-card border border-border rounded px-2 py-1 text-xs text-text-primary"
                                                />
                                                <span className="text-text-tertiary text-xs">to</span>
                                                <input
                                                    type="date"
                                                    value={toolEndDate}
                                                    onChange={(e) => setToolEndDate(e.target.value)}
                                                    className="bg-bg-card border border-border rounded px-2 py-1 text-xs text-text-primary"
                                                />
                                                <button
                                                    onClick={() => fetchToolData(selectedToolSlug!)}
                                                    className="px-2 py-1 bg-accent-primary text-white text-xs rounded"
                                                >
                                                    Apply
                                                </button>
                                            </div>

                                            {/* Stats Grid */}
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

                                            {/* CTR & Time */}
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

                                            {/* Daily Trend Chart */}
                                            <div className="bg-bg-secondary rounded-lg p-3 mb-4">
                                                <h4 className="text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
                                                    <BarChart3 size={14} className="text-accent-primary" />
                                                    Daily Trend
                                                    {toolLoading && <Loader2 size={14} className="animate-spin text-accent-primary" />}
                                                </h4>
                                                {toolDailyTrend.length > 0 ? (
                                                    <div className="h-24 flex items-end gap-0.5">
                                                        {toolDailyTrend.map((day) => {
                                                            const max = Math.max(...toolDailyTrend.map(d => d.impressions), 1);
                                                            const height = (day.impressions / max) * 100;
                                                            return (
                                                                <div key={day.date} className="flex-1 group relative">
                                                                    <div
                                                                        className="w-full bg-accent-primary rounded-t transition-all hover:bg-accent-primary/80"
                                                                        style={{ height: `${Math.max(height, 3)}%` }}
                                                                    />
                                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-bg-tertiary px-1.5 py-0.5 rounded text-[10px] opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                                                                        {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: {day.impressions}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <div className="h-24 flex items-center justify-center text-text-tertiary text-sm">
                                                        {toolLoading ? 'Loading...' : 'No data'}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Action Buttons */}
                                            <a
                                                href={`https://us.posthog.com/project/291386/events?properties=%5B%7B%22key%22%3A%22tool_slug%22%2C%22value%22%3A%22${selectedToolData.tool_slug}%22%7D%5D`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-center gap-2 w-full py-2.5 bg-accent-teal text-white rounded-lg text-sm font-medium hover:bg-accent-teal/90 transition-colors"
                                            >
                                                <ExternalLink size={14} /> View in PostHog
                                            </a>
                                            <Link
                                                href={`/dashboard/analytics/tool/${selectedToolData.tool_slug}`}
                                                className="flex items-center justify-center gap-2 w-full py-2.5 mt-2 bg-accent-primary text-white rounded-lg text-sm font-medium hover:bg-accent-primary/90 transition-colors"
                                            >
                                                <BarChart3 size={14} /> Full Analytics
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
                                {/* Main table */}
                                <div className="flex-1 min-w-0">
                                    {/* Search & Filter Bar - stack on mobile */}
                                    <div className="flex flex-col sm:flex-row gap-3 mb-4">
                                        <div className="flex-1 relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={18} />
                                            <input
                                                type="text"
                                                value={toolsSearch}
                                                onChange={(e) => { setToolsSearch(e.target.value); setToolsPage(1); }}
                                                placeholder="Search all published tools..."
                                                className="w-full pl-10 pr-10 py-2.5 bg-bg-card border border-border rounded-lg text-text-primary placeholder:text-text-tertiary focus:border-accent-primary focus:outline-none"
                                            />
                                            {dbSearchLoading && (
                                                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-accent-primary" />
                                            )}
                                        </div>
                                        <SearchableSelect
                                            value={toolsSortBy}
                                            onChange={(value) => setToolsSortBy(value as typeof toolsSortBy)}
                                            options={[
                                                { value: 'impressions', label: 'Sort by Impressions' },
                                                { value: 'clicks', label: 'Sort by Clicks' },
                                                { value: 'page_views', label: 'Sort by Views' },
                                                { value: 'ctr', label: 'Sort by CTR' },
                                            ]}
                                            showSearch={false}
                                            className="w-full sm:w-auto sm:min-w-[180px]"
                                        />
                                    </div>

                                    {/* Responsive Table - fewer columns on mobile */}
                                    <div className="bg-bg-card border border-border rounded-xl overflow-hidden relative">
                                        {dbSearchLoading && (
                                            <div className="absolute inset-0 bg-bg-card/60 backdrop-blur-sm z-10 flex items-center justify-center">
                                                <Loader2 className="w-6 h-6 animate-spin text-accent-primary" />
                                            </div>
                                        )}
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="bg-bg-secondary">
                                                        <th className="text-left px-3 py-2 text-xs sm:text-sm font-medium text-text-secondary">#</th>
                                                        <th className="text-left px-3 py-2 text-xs sm:text-sm font-medium text-text-secondary">Tool</th>
                                                        <th className="text-right px-3 py-2 text-xs sm:text-sm font-medium text-text-secondary">Clicks</th>
                                                        <th className="text-right px-3 py-2 text-xs sm:text-sm font-medium text-text-secondary hidden sm:table-cell">Views</th>
                                                        <th className="text-right px-3 py-2 text-xs sm:text-sm font-medium text-text-secondary hidden md:table-cell">Outbound</th>
                                                        <th className="text-right px-3 py-2 text-xs sm:text-sm font-medium text-text-secondary">CTR</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {paginatedTools.map((tool, i) => (
                                                        <tr
                                                            key={tool.tool_slug || `${tool.tool_name}-${i}`}
                                                            onClick={() => router.push(`/dashboard/analytics/tool/${tool.tool_slug}`)}
                                                            className="border-t border-border cursor-pointer transition-colors hover:bg-bg-secondary/50"
                                                        >
                                                            <td className="px-3 py-2.5 text-xs sm:text-sm text-text-tertiary">{(toolsPage - 1) * TOOLS_PER_PAGE + i + 1}</td>
                                                            <td className="px-3 py-2.5">
                                                                <span className="font-medium text-xs sm:text-sm text-text-primary line-clamp-1">{tool.tool_name || tool.tool_slug}</span>
                                                            </td>
                                                            <td className="px-3 py-2.5 text-right text-xs sm:text-sm text-accent-primary font-medium">{tool.clicks.toLocaleString()}</td>
                                                            <td className="px-3 py-2.5 text-right text-xs sm:text-sm text-text-secondary hidden sm:table-cell">{tool.page_views.toLocaleString()}</td>
                                                            <td className="px-3 py-2.5 text-right text-xs sm:text-sm text-accent-green hidden md:table-cell">{tool.website_visits.toLocaleString()}</td>
                                                            <td className="px-3 py-2.5 text-right text-xs sm:text-sm font-medium text-accent-orange">
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

                                {/* Tool Detail Panel - Desktop only */}
                                <div className="hidden lg:block w-96 flex-shrink-0">
                                    {selectedToolData ? (
                                        <div className="bg-bg-card border border-border rounded-xl p-5 sticky top-4 max-h-[calc(100vh-100px)] overflow-y-auto">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="font-semibold text-text-primary truncate">{selectedToolData.tool_name || selectedToolData.tool_slug}</h3>
                                                <button onClick={() => setSelectedToolSlug(null)} className="text-text-tertiary hover:text-text-primary">
                                                    <X size={18} />
                                                </button>
                                            </div>

                                            {/* Date Range Picker */}
                                            <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-bg-secondary rounded-lg">
                                                <Clock size={16} className="text-accent-primary" />
                                                <input
                                                    type="date"
                                                    value={toolStartDate}
                                                    onChange={(e) => setToolStartDate(e.target.value)}
                                                    className="bg-bg-card border border-border rounded px-2 py-1 text-xs text-text-primary flex-1"
                                                />
                                                <span className="text-text-tertiary text-xs">to</span>
                                                <input
                                                    type="date"
                                                    value={toolEndDate}
                                                    onChange={(e) => setToolEndDate(e.target.value)}
                                                    className="bg-bg-card border border-border rounded px-2 py-1 text-xs text-text-primary flex-1"
                                                />
                                                <button
                                                    onClick={() => fetchToolData(selectedToolSlug!)}
                                                    className="px-2 py-1 bg-accent-primary text-white text-xs rounded hover:bg-accent-primary/90"
                                                >
                                                    Apply
                                                </button>
                                            </div>

                                            {/* Stats Grid */}
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

                                            {/* CTR & Time */}
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

                                            {/* Daily Trend Chart */}
                                            <div className="bg-bg-secondary rounded-lg p-3 mb-4">
                                                <h4 className="text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
                                                    <BarChart3 size={14} className="text-accent-primary" />
                                                    Daily Trend
                                                    {toolLoading && <Loader2 size={14} className="animate-spin text-accent-primary" />}
                                                </h4>
                                                {toolDailyTrend.length > 0 ? (
                                                    <div className="h-28 flex items-end gap-0.5">
                                                        {toolDailyTrend.map((day) => {
                                                            const max = Math.max(...toolDailyTrend.map(d => d.impressions), 1);
                                                            const height = (day.impressions / max) * 100;
                                                            return (
                                                                <div key={day.date} className="flex-1 group relative">
                                                                    <div
                                                                        className="w-full bg-accent-primary rounded-t transition-all hover:bg-accent-primary/80"
                                                                        style={{ height: `${Math.max(height, 3)}%` }}
                                                                    />
                                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-bg-tertiary px-1.5 py-0.5 rounded text-[10px] opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                                                                        {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: {day.impressions}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <div className="h-28 flex items-center justify-center text-text-tertiary text-sm">
                                                        {toolLoading ? 'Loading...' : 'No data'}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="space-y-2">
                                                <a
                                                    href={`https://us.posthog.com/project/291386/events?properties=%5B%7B%22key%22%3A%22tool_slug%22%2C%22value%22%3A%22${selectedToolData.tool_slug}%22%7D%5D`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-center gap-2 w-full py-2 bg-accent-teal text-white rounded-lg text-sm font-medium hover:bg-accent-teal/90 transition-colors"
                                                >
                                                    <ExternalLink size={14} /> View in PostHog
                                                </a>
                                                <Link
                                                    href={`/dashboard/analytics/tool/${selectedToolData.tool_slug}`}
                                                    className="flex items-center justify-center gap-2 w-full py-2 bg-accent-primary text-white rounded-lg text-sm font-medium hover:bg-accent-primary/90 transition-colors"
                                                >
                                                    <BarChart3 size={14} /> Full Analytics
                                                </Link>
                                            </div>
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
                        </>
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
