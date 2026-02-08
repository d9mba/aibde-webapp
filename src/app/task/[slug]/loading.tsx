import Skeleton, { ToolGridSkeleton } from '@/components/ui/Skeleton';

export default function Loading() {
    return (
        <div className="max-w-[1200px] mx-auto px-4 py-6 sm:px-6 sm:py-10">
            <div className="flex flex-col gap-6 sm:gap-8">
                <Skeleton variant="text" className="w-40 sm:w-56 h-7 sm:h-8" />
                <Skeleton variant="text" className="w-full max-w-md h-4" />
                <ToolGridSkeleton count={9} />
            </div>
        </div>
    );
}
