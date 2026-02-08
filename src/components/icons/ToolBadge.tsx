import { VerifiedBadge, FeaturedBadge } from '@/components/icons';

interface ToolBadgeProps {
    listingType?: string;
    spotlightEnabled?: boolean;
    isFeatured?: boolean;
    size?: number;
}

/**
 * Renders the appropriate badge (verified or featured) based on tool properties.
 * Returns null if no badge should be shown.
 */
export function ToolBadge({ listingType, spotlightEnabled, isFeatured, size = 12 }: ToolBadgeProps) {
    // Verified badge takes priority
    if (listingType === 'verified') {
        return <VerifiedBadge size={size} />;
    }

    // Featured/Spotlight badge
    if (listingType === 'featured' || listingType === 'spotlight' || spotlightEnabled || isFeatured) {
        return <FeaturedBadge size={size} />;
    }

    return null;
}

export default ToolBadge;
