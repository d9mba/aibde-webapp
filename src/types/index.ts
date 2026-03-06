// =============================================================================
// Core Types - Shared between frontend and backend
// =============================================================================

/**
 * AI Tool - represents a single AI tool in the directory
 */
export interface AITool {
    id: string;
    name: string;
    appUsername: string;
    summary?: string;
    description: string;
    category: string;  // Comma-separated for backwards compatibility
    categoryName: string[]; // Array of category names
    task: string;  // Comma-separated for backwards compatibility
    taskName: string[];  // Array of task names
    pricing: 'free' | 'freemium' | 'paid' | 'open_source';
    pricingLabel: string;
    websiteUrl: string;
    logoUrl?: string;
    saveCount: number;
    viewCount?: number;
    upvotes?: number;
    downvotes?: number;
    rating?: number | null; // Admin-set rating (0-5 scale)
    launchedOn: string;
    launchedAgo: string;
    isFeatured: boolean;
    listingType?: 'free' | 'fast' | 'verified' | 'featured' | 'spotlight'; // Pricing tier
    spotlightPosition?: number;
    spotlightEnabled?: boolean;
    features?: string[];
    screenshots?: string[];
    videoUrl?: string;
    // Display options
    showScreenshots?: boolean;
    showPricing?: boolean;
    // Contact details (private - admin only)
    contactName?: string;
    contactEmail?: string;
    contactMobile?: string;
    contactCompany?: string;
    contactAddress?: string;
    // Back Links - enables dofollow SEO backlinks
    backLinks?: boolean;
    isReposted?: boolean;
}

/**
 * AdminTool - extends AITool with admin-specific fields
 */
export interface AdminTool extends AITool {
    // Section 1: Basic Settings
    summary?: string; // Mini Summary
    affiliateUrl?: string;
    affiliateEnabled?: boolean;

    // Section 2: Categories & Classification
    categories?: string[]; // Multi-select category slugs
    tasks?: string[]; // Multi-select task slugs
    tags?: string[];

    // Section 3: Pricing
    pricingTiers?: {
        name: string; // e.g., Free, Pro, Enterprise
        price: string; // e.g., $0, $20, Custom
        billingFrequency?: string; // monthly, yearly, one-time
        features?: string[];
        highlighted?: boolean;
    }[];
    hasFreeTrial?: boolean;
    freeTrialDays?: number;
    discount?: string; // Current offers
    billingFrequency?: string; // Top-level billing frequency

    // Section 4: Features & Content
    coreFeatures?: string[];
    useCases?: string[];
    pros?: string[];
    cons?: string[];
    faq?: { question: string; answer: string }[];

    // Section 5: Media Assets
    logoUrl?: string;
    images?: string[];
    videos?: string[];

    // Section 6: Contact Details
    contactName?: string;
    contactEmail?: string;
    contactCompany?: string;
    contactAddress?: string;
    contactMobile?: string;
    socialLinks?: {
        instagram?: string | null;
        facebook?: string | null;
        twitter?: string | null;
        linkedin?: string | null;
        discord?: string | null;
        youtube?: string | null;
        tiktok?: string | null;
        other?: string | null;
    } | null;

    // Company Info
    playStoreUrl?: string;
    appStoreUrl?: string;

    // Section 7: Internal Notes (Multiple with timestamps)
    internalNotes?: { note: string; createdAt: string }[];

    // Section 8: Version History (Multiple)
    versionHistory?: {
        version: string;
        releaseNotes: string;
        launchedOn: string;
    }[];

    // Section 9: Alternative Tools & References
    alternativeTools?: string[]; // Tool slugs
    references?: string[];

    // Section 10: Publishing & Status
    status: 'draft' | 'pending' | 'published' | 'unpublished' | 'scheduled';
    scheduledAt?: string;
    spotlightEnabled?: boolean;
    spotlightPosition?: number;
    spotlightStartDate?: string;
    spotlightEndDate?: string;

    // Back Links - gives dofollow backlinks (SEO value)
    backLinks?: boolean;

    // Trending control
    trendingPosition?: number;

    // Timestamps
    createdAt?: string;
    updatedAt?: string;

    // AI Generated content flag
    isAiGenerated?: boolean;
}



/**
 * Category - represents a tool category
 */
export interface Category {
    id: string;
    categoryName: string;
    count: number;
    description: string;
    icon?: string;
}

/**
 * Task - represents what a tool can accomplish
 */
export interface Task {
    id: string;
    taskName: string;
    count: number;
    description: string;
    icon?: string;
}

/**
 * Tag - represents a hashtag/label for tools
 */
export interface Tag {
    id: string;
    tagName: string;
    count: number;
    description?: string;
}

/**
 * Note - represents an admin note
 */
export interface Note {
    id: string;
    title: string;
    content: string;
    toolId?: string;
    createdAt: string;
    updatedAt: string;
}

/**
 * Settings - application settings
 */
export interface Settings {
    spotlightCount: number;
    itemsPerPage: number;
    enableSpotlight: boolean;
}

// =============================================================================
// API Response Types
// =============================================================================

export interface ApiResponse<T> {
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

// =============================================================================
// Form Types
// =============================================================================

export interface ToolFormData extends Partial<AdminTool> {
    // Any form-specific fields can go here
}

// =============================================================================
// Filter Types
// =============================================================================

export interface ToolFilters {
    query?: string;
    category?: string;
    task?: string;
    pricing?: 'free' | 'freemium' | 'paid' | 'open_source';
    status?: 'draft' | 'published' | 'scheduled';
    isFeatured?: boolean;
}
