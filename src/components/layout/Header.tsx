'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useSidebar } from '@/context/SidebarContext';
import { trackToolClick } from '@/hooks/useToolAnalytics';
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
    const { isPinned, setIsPinned } = useSidebar();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const searchInputRef = useRef<HTMLInputElement>(null);

    // API-based search suggestions (instead of sharedTools)
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const searchTimeout = useRef<NodeJS.Timeout>();

    // Fetch suggestions using Server Action (hidden from Network tab)
    const fetchSuggestions = async (query: string) => {
        if (!query || query.length < 2) {
            setSuggestions([]);
            return;
        }

        setIsLoading(true);
        try {
            const { getSearchSuggestionsAction } = await import('@/lib/actions');
            const tools = await getSearchSuggestionsAction(query, 8);
            setSuggestions(tools);
        } catch (error) {
            console.error('Search suggestions failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Debounced search suggestions
    useEffect(() => {
        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        if (searchQuery.length >= 2 && searchOpen) {
            searchTimeout.current = setTimeout(() => {
                fetchSuggestions(searchQuery);
            }, 200);
        } else {
            setSuggestions([]);
        }

        return () => {
            if (searchTimeout.current) {
                clearTimeout(searchTimeout.current);
            }
        };
    }, [searchQuery, searchOpen]);

    // Focus search input when search opens
    useEffect(() => {
        if (searchOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [searchOpen]);

    // Lock body scroll when menu or search is open
    useEffect(() => {
        if (sidebarOpen || searchOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [sidebarOpen, searchOpen]);

    // Handle search submission
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setSearchOpen(false);
            setSearchQuery('');
            setSuggestions([]);
        }
    };

    // Handle tool click
    const handleToolClick = (tool: any) => {
        trackToolClick({ id: tool.id, name: tool.name, app_username: tool.app_username, category: (tool.categoryName || [])[0], pricing: tool.pricing }, 'search');
        router.push(`/app/${tool.app_username}`);
        setSearchOpen(false);
        setSearchQuery('');
        setSuggestions([]);
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
            <nav className="fixed bottom-3 left-4 right-4 sm:bottom-3 sm:left-4 sm:right-4 z-[201] lg:hidden bg-bg-secondary border border-border rounded-full flex items-center justify-between sm:justify-around py-1 px-1.5 sm:py-1.5 sm:px-2 shadow-lg min-w-0">
                <Link
                    href="/"
                    prefetch={false}
                    className={cn(
                        "flex flex-col items-center gap-0.5 p-1 sm:p-1.5 rounded-full transition-colors focus:outline-none min-w-0 flex-shrink-0 flex-1",
                        pathname === '/' ? "text-accent-primary" : "text-text-secondary hover:text-text-primary"
                    )}
                    onClick={() => setSidebarOpen(false)}
                >
                    <Home strokeWidth={1.5} className="w-5 h-5 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="text-[8px] sm:text-[9px] font-medium truncate w-full text-center">Home</span>
                </Link>

                <button
                    onClick={() => setSearchOpen(true)}
                    className={cn(
                        "flex flex-col items-center gap-0.5 p-1 sm:p-1.5 rounded-full transition-colors focus:outline-none min-w-0 flex-shrink-0 flex-1",
                        searchOpen ? "text-accent-primary" : "text-text-secondary hover:text-text-primary"
                    )}
                    suppressHydrationWarning
                >
                    <Search strokeWidth={1.5} className="w-5 h-5 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="text-[8px] sm:text-[9px] font-medium truncate w-full text-center">Search</span>
                </button>

                <Link
                    href="/trending"
                    prefetch={false}
                    className={cn(
                        "flex flex-col items-center gap-0.5 p-1 sm:p-1.5 rounded-full transition-colors focus:outline-none min-w-0 flex-shrink-0 flex-1",
                        pathname === '/trending' ? "text-accent-primary" : "text-text-secondary hover:text-text-primary"
                    )}
                    onClick={() => setSidebarOpen(false)}
                >
                    <TrendingUp strokeWidth={1.5} className="w-5 h-5 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="text-[8px] sm:text-[9px] font-medium truncate w-full text-center">Trending</span>
                </Link>

                <Link
                    href="/new"
                    prefetch={false}
                    className={cn(
                        "flex flex-col items-center gap-0.5 p-1 sm:p-1.5 rounded-full transition-colors focus:outline-none min-w-0 flex-shrink-0 flex-1",
                        pathname === '/new' ? "text-accent-primary" : "text-text-secondary hover:text-text-primary"
                    )}
                    onClick={() => setSidebarOpen(false)}
                >
                    <Sparkles strokeWidth={1.5} className="w-5 h-5 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="text-[8px] sm:text-[9px] font-medium truncate w-full text-center">New</span>
                </Link>

                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className={cn(
                        "flex flex-col items-center gap-0.5 p-1 sm:p-1.5 rounded-full transition-colors focus:outline-none min-w-0 flex-shrink-0 flex-1",
                        sidebarOpen ? "text-accent-primary" : "text-text-secondary hover:text-text-primary"
                    )}
                    suppressHydrationWarning
                >
                    <Menu strokeWidth={1.5} className={cn("w-5 h-5 sm:w-5 sm:h-5 flex-shrink-0 transition-transform", sidebarOpen && "rotate-90")} />
                    <span className="text-[8px] sm:text-[9px] font-medium truncate w-full text-center">Menu</span>
                </button>
            </nav>

            {/* Full Page Mobile Search Overlay */}
            {searchOpen && (
                <div className="fixed inset-0 z-[300] lg:hidden bg-bg-primary flex flex-col animate-[fadeIn_0.1s_ease]">
                    {/* Search header */}
                    <div className="flex items-center gap-3 p-4 border-b border-border">
                        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-3 bg-bg-secondary rounded-full px-4 py-2.5 border border-border focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20">
                            {isLoading ? (
                                <span className="w-[18px] h-[18px] border-2 border-border border-t-accent-primary rounded-full animate-spin flex-shrink-0" />
                            ) : (
                                <Search size={18} className="text-text-tertiary flex-shrink-0" />
                            )}
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
                                {isLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <span className="w-5 h-5 border-2 border-border border-t-accent-primary rounded-full animate-spin"></span>
                                    </div>
                                ) : suggestions.map((tool) => (
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
                                            <div className="text-sm font-medium text-text-primary truncate flex items-center gap-1">
                                                {tool.name}
                                                {tool.listingType === 'verified' && (
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#1d9bf0" className="flex-shrink-0" role="img" aria-label="Verified">
                                                        <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" />
                                                    </svg>
                                                )}
                                                {(tool.listingType === 'featured' || tool.listingType === 'spotlight' || tool.spotlightEnabled || tool.isFeatured) && tool.listingType !== 'verified' && (
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b" className="flex-shrink-0" role="img" aria-label="Featured">
                                                        <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" />
                                                    </svg>
                                                )}
                                            </div>
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
                    className="fixed inset-0 z-[200] lg:hidden bg-bg-primary flex flex-col animate-[fadeIn_0.15s_ease]"
                    style={{ paddingBottom: '70px' }}
                >
                    {/* Menu items */}
                    <nav className="flex-1 flex flex-col gap-1 px-6 py-6 overflow-y-auto">
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
                        <div className="flex items-center gap-2 bg-bg-tertiary border border-border rounded-lg p-1">
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
                            "flex items-center gap-1 bg-bg-tertiary border border-border rounded-lg p-0.5",
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
                        <Pin size={18} strokeWidth={1.5} className={cn(isPinned && "rotate-45")} fill={isPinned ? "currentColor" : "none"} />
                    </button>
                </div>
            </aside>
        </>
    );
}
