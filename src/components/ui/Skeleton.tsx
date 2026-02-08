interface SkeletonProps {
    variant?: 'text' | 'card' | 'circle' | 'rect';
    width?: string | number;
    height?: string | number;
    className?: string;
}

/**
 * Base Skeleton component with shimmer animation
 * Works responsively on mobile and web
 */
export default function Skeleton({ variant = 'text', width, height, className = '' }: SkeletonProps): JSX.Element {
    const style: React.CSSProperties = {};
    if (width) style.width = typeof width === 'number' ? `${width}px` : width;
    if (height) style.height = typeof height === 'number' ? `${height}px` : height;

    const variantClasses: Record<string, string> = {
        text: 'h-4 rounded',
        card: 'rounded-lg',
        circle: 'rounded-full',
        rect: 'rounded-md',
    };

    return (
        <div
            className={`bg-gradient-to-r from-bg-tertiary via-bg-card to-bg-tertiary bg-[length:200%_100%] animate-shimmer ${variantClasses[variant]} ${className}`}
            style={style}
        />
    );
}

// ===== Tool Card Skeleton =====
// Responsive: Matches ToolCard layout on all screen sizes
export function ToolCardSkeleton(): JSX.Element {
    return (
        <div className="flex flex-col gap-2.5 sm:gap-3 p-3 sm:p-4 bg-bg-card border border-border rounded-lg min-h-[160px] sm:min-h-[180px]">
            <div className="flex gap-2.5 sm:gap-3 items-start flex-1">
                <Skeleton variant="rect" width={40} height={40} className="flex-shrink-0 sm:w-11 sm:h-11" />
                <div className="flex-1 min-w-0 flex flex-col gap-1 sm:gap-1.5">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <Skeleton variant="text" className="w-[45%] sm:w-[50%] h-3.5 sm:h-4" />
                        <Skeleton variant="circle" width={12} height={12} className="sm:w-3.5 sm:h-3.5" />
                    </div>
                    <Skeleton variant="text" className="w-full h-2.5 sm:h-3" />
                    <Skeleton variant="text" className="w-[80%] sm:w-[85%] h-2.5 sm:h-3" />
                    <div className="flex gap-1 sm:gap-1.5 mt-0.5 sm:mt-1 flex-wrap">
                        <Skeleton variant="rect" className="w-16 sm:w-20 h-4 sm:h-[18px] rounded-sm" />
                        <Skeleton variant="rect" className="w-14 sm:w-[70px] h-4 sm:h-[18px] rounded-sm" />
                    </div>
                </div>
            </div>
            <div className="flex justify-between items-center pt-1.5 sm:pt-2 border-t border-border">
                <Skeleton variant="text" className="w-12 sm:w-[60px] h-2 sm:h-2.5" />
                <div className="flex gap-1.5 sm:gap-2">
                    <Skeleton variant="text" className="w-6 sm:w-[30px] h-2 sm:h-2.5" />
                    <Skeleton variant="text" className="w-6 sm:w-[30px] h-2 sm:h-2.5" />
                </div>
                <Skeleton variant="text" className="w-8 sm:w-10 h-2 sm:h-2.5" />
            </div>
        </div>
    );
}

// Compact variant for spotlight cards - responsive
export function ToolCardSkeletonCompact(): JSX.Element {
    return (
        <div className="flex flex-col gap-2 sm:gap-2.5 p-2.5 sm:p-3.5 bg-bg-card border border-border rounded-lg min-h-[130px] sm:min-h-[150px]">
            <div className="flex gap-2 sm:gap-2.5 items-start flex-1">
                <Skeleton variant="rect" width={32} height={32} className="flex-shrink-0 sm:w-[38px] sm:h-[38px]" />
                <div className="flex-1 min-w-0 flex flex-col gap-0.5 sm:gap-1">
                    <Skeleton variant="text" className="w-[55%] sm:w-[60%] h-3 sm:h-3.5" />
                    <Skeleton variant="text" className="w-full h-2 sm:h-2.5" />
                    <Skeleton variant="text" className="w-[75%] sm:w-[80%] h-2 sm:h-2.5" />
                </div>
            </div>
            <div className="flex justify-between items-center pt-1 sm:pt-1.5 border-t border-border">
                <Skeleton variant="text" className="w-10 sm:w-[50px] h-1.5 sm:h-2" />
                <Skeleton variant="text" className="w-7 sm:w-[35px] h-1.5 sm:h-2" />
            </div>
        </div>
    );
}

// ===== Grid Skeletons - Responsive =====
export function ToolGridSkeleton({ count = 9 }: { count?: number }): JSX.Element {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
            {Array.from({ length: count }).map((_, i) => (
                <ToolCardSkeleton key={i} />
            ))}
        </div>
    );
}

export function SpotlightGridSkeleton({ count = 4 }: { count?: number }): JSX.Element {
    return (
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
            {Array.from({ length: count }).map((_, i) => (
                <ToolCardSkeletonCompact key={i} />
            ))}
        </div>
    );
}

// ===== Hero Section Skeleton - Mobile First =====
export function HeroSkeleton(): JSX.Element {
    return (
        <section className="flex flex-col items-center gap-4 sm:gap-6 text-center pt-6 sm:pt-8 pb-3 sm:pb-4 px-4 sm:px-0">
            {/* Logo placeholder */}
            <Skeleton variant="text" className="w-24 sm:w-[120px] h-10 sm:h-12 rounded-lg" />
            {/* Tagline */}
            <Skeleton variant="text" className="w-40 sm:w-[200px] h-4 sm:h-5" />
            {/* Stats */}
            <Skeleton variant="text" className="w-56 sm:w-[280px] h-3 sm:h-4" />
            {/* Search bar */}
            <div className="relative w-full max-w-[500px] mt-0.5 sm:mt-1">
                <div className="bg-bg-card border border-border rounded-full shadow-lg">
                    <div className="flex items-center gap-2.5 sm:gap-3 w-full px-4 sm:px-5 py-3 sm:py-3.5">
                        <Skeleton variant="circle" className="w-5 h-5 sm:w-[22px] sm:h-[22px] flex-shrink-0" />
                        <Skeleton variant="text" className="w-[65%] sm:w-[70%] h-3.5 sm:h-4" />
                    </div>
                </div>
            </div>
            {/* Description */}
            <Skeleton variant="text" className="w-[280px] sm:w-[350px] max-w-full h-3 sm:h-3.5" />
            {/* Quick filter buttons */}
            <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
                <Skeleton variant="rect" className="w-12 sm:w-[60px] h-7 sm:h-8 rounded-full" />
                <Skeleton variant="rect" className="w-16 sm:w-20 h-7 sm:h-8 rounded-full" />
                <Skeleton variant="rect" className="w-20 sm:w-[110px] h-7 sm:h-8 rounded-full" />
                <Skeleton variant="rect" className="w-24 sm:w-[130px] h-7 sm:h-8 rounded-full" />
            </div>
        </section>
    );
}

// ===== Spotlight Section Skeleton - Responsive =====
export function SpotlightSectionSkeleton(): JSX.Element {
    return (
        <section className="flex flex-col gap-2 sm:gap-4">
            <div className="flex justify-between items-center px-1 sm:px-0">
                <Skeleton variant="text" className="w-16 sm:w-20 h-4 sm:h-5" />
            </div>
            <SpotlightGridSkeleton count={4} />
        </section>
    );
}

// ===== Tabs Skeleton (for Just Released/Trending) - Responsive =====
export function TabsSkeleton(): JSX.Element {
    return (
        <div className="flex justify-center mb-1.5 sm:mb-2 py-3 sm:py-4">
            <div className="inline-flex gap-0.5 sm:gap-1 p-0.5 sm:p-1 bg-bg-tertiary rounded-full">
                <Skeleton variant="rect" className="w-24 sm:w-[130px] h-9 sm:h-10 rounded-full" />
                <Skeleton variant="rect" className="w-20 sm:w-[100px] h-9 sm:h-10 rounded-full" />
            </div>
        </div>
    );
}

// ===== Categories/Tasks Section Skeleton - Responsive (CSS-only, SSR-safe) =====
const CATEGORY_SKELETON_WIDTHS = [
    'w-[59px] sm:w-[70px]',
    'w-[77px] sm:w-[90px]',
    'w-[51px] sm:w-[60px]',
    'w-[85px] sm:w-[100px]',
    'w-[68px] sm:w-[80px]',
    'w-[64px] sm:w-[75px]',
] as const;

export function CategoryListSkeleton({ count = 6 }: { count?: number }): JSX.Element {
    return (
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {Array.from({ length: count }).map((_, i) => (
                <Skeleton
                    key={i}
                    variant="rect"
                    className={`h-8 sm:h-9 rounded-full ${CATEGORY_SKELETON_WIDTHS[i % CATEGORY_SKELETON_WIDTHS.length]}`}
                />
            ))}
        </div>
    );
}

// ===== Mobile Bottom Navigation Skeleton =====
export function MobileNavSkeleton(): JSX.Element {
    return (
        <div className="fixed bottom-0 left-0 right-0 bg-bg-card border-t border-border p-2 sm:hidden z-50">
            <div className="flex justify-around items-center">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex flex-col items-center gap-1 p-2">
                        <Skeleton variant="circle" width={24} height={24} />
                        <Skeleton variant="text" width={32} height={8} />
                    </div>
                ))}
            </div>
        </div>
    );
}

// ===== Sidebar Skeleton - Desktop Only =====
export function SidebarSkeleton(): JSX.Element {
    return (
        <div className="hidden sm:flex flex-col gap-1.5 sm:gap-2 p-3 sm:p-4">
            {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2.5 sm:gap-3 p-1.5 sm:p-2">
                    <Skeleton variant="circle" className="w-4 h-4 sm:w-5 sm:h-5" />
                    <Skeleton variant="text" className="w-16 sm:w-20 h-3 sm:h-3.5" />
                </div>
            ))}
        </div>
    );
}

// ===== Tool Detail Page Skeleton - Responsive =====
export function ToolDetailSkeleton(): JSX.Element {
    return (
        <div className="flex flex-col gap-4 sm:gap-6 max-w-4xl mx-auto px-4 sm:px-0">
            {/* Header - Stack on mobile, row on desktop */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center sm:items-start text-center sm:text-left">
                <Skeleton variant="rect" className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex-shrink-0" />
                <div className="flex-1 flex flex-col gap-1.5 sm:gap-2 items-center sm:items-start">
                    <Skeleton variant="text" className="w-32 sm:w-[40%] h-6 sm:h-7" />
                    <Skeleton variant="text" className="w-48 sm:w-[60%] h-3.5 sm:h-4" />
                    <div className="flex gap-2 mt-1.5 sm:mt-2">
                        <Skeleton variant="rect" className="w-20 sm:w-[100px] h-8 sm:h-9 rounded-full" />
                        <Skeleton variant="rect" className="w-16 sm:w-20 h-8 sm:h-9 rounded-full" />
                    </div>
                </div>
            </div>
            {/* Description */}
            <div className="flex flex-col gap-1.5 sm:gap-2">
                <Skeleton variant="text" className="w-full h-3 sm:h-3.5" />
                <Skeleton variant="text" className="w-[95%] h-3 sm:h-3.5" />
                <Skeleton variant="text" className="w-[85%] h-3 sm:h-3.5" />
                <Skeleton variant="text" className="w-[70%] h-3 sm:h-3.5" />
            </div>
            {/* Screenshots - horizontal scroll on mobile */}
            <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                <Skeleton variant="rect" className="w-[200px] sm:w-[280px] h-[130px] sm:h-[180px] flex-shrink-0 rounded-lg" />
                <Skeleton variant="rect" className="w-[200px] sm:w-[280px] h-[130px] sm:h-[180px] flex-shrink-0 rounded-lg" />
                <Skeleton variant="rect" className="w-[200px] sm:w-[280px] h-[130px] sm:h-[180px] flex-shrink-0 rounded-lg" />
            </div>
            {/* Features */}
            <div className="flex flex-col gap-2 sm:gap-3">
                <Skeleton variant="text" className="w-20 sm:w-[100px] h-4 sm:h-5" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} variant="text" className="w-[75%] sm:w-[80%] h-3 sm:h-3.5" />
                    ))}
                </div>
            </div>
        </div>
    );
}

// ===== Search Results Skeleton - Responsive =====
export function SearchPageSkeleton(): JSX.Element {
    return (
        <div className="flex flex-col gap-4 sm:gap-6 px-4 sm:px-0">
            {/* Search header */}
            <div className="flex flex-col gap-2 sm:gap-3">
                <Skeleton variant="text" className="w-40 sm:w-[200px] h-5 sm:h-6" />
                <Skeleton variant="text" className="w-24 sm:w-[120px] h-3 sm:h-3.5" />
            </div>
            {/* Filters - horizontal scroll on mobile */}
            <div className="flex gap-1.5 sm:gap-2 flex-nowrap sm:flex-wrap overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} variant="rect" className="w-16 sm:w-[90px] h-7 sm:h-8 rounded-full flex-shrink-0" />
                ))}
            </div>
            {/* Results grid */}
            <ToolGridSkeleton count={12} />
        </div>
    );
}

// ===== Full Page Skeleton for Homepage - Responsive =====
export function HomepageSkeleton(): JSX.Element {
    return (
        <div className="flex flex-col gap-5 sm:gap-8 py-3 sm:py-4">
            <HeroSkeleton />
            <SpotlightSectionSkeleton />
            <div className="flex flex-col gap-3 sm:gap-4">
                <TabsSkeleton />
                <ToolGridSkeleton count={6} />
            </div>
        </div>
    );
}

// ===== List Item Skeleton (for dashboard lists) - Responsive =====
export function ListItemSkeleton(): JSX.Element {
    return (
        <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-bg-card border border-border rounded-lg">
            <Skeleton variant="rect" className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 rounded-lg" />
            <div className="flex-1 min-w-0 flex flex-col gap-1 sm:gap-1.5">
                <Skeleton variant="text" className="w-[35%] sm:w-[30%] h-3.5 sm:h-4" />
                <Skeleton variant="text" className="w-[55%] sm:w-[50%] h-2.5 sm:h-3" />
            </div>
            <div className="flex gap-1.5 sm:gap-2 flex-shrink-0">
                <Skeleton variant="rect" className="w-7 h-7 sm:w-8 sm:h-8 rounded" />
                <Skeleton variant="rect" className="w-7 h-7 sm:w-8 sm:h-8 rounded" />
            </div>
        </div>
    );
}

export function ListSkeleton({ count = 5 }: { count?: number }): JSX.Element {
    return (
        <div className="flex flex-col gap-1.5 sm:gap-2">
            {Array.from({ length: count }).map((_, i) => (
                <ListItemSkeleton key={i} />
            ))}
        </div>
    );
}

// ===== Table Skeleton (for admin tables) - Responsive (hidden on mobile) =====
export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }): JSX.Element {
    return (
        <div className="overflow-hidden rounded-lg border border-border">
            {/* Header */}
            <div className="hidden sm:flex gap-4 p-3 sm:p-4 bg-bg-tertiary border-b border-border">
                {Array.from({ length: columns }).map((_, i) => (
                    <Skeleton key={i} variant="text" width={`${100 / columns}%`} className="h-3 sm:h-3.5" />
                ))}
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div key={rowIndex} className="flex flex-col sm:flex-row gap-2 sm:gap-4 p-3 sm:p-4 border-b border-border last:border-b-0">
                    {/* Mobile: card-like layout */}
                    <div className="sm:hidden flex flex-col gap-2">
                        <Skeleton variant="text" className="w-32 h-4" />
                        <Skeleton variant="text" className="w-full h-3" />
                        <Skeleton variant="text" className="w-2/3 h-3" />
                    </div>
                    {/* Desktop: table layout */}
                    <div className="hidden sm:contents">
                        {Array.from({ length: columns }).map((_, colIndex) => (
                            <Skeleton key={colIndex} variant="text" width={`${100 / columns}%`} className="h-3" />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

// ===== Dashboard Stats Cards Skeleton - Responsive =====
export function StatsCardsSkeleton({ count = 4 }: { count?: number }): JSX.Element {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex flex-col gap-2 p-3 sm:p-4 bg-bg-card border border-border rounded-lg">
                    <Skeleton variant="text" className="w-16 sm:w-20 h-3 sm:h-3.5" />
                    <Skeleton variant="text" className="w-12 sm:w-16 h-6 sm:h-8" />
                    <Skeleton variant="text" className="w-10 sm:w-12 h-2 sm:h-2.5" />
                </div>
            ))}
        </div>
    );
}
