'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignOutButton } from '@clerk/nextjs';
import { useTheme } from '@/context/ThemeContext';
import {
    LayoutDashboard,
    Wrench,
    Folder,
    Target,
    Tag,
    Star,
    Rocket,
    Shield,
    BarChart3,
    FileText,
    Settings,
    ArrowLeft,
    Search,
    Sun,
    Moon,
    LogOut,
    Plus,
    LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ToastProvider } from '@/components/ui/Toast';
import { ConfirmProvider } from '@/components/ui/ConfirmModal';

// Icon component mapping for admin navigation
const iconMap: Record<string, LucideIcon> = {
    dashboard: LayoutDashboard,
    tools: Wrench,
    folder: Folder,
    target: Target,
    tag: Tag,
    star: Star,
    rocket: Rocket,
    shield: Shield,
    chart: BarChart3,
    notes: FileText,
    settings: Settings,
    back: ArrowLeft,
    search: Search,
    plus: Plus,
};

// Render icon helper - replaces the old icons.tsx
export const renderIcon = (iconName: string, size: number = 18) => {
    const IconComponent = iconMap[iconName];
    if (!IconComponent) return null;
    return <IconComponent size={size} strokeWidth={1.5} />;
};

interface AdminLayoutProps {
    children: ReactNode;
}

interface NavItem {
    href: string;
    label: string;
    icon: string;
}

interface NavGroup {
    label?: string;
    items: NavItem[];
}

const navGroups: NavGroup[] = [
    {
        items: [
            { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
            { href: '/dashboard/tools', label: 'Tools', icon: 'tools' },
        ]
    },
    {
        label: 'Taxonomy',
        items: [
            { href: '/dashboard/categories', label: 'Categories', icon: 'folder' },
            { href: '/dashboard/tasks', label: 'Tasks', icon: 'target' },
            { href: '/dashboard/tags', label: 'Tags', icon: 'tag' },
        ]
    },
    {
        label: 'Advertising',
        items: [
            { href: '/dashboard/spotlight', label: 'Spotlight', icon: 'star' },
            { href: '/dashboard/featured', label: 'Featured', icon: 'rocket' },
        ]
    },
    {
        items: [
            { href: '/dashboard/moderation', label: 'Moderation', icon: 'shield' },
            { href: '/dashboard/analytics', label: 'Analytics', icon: 'chart' },
            { href: '/dashboard/notes', label: 'Notes', icon: 'notes' },
            { href: '/dashboard/settings', label: 'Page Settings', icon: 'settings' },
        ]
    },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
    const pathname = usePathname();
    const { theme, toggleTheme } = useTheme();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isPinned, setIsPinned] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('adminSidebarPinned');
        if (saved === 'true') setIsPinned(true);
    }, []);

    const togglePin = () => {
        const newState = !isPinned;
        setIsPinned(newState);
        localStorage.setItem('adminSidebarPinned', String(newState));
    };

    const isActive = (href: string) => {
        if (href === '/dashboard') return pathname === '/dashboard';
        return pathname.startsWith(href);
    };

    const isExpanded = sidebarOpen || isPinned;

    return (
        <ConfirmProvider>
            <ToastProvider>
                <div className="flex min-h-screen bg-bg-primary">
                    {sidebarOpen && (
                        <div
                            className="fixed inset-0 bg-black/40 z-overlay lg:hidden"
                            onClick={() => setSidebarOpen(false)}
                        />
                    )}

                    <aside className={cn(
                        "fixed left-0 top-0 bottom-0 bg-bg-secondary border-r border-border",
                        "flex flex-col z-sidebar overflow-hidden transition-all duration-200 group",
                        sidebarOpen ? 'translate-x-0 w-[85vw] max-w-sidebar' : '-translate-x-full lg:translate-x-0',
                        isPinned ? 'lg:w-sidebar' : 'lg:w-sidebar-collapsed lg:hover:w-sidebar'
                    )}>
                        <div className="px-3 py-3.5 border-b border-border flex items-center justify-between">
                            <Link href="/dashboard" prefetch={false} className="flex items-center gap-2.5 no-underline">
                                <span className="flex items-center justify-center w-8 h-8 text-accent-primary flex-shrink-0">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <rect x="3" y="3" width="18" height="18" rx="2" />
                                        <path d="M9 9h6M9 15h6M9 12h6" />
                                    </svg>
                                </span>
                                <span className={cn(
                                    "text-[0.9375rem] font-semibold text-text-primary tracking-tight whitespace-nowrap transition-opacity duration-150",
                                    isExpanded ? 'opacity-100' : 'opacity-0 lg:group-hover:opacity-100'
                                )}>
                                    Admin
                                </span>
                            </Link>
                            <button
                                onClick={togglePin}
                                className={cn(
                                    "hidden lg:flex items-center justify-center w-6 h-6 rounded transition-all",
                                    isPinned ? 'text-accent-primary' : 'text-text-tertiary hover:text-text-secondary',
                                    isExpanded ? 'opacity-100' : 'opacity-0 lg:group-hover:opacity-100'
                                )}
                                title={isPinned ? 'Unpin sidebar' : 'Pin sidebar'}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill={isPinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                                    <path d="M12 17v5" /><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6a1 1 0 0 1 1-1h1V3H7v2h1a1 1 0 0 1 1 1z" />
                                </svg>
                            </button>
                        </div>

                        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2 flex flex-col gap-0.5">
                            {navGroups.map((group, groupIndex) => (
                                <div key={groupIndex}>
                                    {groupIndex > 0 && <div className="h-px bg-border mx-2.5 my-1.5" />}
                                    {group.label && (
                                        <span className={cn(
                                            "text-[0.6875rem] font-medium text-text-tertiary uppercase tracking-wider px-2.5 py-2 pb-1 whitespace-nowrap block transition-opacity duration-150",
                                            isExpanded ? 'opacity-100' : 'opacity-0 lg:group-hover:opacity-100'
                                        )}>
                                            {group.label}
                                        </span>
                                    )}
                                    <div className="flex flex-col gap-px">
                                        {group.items.map((item) => (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                prefetch={false}
                                                className={cn(
                                                    "flex items-center gap-2.5 px-2.5 py-2 text-[0.8125rem] font-[450] no-underline rounded-md transition-all duration-fast whitespace-nowrap",
                                                    isActive(item.href)
                                                        ? 'bg-bg-tertiary text-text-primary'
                                                        : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                                                )}
                                                title={item.label}
                                            >
                                                <span className="flex items-center justify-center w-5 h-5 flex-shrink-0">
                                                    {renderIcon(item.icon)}
                                                </span>
                                                <span className={cn(
                                                    "whitespace-nowrap transition-opacity duration-150",
                                                    isExpanded ? 'opacity-100' : 'opacity-0 lg:group-hover:opacity-100'
                                                )}>
                                                    {item.label}
                                                </span>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </nav>

                        <div className="p-2 border-t border-border flex flex-col gap-0.5">
                            <button
                                onClick={toggleTheme}
                                className="flex items-center gap-2.5 px-2.5 py-2 text-[0.8125rem] font-[450] text-text-secondary rounded-md transition-all duration-fast whitespace-nowrap hover:bg-bg-tertiary hover:text-text-primary w-full text-left border-none bg-transparent cursor-pointer"
                                title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
                            >
                                <span className="flex items-center justify-center w-5 h-5 flex-shrink-0">
                                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                                </span>
                                <span className={cn(
                                    "whitespace-nowrap transition-opacity duration-150",
                                    isExpanded ? 'opacity-100' : 'opacity-0 lg:group-hover:opacity-100'
                                )}>
                                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                                </span>
                            </button>
                            <SignOutButton redirectUrl="/">
                                <button
                                    className="flex items-center gap-2.5 px-2.5 py-2 text-[0.8125rem] font-[450] text-text-secondary rounded-md transition-all duration-fast whitespace-nowrap hover:bg-red-500/10 hover:text-red-500 w-full text-left border-none bg-transparent cursor-pointer"
                                    title="Sign Out"
                                >
                                    <span className="flex items-center justify-center w-5 h-5 flex-shrink-0">
                                        <LogOut size={18} />
                                    </span>
                                    <span className={cn(
                                        "whitespace-nowrap transition-opacity duration-150",
                                        isExpanded ? 'opacity-100' : 'opacity-0 lg:group-hover:opacity-100'
                                    )}>
                                        Sign Out
                                    </span>
                                </button>
                            </SignOutButton>
                            <Link
                                href="/"
                                prefetch={false}
                                className="flex items-center gap-2.5 px-2.5 py-2 text-[0.8125rem] font-[450] text-text-secondary no-underline rounded-md transition-all duration-fast whitespace-nowrap hover:bg-bg-tertiary hover:text-text-primary"
                                title="Back to Site"
                            >
                                <span className="flex items-center justify-center w-5 h-5 flex-shrink-0">
                                    {renderIcon('back')}
                                </span>
                                <span className={cn(
                                    "whitespace-nowrap transition-opacity duration-150",
                                    isExpanded ? 'opacity-100' : 'opacity-0 lg:group-hover:opacity-100'
                                )}>
                                    Back to Site
                                </span>
                            </Link>
                        </div>
                    </aside>

                    <header className="fixed top-0 left-0 right-0 flex items-center justify-between px-3 py-2 bg-bg-secondary border-b border-border z-header lg:hidden">
                        <button
                            className="flex items-center justify-center w-8 h-8 border-none bg-transparent text-text-secondary cursor-pointer rounded-md transition-all duration-fast hover:bg-bg-tertiary hover:text-text-primary"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            aria-label="Toggle menu"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <line x1="3" y1="12" x2="21" y2="12" />
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <line x1="3" y1="18" x2="21" y2="18" />
                            </svg>
                        </button>
                        <div className="w-8" />
                    </header>

                    <main className={cn(
                        "flex-1 transition-all duration-200 pt-12 lg:pt-0",
                        isPinned ? 'lg:ml-sidebar' : 'lg:ml-sidebar-collapsed'
                    )}>
                        {children}
                    </main>
                </div>
            </ToastProvider>
        </ConfirmProvider >
    );
}
