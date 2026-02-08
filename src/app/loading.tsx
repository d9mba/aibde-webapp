import { HomepageSkeleton } from '@/components/ui/Skeleton';

export default function Loading() {
    return (
        <div className="max-w-[1200px] mx-auto px-4 py-6 sm:px-6 sm:py-10 flex flex-col gap-10 sm:gap-12">
            <HomepageSkeleton />
        </div>
    );
}
