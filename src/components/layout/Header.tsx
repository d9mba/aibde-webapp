'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useSearch } from '@/context/SearchContext';
import { useSidebar } from '@/context/SidebarContext';
import { trackToolClick } from '@/hooks/useToolAnalytics';
import { useDebounce } from '@/hooks/useDebounce';
import {
    Home,
    Search,
    TrendingUp,
    Sparkles,
    Folder,
    ClipboardEdit,
    Plus,
    Sun,
    Moon,
    Menu,
    Pin,
    X,
    Monitor,
    Info,
    Mail,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getNextThemeMode, ThemeMode } from '@/lib/formatters';

// Helper to get theme icon based on current mode
function getThemeIcon(mode: ThemeMode) {
    switch (mode) {
        case 'dark': return <Moon size={18} strokeWidth={1.5} />;
        case 'light': return <Sun size={18} strokeWidth={1.5} />;
        case 'system': return <Monitor size={18} strokeWidth={1.5} />;
    }
}

// Icon component mapping for navigation
const iconMap = {
    home: Home,
    search: Search,
    trending: TrendingUp,
    sparkle: Sparkles,
    folder: Folder,
    task: ClipboardEdit,
    plus: Plus,
    sun: Sun,
    moon: Moon,
    menu: Menu,
    info: Info,
    mail: Mail,
} as const;

type IconName = keyof typeof iconMap;

interface NavItem {
    href: string;
    label: string;
    icon: IconName;
}

export default function Header() {
    const pathname = usePathname();
    const router = useRouter();
    const { theme, themeMode, setThemeMode } = useTheme();
    const { sharedTools } = useSearch();
    const { isPinned, setIsPinned } = useSidebar();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Use sharedTools from SearchContext (set by HeroSection)
    const tools = sharedTools;
    const debouncedQuery = useDebounce(searchQuery, 300);

    // Filter recommendations - minimum 3 characters
    const recommendations = debouncedQuery.trim().length >= 3
        ? tools
            .filter(tool =>
                (tool.name || '').toLowerCase().includes(debouncedQuery.toLowerCase()) ||
                (tool.description || '').toLowerCase().includes(debouncedQuery.toLowerCase())
            )
            .slice(0, 8)
        : [];

    // Focus search input when search opens
    useEffect(() => {
        if (searchOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [searchOpen]);

    // Handle search submission
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setSearchOpen(false);
            setSearchQuery('');
        }
    };

    // Handle tool click
    const handleToolClick = (tool: typeof tools[0]) => {
        trackToolClick({ id: tool.id, name: tool.name, app_username: tool.app_username, category: (tool.categoryName || [])[0], pricing: tool.pricing }, 'search');
        router.push(`/app/${tool.app_username}`);
        setSearchOpen(false);
        setSearchQuery('');
    };

    const isHomePage = pathname === '/';

    const isActive = (href: string) => {
        if (href === '/') return pathname === '/';
        return pathname.startsWith(href);
    };

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setSidebarOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const mainNav: NavItem[] = [
        { href: '/', label: 'Home', icon: 'home' },
        { href: '/search', label: 'Search', icon: 'search' },
        { href: '/trending', label: 'Trending', icon: 'trending' },
        { href: '/new', label: 'New', icon: 'sparkle' },
    ];

    const browseNav: NavItem[] = [
        { href: '/category', label: 'Categories', icon: 'folder' },
        { href: '/tasks', label: 'Tasks', icon: 'task' },
    ];

    const actionNav: NavItem[] = [
        { href: '/submit', label: 'Submit', icon: 'plus' },
    ];

    const moreNav: NavItem[] = [
        { href: '/about', label: 'About', icon: 'info' },
        { href: '/contact', label: 'Contact', icon: 'mail' },
    ];

    const handleLinkClick = () => {
        if (window.innerWidth < 1024) {
            setSidebarOpen(false);
        }
    };

    const renderIcon = (iconName: IconName, className?: string) => {
        const IconComponent = iconMap[iconName];
        return <IconComponent size={18} strokeWidth={1.5} className={className} />;
    };

    return (
        <>
            {/* Mobile Bottom Navigation Bar - Compact Capsule Style */}
            <nav className="fixed bottom-3 left-4 right-4 z-[201] lg:hidden bg-bg-secondary border border-border rounded-full flex items-center justify-around py-1.5 px-2 shadow-lg">
                <Link
                    href="/"
                    prefetch={false}
                    className={cn(
                        "flex flex-col items-center gap-0.5 p-1.5 rounded-full transition-colors focus:outline-none",
                        pathname === '/' ? "text-accent-primary" : "text-text-secondary hover:text-text-primary"
                    )}
                >
                    <Home size={20} strokeWidth={1.5} />
                    <span className="text-[9px] font-medium">Home</span>
                </Link>

                <button
                    onClick={() => setSearchOpen(true)}
                    className={cn(
                        "flex flex-col items-center gap-0.5 p-1.5 rounded-full transition-colors focus:outline-none",
                        searchOpen ? "text-accent-primary" : "text-text-secondary hover:text-text-primary"
                    )}
                    suppressHydrationWarning
                >
                    <Search size={20} strokeWidth={1.5} />
                    <span className="text-[9px] font-medium">Search</span>
                </button>

                <Link
                    href="/trending"
                    prefetch={false}
                    className={cn(
                        "flex flex-col items-center gap-0.5 p-1.5 rounded-full transition-colors focus:outline-none",
                        pathname === '/trending' ? "text-accent-primary" : "text-text-secondary hover:text-text-primary"
                    )}
                >
                    <TrendingUp size={20} strokeWidth={1.5} />
                    <span className="text-[9px] font-medium">Trending</span>
                </Link>

                <Link
                    href="/new"
                    prefetch={false}
                    className={cn(
                        "flex flex-col items-center gap-0.5 p-1.5 rounded-full transition-colors focus:outline-none",
                        pathname === '/new' ? "text-accent-primary" : "text-text-secondary hover:text-text-primary"
                    )}
                >
                    <Sparkles size={20} strokeWidth={1.5} />
                    <span className="text-[9px] font-medium">New</span>
                </Link>

                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className={cn(
                        "flex flex-col items-center gap-0.5 p-1.5 rounded-full transition-colors focus:outline-none",
                        sidebarOpen ? "text-accent-primary" : "text-text-secondary hover:text-text-primary"
                    )}
                    suppressHydrationWarning
                >
                    <Menu size={20} strokeWidth={1.5} />
                    <span className="text-[9px] font-medium">Menu</span>
                </button>
            </nav>

            {/* Full Page Mobile Search Overlay */}
            {searchOpen && (
                <div className="fixed inset-0 z-[300] lg:hidden bg-bg-primary flex flex-col animate-[fadeIn_0.1s_ease]">
                    {/* Search header */}
                    <div className="flex items-center gap-3 p-4 border-b border-border">
                        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-3 bg-bg-secondary rounded-full px-4 py-2.5 border border-border focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20">
                            <Search size={18} className="text-text-tertiary flex-shrink-0" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search AI tools..."
                                className="flex-1 bg-transparent border-none outline-none text-sm text-text-primary placeholder:text-text-tertiary"
                                autoComplete="off"
                                suppressHydrationWarning
                            />
                            {searchQuery && (
                                <button type="button" onClick={() => setSearchQuery('')} className="text-text-tertiary hover:text-text-primary">
                                    <X size={16} />
                                </button>
                            )}
                        </form>
                        <button
                            onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                            className="text-text-secondary hover:text-text-primary text-sm font-medium"
                        >
                            Cancel
                        </button>
                    </div>

                    {/* Search results */}
                    <div className="flex-1 overflow-y-auto">
                        {searchQuery.trim() ? (
                            <div className="flex flex-col">
                                {recommendations.map((tool) => (
                                    <button
                                        key={tool.id}
                                        onClick={() => handleToolClick(tool)}
                                        className="flex items-center gap-3 px-4 py-3 text-left hover:bg-bg-secondary transition-colors border-b border-border"
                                    >
                                        {tool.logoUrl ? (
                                            <img src={tool.logoUrl} alt="" className="w-10 h-10 rounded-lg object-contain flex-shrink-0" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-lg bg-accent-primary/20 flex items-center justify-center flex-shrink-0">
                                                <span className="text-sm font-semibold text-accent-primary">{tool.name[0]}</span>
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-text-primary truncate">{tool.name}</div>
                                            <div className="text-xs text-text-tertiary truncate">{tool.summary}</div>
                                        </div>
                                    </button>
                                ))}
                                {/* Search for option - simple style like desktop */}
                                <button
                                    onClick={handleSearchSubmit as () => void}
                                    className="flex items-center gap-3 px-4 py-3 text-left hover:bg-bg-secondary transition-colors border-b border-border"
                                >
                                    <Search size={20} className="text-text-tertiary flex-shrink-0 ml-2.5" />
                                    <span className="text-sm text-text-secondary">
                                        Search for &quot;{searchQuery}&quot;...
                                    </span>
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                <Search size={40} className="text-text-tertiary mb-3" />
                                <p className="text-sm text-text-secondary">Start typing to search AI tools</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Full Page Mobile Menu */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-[300] lg:hidden bg-bg-primary flex flex-col animate-[fadeIn_0.15s_ease]"
                >
                    {/* Close button */}
                    <div className="flex justify-end p-4">
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="p-2 text-text-secondary hover:text-text-primary focus:outline-none"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                        </button>
                    </div>

                    {/* Menu items */}
                    <nav className="flex-1 flex flex-col gap-1 px-6 py-4">
                        {mainNav.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                prefetch={false}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 text-base font-medium rounded-lg transition-colors",
                                    isActive(item.href)
                                        ? 'bg-border text-text-primary'
                                        : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                                )}
                                onClick={() => setSidebarOpen(false)}
                            >
                                {renderIcon(item.icon)}
                                {item.label}
                            </Link>
                        ))}

                        <div className="h-px bg-border my-3" />

                        {browseNav.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                prefetch={false}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 text-base font-medium rounded-lg transition-colors",
                                    isActive(item.href)
                                        ? 'bg-border text-text-primary'
                                        : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                                )}
                                onClick={() => setSidebarOpen(false)}
                            >
                                {renderIcon(item.icon)}
                                {item.label}
                            </Link>
                        ))}

                        <div className="h-px bg-border my-3" />

                        {actionNav.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                prefetch={false}
                                className="flex items-center gap-3 px-4 py-3 text-base font-bold text-accent-primary rounded-lg transition-colors hover:bg-bg-tertiary"
                                onClick={() => setSidebarOpen(false)}
                            >
                                {renderIcon(item.icon)}
                                {item.label}
                            </Link>
                        ))}

                        {moreNav.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                prefetch={false}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 text-base font-medium rounded-lg transition-colors",
                                    isActive(item.href)
                                        ? 'bg-border text-text-primary'
                                        : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                                )}
                                onClick={() => setSidebarOpen(false)}
                            >
                                {renderIcon(item.icon)}
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Theme toggle at bottom */}
                    <div className="p-6 border-t border-border">
                        <p className="text-xs text-text-tertiary uppercase tracking-wider mb-3">Theme</p>
                        <div className="flex items-center gap-2 bg-bg-tertiary rounded-lg p-1">
                            <button
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all",
                                    themeMode === 'light' ? "bg-bg-card text-text-primary shadow-sm" : "text-text-secondary hover:text-text-primary"
                                )}
                                onClick={() => { setThemeMode('light'); setSidebarOpen(false); }}
                            >
                                <Sun size={16} strokeWidth={1.5} />
                                Light
                            </button>
                            <button
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all",
                                    themeMode === 'dark' ? "bg-bg-card text-text-primary shadow-sm" : "text-text-secondary hover:text-text-primary"
                                )}
                                onClick={() => { setThemeMode('dark'); setSidebarOpen(false); }}
                            >
                                <Moon size={16} strokeWidth={1.5} />
                                Dark
                            </button>
                            <button
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all",
                                    themeMode === 'system' ? "bg-bg-card text-text-primary shadow-sm" : "text-text-secondary hover:text-text-primary"
                                )}
                                onClick={() => { setThemeMode('system'); setSidebarOpen(false); }}
                            >
                                <Monitor size={16} strokeWidth={1.5} />
                                Auto
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Desktop Sidebar - Left side only */}
            <aside className={cn(
                "fixed bottom-0 bg-bg-secondary border-t border-border hidden lg:flex",
                "flex-col z-[200] overflow-hidden transition-all duration-200",
                "left-0 border-r",
                // Always start below the top header
                "top-16",
                // Width: pinned = always expanded, not pinned = collapsed with hover expand
                isPinned ? 'w-[220px]' : 'w-14',
                !isPinned && "hover:w-[220px]",
                "group"
            )}>

                <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2 flex flex-col gap-0.5">
                    <div className="flex flex-col gap-px">
                        {mainNav.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                prefetch={false}
                                className={cn(
                                    "flex items-center gap-2.5 px-2.5 py-2 text-[0.8125rem] font-[450] no-underline rounded-md transition-all duration-fast whitespace-nowrap focus:outline-none",
                                    isActive(item.href)
                                        ? 'bg-border text-text-primary font-medium'
                                        : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                                )}
                                onClick={handleLinkClick}
                                title={item.label}
                            >
                                <span className="flex items-center justify-center w-5 h-5 flex-shrink-0">
                                    {renderIcon(item.icon)}
                                </span>
                                <span className={cn(
                                    "whitespace-nowrap transition-opacity duration-150",
                                    (sidebarOpen || isPinned) ? 'opacity-100' : 'opacity-0 lg:group-hover:opacity-100'
                                )}>
                                    {item.label}
                                </span>
                            </Link>
                        ))}
                    </div>

                    <div className="h-px bg-border mx-2.5 my-1.5" />

                    <div className="flex flex-col gap-px">
                        {browseNav.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                prefetch={false}
                                className={cn(
                                    "flex items-center gap-2.5 px-2.5 py-2 text-[0.8125rem] font-[450] no-underline rounded-md transition-all duration-fast whitespace-nowrap focus:outline-none",
                                    isActive(item.href)
                                        ? 'bg-border text-text-primary font-medium'
                                        : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                                )}
                                onClick={handleLinkClick}
                                title={item.label}
                            >
                                <span className="flex items-center justify-center w-5 h-5 flex-shrink-0">
                                    {renderIcon(item.icon)}
                                </span>
                                <span className={cn(
                                    "whitespace-nowrap transition-opacity duration-150",
                                    (sidebarOpen || isPinned) ? 'opacity-100' : 'opacity-0 lg:group-hover:opacity-100'
                                )}>
                                    {item.label}
                                </span>
                            </Link>
                        ))}
                    </div>

                    <div className="h-px bg-border mx-2.5 my-1.5" />

                    <div className="flex flex-col gap-px">
                        {actionNav.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                prefetch={false}
                                className="flex items-center gap-2.5 px-2.5 py-2 text-[0.8125rem] font-bold text-accent-primary no-underline rounded-md transition-all duration-fast whitespace-nowrap hover:bg-bg-tertiary focus:outline-none"
                                onClick={handleLinkClick}
                                title={item.label}
                            >
                                <span className="flex items-center justify-center w-5 h-5 flex-shrink-0">
                                    {renderIcon(item.icon)}
                                </span>
                                <span className={cn(
                                    "whitespace-nowrap transition-opacity duration-150",
                                    (sidebarOpen || isPinned) ? 'opacity-100' : 'opacity-0 lg:group-hover:opacity-100'
                                )}>
                                    {item.label}
                                </span>
                            </Link>
                        ))}
                    </div>

                    <div className="flex flex-col gap-px">
                        {moreNav.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                prefetch={false}
                                className={cn(
                                    "flex items-center gap-2.5 px-2.5 py-2 text-[0.8125rem] font-[450] no-underline rounded-md transition-all duration-fast whitespace-nowrap focus:outline-none",
                                    isActive(item.href)
                                        ? 'bg-border text-text-primary font-medium'
                                        : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                                )}
                                onClick={handleLinkClick}
                                title={item.label}
                            >
                                <span className="flex items-center justify-center w-5 h-5 flex-shrink-0">
                                    {renderIcon(item.icon)}
                                </span>
                                <span className={cn(
                                    "whitespace-nowrap transition-opacity duration-150",
                                    (sidebarOpen || isPinned) ? 'opacity-100' : 'opacity-0 lg:group-hover:opacity-100'
                                )}>
                                    {item.label}
                                </span>
                            </Link>
                        ))}
                    </div>
                </nav>

                <div className={cn(
                    "p-2 border-t border-border flex items-center",
                    // Center theme toggle when collapsed, justify-between when expanded
                    (sidebarOpen || isPinned) ? "justify-between gap-1" : "justify-center lg:group-hover:justify-between lg:group-hover:gap-1"
                )}>
                    {/* Theme toggle - collapsed: icon only, expanded: three buttons */}
                    <div className={cn(
                        "flex items-center",
                        (sidebarOpen || isPinned) ? "gap-1 flex-1" : "lg:group-hover:gap-1 lg:group-hover:flex-1"
                    )}>
                        {/* Collapsed: Single icon */}
                        <button
                            className={cn(
                                "flex items-center justify-center w-10 h-10 rounded-md cursor-pointer transition-all duration-fast focus:outline-none",
                                "text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary",
                                (sidebarOpen || isPinned) ? "hidden" : "flex lg:group-hover:hidden"
                            )}
                            onClick={() => setThemeMode(getNextThemeMode(themeMode as ThemeMode))}
                            title={`Current: ${themeMode}`}
                        >
                            {getThemeIcon(themeMode as ThemeMode)}
                        </button>

                        {/* Expanded: Three theme options */}
                        <div className={cn(
                            "flex items-center gap-1 bg-bg-tertiary rounded-lg p-0.5",
                            (sidebarOpen || isPinned) ? "flex" : "hidden lg:group-hover:flex"
                        )}>
                            <button
                                className={cn(
                                    "flex items-center justify-center w-8 h-8 rounded-md cursor-pointer transition-all duration-fast focus:outline-none",
                                    themeMode === 'light' ? "bg-bg-card text-text-primary shadow-sm" : "text-text-tertiary hover:text-text-primary"
                                )}
                                onClick={() => setThemeMode('light')}
                                title="Light mode"
                            >
                                <Sun size={16} strokeWidth={1.5} />
                            </button>
                            <button
                                className={cn(
                                    "flex items-center justify-center w-8 h-8 rounded-md cursor-pointer transition-all duration-fast focus:outline-none",
                                    themeMode === 'dark' ? "bg-bg-card text-text-primary shadow-sm" : "text-text-tertiary hover:text-text-primary"
                                )}
                                onClick={() => setThemeMode('dark')}
                                title="Dark mode"
                            >
                                <Moon size={16} strokeWidth={1.5} />
                            </button>
                            <button
                                className={cn(
                                    "flex items-center justify-center w-8 h-8 rounded-md cursor-pointer transition-all duration-fast focus:outline-none",
                                    themeMode === 'system' ? "bg-bg-card text-text-primary shadow-sm" : "text-text-tertiary hover:text-text-primary"
                                )}
                                onClick={() => setThemeMode('system')}
                                title="System preference"
                            >
                                <Monitor size={16} strokeWidth={1.5} />
                            </button>
                        </div>
                    </div>

                    {/* Pin button - only visible when sidebar is expanded */}
                    <button
                        onClick={() => setIsPinned(!isPinned)}
                        className={cn(
                            "flex items-center justify-center w-10 h-10 rounded-md cursor-pointer transition-all duration-fast focus:outline-none flex-shrink-0",
                            isPinned ? "text-accent-primary" : "text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary",
                            // Hide when collapsed, show when expanded
                            (sidebarOpen || isPinned) ? "flex" : "hidden lg:group-hover:flex"
                        )}
                        title={isPinned ? "Unpin sidebar" : "Pin sidebar"}
                    >
                        <Pin size={18} strokeWidth={1.5} className={cn(isPinned && "rotate-45")} />
                    </button>
                </div>
            </aside>
        </>
    );
}
