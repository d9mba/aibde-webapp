import { ToolDetailSkeleton } from '@/components/ui/Skeleton';

export default function Loading() {
    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-0 py-6 sm:py-10">
            <ToolDetailSkeleton />
        </div>
    );
}
