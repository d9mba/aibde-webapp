'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useAdmin, AdminTool } from '@/context/AdminContext';
import { usePostHogAnalytics } from '@/hooks/usePostHogAnalytics';
import { TrendingUp, Save, ArrowLeft, GripVertical, Eye, MousePointer, RefreshCw } from 'lucide-react';

export default function TrendingManagementPage() {
    const { tools, updateTool, isLoaded } = useAdmin();
    const { topTools, loading: analyticsLoading, isConfigured, refresh: refreshAnalytics } = usePostHogAnalytics();
    const [trendingPositions, setTrendingPositions] = useState<Record<string, number>>({});
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Build a map of slug -> impressions from PostHog data
    const impressionsMap = useMemo(() => {
        const map: Record<string, { impressions: number; clicks: number; pageViews: number }> = {};
        for (const item of topTools) {
            map[item.tool_slug] = {
                impressions: item.impressions || 0,
                clicks: item.clicks || 0,
                pageViews: item.page_views || 0,
            };
        }
        return map;
    }, [topTools]);

    // Get only published tools, sorted by trendingPosition (if set) or impressions
    const sortedTools = useMemo(() => {
        const publishedTools = tools.filter(t => t.status === 'published');
        return [...publishedTools].sort((a, b) => {
            // Priority: manual trendingPosition > impressions
            const posA = trendingPositions[a.id] ?? a.trendingPosition ?? 0;
            const posB = trendingPositions[b.id] ?? b.trendingPosition ?? 0;

            // If both have manual positions, sort by position (lower = higher rank)
            if (posA > 0 && posB > 0) return posA - posB;
            // If only one has position, it ranks higher
            if (posA > 0) return -1;
            if (posB > 0) return 1;

            // Otherwise sort by impressions (higher = higher rank)
            const impressionsA = impressionsMap[a.slug]?.impressions || 0;
            const impressionsB = impressionsMap[b.slug]?.impressions || 0;
            if (impressionsA !== impressionsB) return impressionsB - impressionsA;

            // Fallback to saveCount
            return b.saveCount - a.saveCount;
        });
    }, [tools, trendingPositions, impressionsMap]);

    // Initialize positions from tool data
    useEffect(() => {
        const initialPositions: Record<string, number> = {};
        tools.forEach(tool => {
            if (tool.trendingPosition && tool.trendingPosition > 0) {
                initialPositions[tool.id] = tool.trendingPosition;
            }
        });
        if (Object.keys(initialPositions).length > 0 && Object.keys(trendingPositions).length === 0) {
            setTrendingPositions(initialPositions);
        }
    }, [tools, trendingPositions]);

    const handlePositionChange = (toolId: string, value: string) => {
        const numValue = parseInt(value) || 0;
        setTrendingPositions(prev => ({
            ...prev,
            [toolId]: numValue
        }));
        setSaved(false);
    };

    const handleSaveAll = async () => {
        setSaving(true);
        try {
            // Update all tools with changed positions
            const updates = Object.entries(trendingPositions).map(async ([toolId, position]) => {
                const tool = tools.find(t => t.id === toolId);
                if (tool && tool.trendingPosition !== position) {
                    await updateTool(toolId, { trendingPosition: position });
                }
            });
            await Promise.all(updates);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error('Failed to save trending positions:', error);
        } finally {
            setSaving(false);
        }
    };

    const clearPosition = (toolId: string) => {
        setTrendingPositions(prev => {
            const updated = { ...prev };
            delete updated[toolId];
            return updated;
        });
        setSaved(false);
    };

    if (!isLoaded) {
        return (
            <div className="min-h-screen p-8 bg-bg-primary flex items-center justify-center">
                <div className="text-text-secondary">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-3 sm:p-6 bg-bg-primary">
            <div className="max-w-[1200px] mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/dashboard"
                            prefetch={false}
                            className="p-2 text-text-tertiary hover:text-text-primary hover:bg-bg-secondary rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-text-primary flex items-center gap-2">
                                <TrendingUp className="w-6 h-6 text-accent-primary" />
                                Trending Management
                            </h1>
                            <p className="text-xs sm:text-sm text-text-tertiary mt-0.5">
                                Control trending rankings - tools with manual positions rank first
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={refreshAnalytics}
                            disabled={analyticsLoading}
                            className="flex items-center gap-2 px-3 py-2 text-text-secondary hover:text-text-primary bg-bg-secondary border border-border rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${analyticsLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                        <button
                            onClick={handleSaveAll}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2.5 bg-accent-primary text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
                        </button>
                    </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
                    <p className="text-sm text-blue-400">
                        <strong>How it works:</strong> Tools are ranked by their manual position first (lower number = higher rank).
                        Tools without a position are ranked by <strong>PostHog impressions</strong> automatically.
                        Set position to <strong>0</strong> or clear to reset to automatic ranking.
                    </p>
                    {!isConfigured && (
                        <p className="text-sm text-yellow-400 mt-2">
                            ⚠️ PostHog analytics not configured. Falling back to save count for auto-ranking.
                        </p>
                    )}
                </div>

                {/* Tools List */}
                <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
                    <div className="grid grid-cols-[auto_1fr_100px_100px_100px_80px] gap-4 px-4 py-3 bg-bg-secondary border-b border-border text-xs font-semibold text-text-secondary uppercase tracking-wide">
                        <span>Rank</span>
                        <span>Tool</span>
                        <span className="text-center flex items-center justify-center gap-1">
                            <Eye className="w-3 h-3" /> Views
                        </span>
                        <span className="text-center flex items-center justify-center gap-1">
                            <MousePointer className="w-3 h-3" /> Clicks
                        </span>
                        <span className="text-center">Position</span>
                        <span className="text-center">Actions</span>
                    </div>
                    <div className="divide-y divide-border">
                        {sortedTools.map((tool, index) => {
                            const currentPosition = trendingPositions[tool.id] ?? tool.trendingPosition ?? 0;
                            const hasManualPosition = currentPosition > 0;
                            const analytics = impressionsMap[tool.slug] || { impressions: 0, clicks: 0, pageViews: 0 };

                            return (
                                <div
                                    key={tool.id}
                                    className={`grid grid-cols-[auto_1fr_100px_100px_100px_80px] gap-4 px-4 py-3 items-center ${hasManualPosition ? 'bg-accent-primary/5' : ''
                                        }`}
                                >
                                    {/* Rank */}
                                    <div className="flex items-center gap-2">
                                        <GripVertical className="w-4 h-4 text-text-tertiary" />
                                        <span className={`text-sm font-bold ${hasManualPosition ? 'text-accent-primary' : 'text-text-tertiary'}`}>
                                            #{index + 1}
                                        </span>
                                    </div>

                                    {/* Tool Info */}
                                    <div className="flex items-center gap-3 min-w-0">
                                        {tool.logoUrl ? (
                                            <img src={tool.logoUrl} alt="" className="w-9 h-9 rounded-lg object-contain flex-shrink-0" />
                                        ) : (
                                            <div className="w-9 h-9 rounded-lg bg-accent-primary/10 flex items-center justify-center text-accent-primary font-bold text-sm flex-shrink-0">
                                                {tool.name[0]}
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <div className="font-medium text-text-primary truncate">{tool.name}</div>
                                            <div className="text-xs text-text-tertiary truncate">{tool.summary}</div>
                                        </div>
                                    </div>

                                    {/* Impressions */}
                                    <div className="text-center">
                                        <span className="text-sm text-text-secondary">{analytics.impressions.toLocaleString()}</span>
                                    </div>

                                    {/* Clicks */}
                                    <div className="text-center">
                                        <span className="text-sm text-text-secondary">{analytics.clicks.toLocaleString()}</span>
                                    </div>

                                    {/* Position Input */}
                                    <div className="flex justify-center">
                                        <input
                                            type="number"
                                            min="0"
                                            value={currentPosition || ''}
                                            onChange={(e) => handlePositionChange(tool.id, e.target.value)}
                                            placeholder="Auto"
                                            className={`w-16 px-2 py-1.5 text-sm text-center rounded-lg border ${hasManualPosition
                                                    ? 'bg-accent-primary/10 border-accent-primary/30 text-accent-primary'
                                                    : 'bg-bg-secondary border-border text-text-secondary'
                                                } focus:outline-none focus:ring-2 focus:ring-accent-primary/30`}
                                        />
                                    </div>

                                    {/* Actions */}
                                    <div className="flex justify-center">
                                        {hasManualPosition && (
                                            <button
                                                onClick={() => clearPosition(tool.id)}
                                                className="text-xs text-text-tertiary hover:text-accent-red transition-colors"
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {sortedTools.length === 0 && (
                    <div className="text-center py-12 text-text-tertiary">
                        No published tools found.
                    </div>
                )}
            </div>
        </div>
    );
}
