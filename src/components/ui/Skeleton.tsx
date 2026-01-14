interface SkeletonProps {
    variant?: 'text' | 'card' | 'circle' | 'rect';
    width?: string | number;
    height?: string | number;
    className?: string;
}

export default function Skeleton({ variant = 'text', width, height, className = '' }: SkeletonProps) {
    const style: React.CSSProperties = {};
    if (width) style.width = typeof width === 'number' ? `${width}px` : width;
    if (height) style.height = typeof height === 'number' ? `${height}px` : height;

    const variantClasses = {
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

// Card Skeleton for tool cards
export function ToolCardSkeleton() {
    return (
        <div className="flex flex-col gap-3 p-5 bg-bg-card border border-border rounded-lg">
            <div className="flex gap-3 items-center">
                <Skeleton variant="circle" width={48} height={48} />
                <div className="flex-1 flex flex-col gap-1.5">
                    <Skeleton variant="text" width="60%" height={16} />
                    <Skeleton variant="text" width="40%" height={12} />
                </div>
            </div>
            <Skeleton variant="text" width="100%" height={12} />
            <Skeleton variant="text" width="80%" height={12} />
            <div className="flex justify-between mt-2">
                <Skeleton variant="rect" width={60} height={24} />
                <Skeleton variant="rect" width={40} height={24} />
            </div>
        </div>
    );
}

// Grid of card skeletons
export function ToolGridSkeleton({ count = 8 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: count }).map((_, i) => (
                <ToolCardSkeleton key={i} />
            ))}
        </div>
    );
}
