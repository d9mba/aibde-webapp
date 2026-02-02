import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate required environment variables at runtime
if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
        'Missing required Supabase environment variables. ' +
        'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file.'
    );
}

// Client-side Supabase client (uses anon key, respects RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side Supabase Admin client (uses service role key, bypasses RLS)
// Used by API routes for admin operations
// Fallback to anon client if no service role key (will respect RLS)
export const supabaseAdmin = supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    })
    : supabase;

// Database types matching our schema
export interface DbTool {
    id: string;
    name: string;
    app_username: string;  // Maps to 'slug' in frontend
    summary?: string;
    description?: string;
    category_name?: string[];
    task_name?: string[];
    tags?: string[];
    pricing?: 'free' | 'freemium' | 'paid';
    pricing_label?: string;
    website_url?: string;
    affiliate_url?: string;
    affiliate_enabled?: boolean;

    // Media
    logo_url?: string;
    images?: string[];
    videos?: string[];

    // Stats & Display
    save_count: number;
    view_count?: number;
    upvotes?: number;
    downvotes?: number;
    rating?: number; // Admin-set rating (0-5 scale)
    released_on?: string;
    is_featured: boolean;

    // Features & Content
    core_features?: string[];
    use_cases?: string[];
    pros?: string[];
    cons?: string[];
    faq?: { question: string; answer: string }[];

    // Pricing Tiers
    pricing_tiers?: {
        name: string;
        price: string;
        billingFrequency?: string;
        features: string[];
        highlighted?: boolean
    }[];
    has_free_trial?: boolean;
    free_trial_days?: number;
    discount?: string;
    billing_frequency?: string;

    // Version History
    version_history?: {
        version: string;
        releaseNotes: string;
        released_on: string;
    }[];

    // Alternative Tools
    alternative_tools?: string[];
    manual_alternatives?: string[];
    tool_references?: string[];

    // Contact Details
    contact_name?: string;
    contact_email?: string;
    contact_company?: string;
    contact_address?: string;
    contact_mobile?: string;
    social_links?: {
        instagram?: string;
        facebook?: string;
        twitter?: string;
        linkedin?: string;
        discord?: string;
        youtube?: string;
        tiktok?: string;
        other?: string;
    };

    // Company Info
    play_store_url?: string;
    app_store_url?: string;

    // Internal Notes
    internal_notes?: { note: string; createdAt: string }[];

    // Publishing
    status: 'draft' | 'pending' | 'published' | 'unpublished' | 'scheduled';
    scheduled_at?: string;

    // Spotlight
    spotlight_enabled?: boolean;
    spotlight_position?: number;
    spotlight_start_date?: string;
    spotlight_end_date?: string;

    // Back Links - gives dofollow backlinks (SEO value)
    back_links?: boolean;

    // Trending control
    trending_position?: number;

    // Legacy fields for backwards compat (may not exist in all DBs)
    screenshots?: string[];
    video_url?: string;
    show_screenshots?: boolean;
    show_pricing?: boolean;

    // Timestamps
    created_at: string;
    updated_at: string;
}

export interface DbCategory {
    id: string;
    category_name: string;
    description?: string;
    icon?: string;
    count: number;
    created_at: string;
}

export interface DbTask {
    id: string;
    task_name: string;
    description?: string;
    icon?: string;
    count: number;
    created_at: string;
}

export interface DbSettings {
    id: number;
    spotlight_count: number;
    show_spotlight_on_home: boolean;
    show_categories_on_home: boolean;
    show_tasks_on_home: boolean;
    show_top10_on_home?: boolean;
    updated_at: string;
}

// CDN URL for production, fallback to R2 for dev (server-side)
const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || process.env.R2_DEV_URL || '';

// Helper to reconstruct full URL from relative path (server-side only)
function toFullUrl(path: string | undefined | null): string | undefined {
    if (!path) return undefined;
    // Already a full URL, return as-is
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    // Relative path - prepend CDN URL
    if (!CDN_URL) return path;
    return `${CDN_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

// Helper to ensure a value is always an array (handles string, array, or undefined)
function toArray(value: string | string[] | undefined | null): string[] {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    // If it's a string, it might be comma-separated or a single value
    if (typeof value === 'string') {
        return value.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [];
}

// Helper to parse JSON fields that may come as strings from the database
function parseJsonField<T>(value: T | string | undefined | null, defaultValue: T): T {
    if (value === null || value === undefined) return defaultValue;
    if (typeof value === 'string') {
        try {
            return JSON.parse(value) as T;
        } catch {
            return defaultValue;
        }
    }
    return value;
}

// Helper to format relative time (e.g., "Added 10 sec ago", "Updated 2 hr ago")
// Uses "Added" for new items, "Updated" for items modified after creation
function formatRelativeTime(createdAt: string | undefined | null, updatedAt: string | undefined | null): string {
    // Determine if this is a new item or an update
    const isUpdated = createdAt && updatedAt && createdAt !== updatedAt;
    const prefix = isUpdated ? 'Updated' : 'Added';

    // Use the most recent date for display
    const dateStr = isUpdated ? updatedAt : createdAt;

    if (!dateStr) return `${prefix} recently`;

    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    // Handle future dates or invalid dates
    if (diffMs < 0 || isNaN(diffMs)) return `${prefix} recently`;

    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    // Under 1 minute
    if (seconds < 60) {
        return seconds <= 10 ? `${prefix} just now` : `${prefix} ${seconds} sec ago`;
    }

    // Under 1 hour
    if (minutes < 60) {
        return minutes === 1 ? `${prefix} 1 min ago` : `${prefix} ${minutes} min ago`;
    }

    // Under 24 hours
    if (hours < 24) {
        return hours === 1 ? `${prefix} 1 hr ago` : `${prefix} ${hours} hr ago`;
    }

    // Under 7 days
    if (days < 7) {
        return days === 1 ? `${prefix} 1 day ago` : `${prefix} ${days} days ago`;
    }

    // Under 30 days
    if (days < 30) {
        return weeks === 1 ? `${prefix} 1 week ago` : `${prefix} ${weeks} weeks ago`;
    }

    // Under 365 days
    if (days < 365) {
        return months === 1 ? `${prefix} 1 month ago` : `${prefix} ${months} months ago`;
    }

    // Over a year
    return years === 1 ? `${prefix} 1 year ago` : `${prefix} ${years} years ago`;
}

// Helper to convert snake_case DB fields to camelCase for frontend
export function dbToolToAdminTool(dbTool: DbTool) {
    return {
        id: dbTool.id,
        name: dbTool.name,
        app_username: dbTool.app_username,
        summary: dbTool.summary,
        description: dbTool.description || '',
        // Ensure these are arrays even if DB stores as string
        category: toArray(dbTool.category_name).join(','),
        categoryName: toArray(dbTool.category_name),
        task: toArray(dbTool.task_name).join(','),
        taskName: toArray(dbTool.task_name),
        tags: toArray(dbTool.tags),
        pricing: dbTool.pricing || 'freemium',
        pricingLabel: dbTool.pricing_label || '',
        websiteUrl: dbTool.website_url || '',
        affiliateUrl: dbTool.affiliate_url,
        affiliateEnabled: dbTool.affiliate_enabled,

        // Media - reconstruct full URLs from relative paths
        logoUrl: toFullUrl(dbTool.logo_url),
        images: (dbTool.images || dbTool.screenshots)?.map(img => toFullUrl(img)).filter((x): x is string => Boolean(x)) || [],
        videos: dbTool.videos,
        screenshots: dbTool.screenshots?.map(s => toFullUrl(s)).filter((x): x is string => Boolean(x)) || [],
        videoUrl: dbTool.video_url,

        // Stats
        saveCount: dbTool.save_count,
        viewCount: dbTool.view_count || 0,
        upvotes: dbTool.upvotes || 0,
        downvotes: dbTool.downvotes || 0,
        rating: dbTool.rating,
        released_on: (dbTool.released_on || '').split('T')[0].split(' ')[0],
        releasedAgo: formatRelativeTime(dbTool.released_on || dbTool.created_at, dbTool.updated_at),
        isFeatured: dbTool.is_featured,

        // Features & Content
        coreFeatures: dbTool.core_features,
        useCases: dbTool.use_cases,
        pros: dbTool.pros,
        cons: dbTool.cons,
        faq: parseJsonField(dbTool.faq, []),

        // Pricing
        pricingTiers: parseJsonField(dbTool.pricing_tiers, []),
        hasFreeTrial: dbTool.has_free_trial,
        freeTrialDays: dbTool.free_trial_days,
        discount: dbTool.discount,
        billingFrequency: dbTool.billing_frequency,

        // Version & Alternatives
        versionHistory: parseJsonField(dbTool.version_history, []),
        alternativeTools: dbTool.alternative_tools,
        manualAlternatives: dbTool.manual_alternatives,
        references: dbTool.tool_references,

        // Contact
        contactName: dbTool.contact_name,
        contactEmail: dbTool.contact_email,
        contactCompany: dbTool.contact_company,
        contactAddress: dbTool.contact_address,
        contactMobile: dbTool.contact_mobile,
        socialLinks: parseJsonField(dbTool.social_links, {}),

        // Company Info
        playStoreUrl: dbTool.play_store_url,
        appStoreUrl: dbTool.app_store_url,

        // Internal
        internalNotes: parseJsonField(dbTool.internal_notes, []),

        // Publishing
        status: dbTool.status,
        scheduledAt: dbTool.scheduled_at,
        spotlightEnabled: dbTool.spotlight_enabled,
        spotlightPosition: dbTool.spotlight_position,
        spotlightStartDate: dbTool.spotlight_start_date,
        spotlightEndDate: dbTool.spotlight_end_date,
        backLinks: dbTool.back_links,
        trendingPosition: dbTool.trending_position,

        // Display
        showScreenshots: dbTool.show_screenshots,
        showPricing: dbTool.show_pricing,

        // Timestamps
        createdAt: dbTool.created_at,
        updatedAt: dbTool.updated_at,
    };
}

// Helper to convert camelCase frontend fields to snake_case for DB
export function adminToolToDbTool(tool: Record<string, unknown>): Partial<DbTool> {
    const result: Record<string, unknown> = {};

    const mapping: Record<string, string> = {
        // Basic - app_username stays the same
        categoryName: 'category_name',
        taskName: 'task_name',
        pricingLabel: 'pricing_label',
        websiteUrl: 'website_url',
        affiliateUrl: 'affiliate_url',
        affiliateEnabled: 'affiliate_enabled',

        // Media
        logoUrl: 'logo_url',

        // Stats
        saveCount: 'save_count',
        viewCount: 'view_count',
        upvotes: 'upvotes',
        downvotes: 'downvotes',


        released_on: 'released_on',
        isFeatured: 'is_featured',


        // Features
        coreFeatures: 'core_features',
        useCases: 'use_cases',

        // Pricing
        pricingTiers: 'pricing_tiers',
        hasFreeTrial: 'has_free_trial',
        freeTrialDays: 'free_trial_days',
        billingFrequency: 'billing_frequency',

        // Version & Alternatives
        versionHistory: 'version_history',
        alternativeTools: 'alternative_tools',
        manualAlternatives: 'manual_alternatives',
        references: 'tool_references',

        // Contact
        contactName: 'contact_name',
        contactEmail: 'contact_email',
        contactCompany: 'contact_company',
        contactAddress: 'contact_address',
        contactMobile: 'contact_mobile',
        socialLinks: 'social_links',

        // Internal
        internalNotes: 'internal_notes',

        // SEO
        scheduledAt: 'scheduled_at',
        metaTitle: 'meta_title',
        metaDescription: 'meta_description',
        canonicalUrl: 'canonical_url',
        videoUrl: 'video_url',

        // Spotlight
        spotlightEnabled: 'spotlight_enabled',
        spotlightPosition: 'spotlight_position',
        spotlightStartDate: 'spotlight_start_date',
        spotlightEndDate: 'spotlight_end_date',

        // Back Links
        backLinks: 'back_links',

        // Trending
        trendingPosition: 'trending_position',

        // Display
        showScreenshots: 'show_screenshots',
        showPricing: 'show_pricing',

        // Company Info
        playStoreUrl: 'play_store_url',
        appStoreUrl: 'app_store_url',

        // Timestamps
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    };

    // Fields that should be null instead of empty string for PostgreSQL timestamps
    const timestampFields = ['scheduled_at', 'spotlight_start_date', 'spotlight_end_date', 'released_on'];

    // Helper to extract relative path from full URL (converts CDN URLs to relative paths for storage)
    const extractRelativePath = (url: string | undefined | null): string | null => {
        if (!url) return null;
        // Already a relative path starting with /, return as is
        if (url.startsWith('/') && !url.startsWith('//')) return url;
        // Strip CDN URL if present
        if (CDN_URL && url.startsWith(CDN_URL)) {
            return url.substring(CDN_URL.length);
        }
        // Try to extract pathname from full URL
        try {
            const urlObj = new URL(url);
            return urlObj.pathname;
        } catch {
            return url;
        }
    };

    for (const [key, value] of Object.entries(tool)) {
        if (key === 'releasedAgo') continue; // Skip computed field
        if (key === 'references') continue; // Skip - doesn't exist in DB

        const dbKey = mapping[key] || key;

        // Handle date/timestamp fields
        if (timestampFields.includes(dbKey)) {
            // Convert empty strings to null
            if (value === '' || value === null || value === undefined) {
                result[dbKey] = null;
                continue;
            }
            // Normalize date format: convert DD-MM-YYYY to YYYY-MM-DD
            if (typeof value === 'string') {
                let normalizedDate = value;

                // Check for DD-MM-YYYY format (e.g., "29-10-2025")
                const ddmmyyyyMatch = value.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
                if (ddmmyyyyMatch) {
                    const [, day, month, year] = ddmmyyyyMatch;
                    normalizedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                }

                // Check for year-only format (e.g., "2025")
                const yearOnlyMatch = value.match(/^\d{4}$/);
                if (yearOnlyMatch) {
                    normalizedDate = `${value}-01-01`;
                }

                result[dbKey] = normalizedDate;
                continue;
            }
        }

        // Extract relative path for logo_url
        if (dbKey === 'logo_url' && typeof value === 'string') {
            result[dbKey] = extractRelativePath(value);
            continue;
        }

        // Extract relative paths for images array
        if (dbKey === 'images' && Array.isArray(value)) {
            result[dbKey] = value.map(img => extractRelativePath(img)).filter(Boolean);
            continue;
        }

        result[dbKey] = value;
    }

    return result as Partial<DbTool>;
}
