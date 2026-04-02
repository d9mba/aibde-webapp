'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { AdminTool } from '@/types';
import {
    Wrench,
    CheckCircle2,
    FileEdit,
    Folder,
    Target,
    Star,
    Plus,
    ChevronRight,
    ExternalLink,
    Globe,
    Settings,
    Clock,
    EyeOff,
    Calendar,
    TrendingUp,
    LucideIcon,
} from 'lucide-react';

// Icon component mapping for dashboard (matching sidebar icons)
const iconMap: Record<string, LucideIcon> = {
    tools: Wrench,
    published: CheckCircle2,
    drafts: FileEdit,
    pending: Clock,
    unpublished: EyeOff,
    scheduled: Calendar,
    categories: Folder,
    tasks: Target,
    spotlight: Star,
    trending: TrendingUp,
    plus: Plus,
    'chevron-right': ChevronRight,
    'external-link': ExternalLink,
    globe: Globe,
    settings: Settings,
};

// Render icon helper
function renderIcon(iconName: string, size: number = 18) {
    const IconComponent = iconMap[iconName];
    if (!IconComponent) return null;
    return <IconComponent size={size} strokeWidth={1.5} />;
}

interface DashboardStats {
    counts: {
        total: number;
        published: number;
        draft: number;
        pending: number;
        unpublished: number;
        scheduled: number;
        spotlight: number;
        featured: number;
        categories: number;
        tasks: number;
        tags: number;
    };
    recentUpdated: AdminTool[];
    recentPublished: AdminTool[];
}

export default function DashboardHome() {
    const [data, setData] = useState<DashboardStats | null>(null);
    const [error, setError] = useState<string | null>(null);

    const loadStats = useCallback(async () => {
        setError(null);
        try {
            const res = await fetch('/api/dashboard/stats');
            const body = await res.text();
            if (!res.ok) {
                let message = 'Failed to fetch stats';
                try { message = JSON.parse(body).error || message; } catch { message = body || message; }
                throw new Error(message);
            }
            const stats: DashboardStats = JSON.parse(body);
            setData(stats);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load dashboard');
        }
    }, []);

    useEffect(() => { loadStats(); }, [loadStats]);

    const counts = data?.counts;
    const recentTools = data?.recentUpdated ?? [];
    const recentPublished = data?.recentPublished ?? [];
    const dataReady = data !== null;

    const stats = [
        { label: 'Total Tools', value: counts?.total ?? 0, icon: 'tools', color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', href: '/dashboard/tools' },
        { label: 'Published', value: counts?.published ?? 0, icon: 'published', color: 'text-green-500', bgColor: 'bg-green-500/10', href: '/dashboard/tools?status=published' },
        { label: 'Drafts', value: counts?.draft ?? 0, icon: 'drafts', color: 'text-yellow-500', bgColor: 'bg-yellow-500/10', href: '/dashboard/tools?status=draft' },
        { label: 'Pending', value: counts?.pending ?? 0, icon: 'pending', color: 'text-blue-500', bgColor: 'bg-blue-500/10', href: '/dashboard/tools?status=pending' },
        { label: 'Unpublished', value: counts?.unpublished ?? 0, icon: 'unpublished', color: 'text-gray-500', bgColor: 'bg-gray-500/10', href: '/dashboard/tools?status=unpublished' },
        { label: 'Scheduled', value: counts?.scheduled ?? 0, icon: 'scheduled', color: 'text-cyan-500', bgColor: 'bg-cyan-500/10', href: '/dashboard/tools?status=scheduled' },
        { label: 'Categories', value: counts?.categories ?? 0, icon: 'categories', color: 'text-indigo-500', bgColor: 'bg-indigo-500/10', href: '/dashboard/categories' },
        { label: 'Tasks', value: counts?.tasks ?? 0, icon: 'tasks', color: 'text-orange-500', bgColor: 'bg-orange-500/10', href: '/dashboard/tasks' },
        { label: 'Spotlight', value: counts?.spotlight ?? 0, icon: 'spotlight', color: 'text-amber-500', bgColor: 'bg-amber-500/10', href: '/dashboard/spotlight' },
        { label: 'Featured', value: counts?.featured ?? 0, icon: 'spotlight', color: 'text-purple-500', bgColor: 'bg-purple-500/10', href: '/dashboard/featured' },
    ];

    const quickActions = [
        { href: '/dashboard/tools/new', label: 'Add New Tool', icon: 'plus', desc: 'Create a new AI tool entry' },
        { href: '/dashboard/categories', label: 'Manage Categories', icon: 'categories', desc: 'Add or edit categories' },
        { href: '/dashboard/tasks', label: 'Manage Tasks', icon: 'tasks', desc: 'Organize tools by tasks' },
        { href: '/dashboard/spotlight', label: 'Configure Spotlight', icon: 'spotlight', desc: 'Feature tools on homepage' },
        { href: '/dashboard/trending', label: 'Manage Trending', icon: 'trending', desc: 'Control trending rankings' },
        { href: '/dashboard/settings', label: 'Site Settings', icon: 'settings', desc: 'Configure site options' },
    ];

    if (error) {
        return (
            <div className="min-h-screen p-8 bg-bg-primary flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-400 mb-2">{error}</p>
                    <button onClick={loadStats} className="text-accent-primary text-sm hover:underline">Retry</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-3 sm:p-6 bg-bg-primary">
            <div className="max-w-[1400px] mx-auto space-y-4 sm:space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Dashboard</h1>
                        <p className="text-xs sm:text-sm text-text-tertiary mt-0.5 sm:mt-1">Welcome back! Here&apos;s an overview of your AI tools directory.</p>
                    </div>
                    <Link
                        href="/dashboard/tools/new"
                        prefetch={false}
                        className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-accent-primary text-white rounded-lg text-xs sm:text-sm font-medium no-underline hover:opacity-90 transition-opacity"
                    >
                        <span className="flex items-center">{renderIcon('plus', 16)}</span>
                        <span className="hidden sm:inline">Add Tool</span>
                    </Link>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
                    {stats.map((stat) => (
                        <Link
                            key={stat.label}
                            href={stat.href}
                            prefetch={false}
                            className="bg-bg-card border border-border rounded-xl p-3 sm:p-4 hover:shadow-md transition-all hover:border-text-tertiary no-underline group cursor-pointer active:scale-[0.98] flex flex-col items-center text-center"
                        >
                            <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-bg-tertiary border border-border flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform mb-2`}>
                                {renderIcon(stat.icon, 20)}
                            </div>
                            {dataReady ? (
                                <div className={`text-xl sm:text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                            ) : (
                                <div className="h-7 sm:h-8 flex items-center">
                                    <div className="w-8 h-5 bg-border rounded animate-pulse" />
                                </div>
                            )}
                            <div className="text-[10px] sm:text-xs text-text-tertiary mt-0.5 truncate">{stat.label}</div>
                        </Link>
                    ))}
                </div>

                {/* Quick Actions */}
                <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
                    <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-border">
                        <h2 className="text-sm sm:text-base font-semibold text-text-primary">Quick Actions</h2>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-5 gap-px bg-border">
                        {quickActions.map((action) => (
                            <Link
                                key={action.href}
                                href={action.href}
                                prefetch={false}
                                className="flex flex-col items-center gap-1.5 sm:gap-2 p-3 sm:p-5 text-center no-underline bg-bg-card hover:bg-bg-secondary transition-colors group"
                            >
                                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-bg-tertiary flex items-center justify-center text-text-secondary group-hover:bg-accent-primary group-hover:text-white transition-colors">
                                    {renderIcon(action.icon, 18)}
                                </div>
                                <div>
                                    <div className="text-[10px] sm:text-sm font-medium text-text-primary leading-tight">{action.label}</div>
                                    <div className="text-[9px] sm:text-xs text-text-tertiary mt-0.5 hidden sm:block">{action.desc}</div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Tools */}
                    <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                            <h2 className="text-base font-semibold text-text-primary">Recently Updated</h2>
                            <Link href="/dashboard/tools" prefetch={false} className="text-xs text-accent-primary hover:underline no-underline flex items-center gap-1">
                                View All {renderIcon('chevron-right', 12)}
                            </Link>
                        </div>
                        <div className="divide-y divide-border">
                            {!dataReady ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="flex items-center gap-3 px-5 py-3 animate-pulse">
                                        <div className="w-9 h-9 rounded-lg bg-border flex-shrink-0" />
                                        <div className="flex-1 min-w-0 space-y-2">
                                            <div className="h-3.5 bg-border rounded w-2/3" />
                                            <div className="h-3 bg-border rounded w-1/3" />
                                        </div>
                                        <div className="h-5 w-16 bg-border rounded-full flex-shrink-0" />
                                    </div>
                                ))
                            ) : recentTools.length === 0 ? (
                                <div className="p-8 text-center text-text-tertiary text-sm">
                                    No tools yet. <Link href="/dashboard/tools/new" prefetch={false} className="text-accent-primary hover:underline">Add your first tool</Link>
                                </div>
                            ) : (
                                recentTools.map((tool) => (
                                    <Link
                                        key={tool.id}
                                        href={`/dashboard/tools/${tool.id}`}
                                        prefetch={false}
                                        className="flex items-center gap-3 px-5 py-3 hover:bg-bg-secondary transition-colors no-underline"
                                    >
                                        {tool.logoUrl ? (
                                            <img src={tool.logoUrl} alt="" className="w-9 h-9 rounded-lg object-contain flex-shrink-0" />
                                        ) : (
                                            <div className="w-9 h-9 rounded-lg bg-accent-primary/10 flex items-center justify-center text-accent-primary font-bold text-sm flex-shrink-0">
                                                {(tool.name || 'T')[0]}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-text-primary truncate">{tool.name}</div>
                                            <div className="text-xs text-text-tertiary truncate">{tool.category}</div>
                                        </div>
                                        <span
                                            className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${tool.status === 'published'
                                                ? 'bg-accent-green/10 text-accent-green'
                                                : 'bg-accent-yellow/10 text-accent-yellow'
                                                }`}
                                        >
                                            {tool.status}
                                        </span>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Recently Published */}
                    <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                            <h2 className="text-base font-semibold text-text-primary">Recently Published</h2>
                            <Link href="/" prefetch={false} target="_blank" className="text-xs text-accent-primary hover:underline no-underline flex items-center gap-1">
                                View Site {renderIcon('external-link', 12)}
                            </Link>
                        </div>
                        <div className="divide-y divide-border">
                            {!dataReady ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="flex items-center gap-3 px-5 py-3 animate-pulse">
                                        <div className="w-9 h-9 rounded-lg bg-border flex-shrink-0" />
                                        <div className="flex-1 min-w-0 space-y-2">
                                            <div className="h-3.5 bg-border rounded w-3/4" />
                                            <div className="h-3 bg-border rounded w-1/2" />
                                        </div>
                                        <div className="w-3.5 h-3.5 bg-border rounded flex-shrink-0" />
                                    </div>
                                ))
                            ) : recentPublished.length === 0 ? (
                                <div className="p-8 text-center text-text-tertiary text-sm">
                                    No published tools yet.
                                </div>
                            ) : (
                                recentPublished.filter(tool => tool.appUsername).map((tool) => (
                                    <Link
                                        key={tool.id}
                                        href={`/app/${tool.appUsername}`}
                                        target="_blank"
                                        className="flex items-center gap-3 px-5 py-3 hover:bg-bg-secondary transition-colors no-underline"
                                    >
                                        {tool.logoUrl ? (
                                            <img src={tool.logoUrl} alt="" className="w-9 h-9 rounded-lg object-contain flex-shrink-0" />
                                        ) : (
                                            <div className="w-9 h-9 rounded-lg bg-accent-green/10 flex items-center justify-center text-accent-green font-bold text-sm flex-shrink-0">
                                                {(tool.name || 'T')[0]}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-text-primary truncate">{tool.name}</div>
                                            <div className="text-xs text-text-tertiary truncate">{tool.summary || tool.description}</div>
                                        </div>
                                        <span className="text-text-tertiary flex-shrink-0">{renderIcon('external-link', 14)}</span>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
