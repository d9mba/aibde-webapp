import Skeleton, { CategoryListSkeleton } from '@/components/ui/Skeleton';

export default function Loading() {
    return (
        <div className="max-w-[1200px] mx-auto px-4 py-6 sm:px-6 sm:py-10">
            <div className="flex flex-col gap-6 sm:gap-8">
                <Skeleton variant="text" className="w-48 sm:w-64 h-8 sm:h-9" />
                <CategoryListSkeleton count={12} />
            </div>
        </div>
    );
}
