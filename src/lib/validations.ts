import { z } from 'zod';

/**
 * Zod validation schemas for API input validation
 * Ensures all API inputs are properly validated before processing
 * 
 * NOTE: HTML sanitization is done client-side via SafeHtml component
 * using DOMPurify. Server-side sanitization removed to avoid Edge conflicts.
 */

// Tool creation/update schema - validates tool data
export const toolSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
    slug: z.string()
        .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with dashes')
        .max(100)
        .optional(),
    summary: z.string().max(500, 'Summary too long').optional().nullable(),
    // HTML sanitization handled client-side via SafeHtml/DOMPurify
    description: z.string()
        .max(10000, 'Description too long')
        .optional()
        .nullable(),
    categoryName: z.array(z.string()).optional().nullable(),
    taskName: z.array(z.string()).optional().nullable(),
    tags: z.array(z.string()).optional().nullable(),
    pricing: z.enum(['free', 'freemium', 'paid']).optional().nullable(),
    pricingLabel: z.string().max(50).optional().nullable(),
    websiteUrl: z.string().url('Invalid website URL').optional().nullable().or(z.literal('')),
    affiliateUrl: z.string().url('Invalid affiliate URL').optional().nullable().or(z.literal('')),
    affiliateEnabled: z.boolean().optional().nullable(),
    logoUrl: z.string().optional().nullable(),
    images: z.array(z.string()).optional().nullable(),
    videos: z.array(z.string()).optional().nullable(),
    saveCount: z.number().int().min(0).optional(),
    releasedAt: z.string().optional().nullable(),
    isFeatured: z.boolean().optional(),
    status: z.enum(['draft', 'pending', 'published', 'unpublished', 'scheduled']).optional(),

    // Features & Content
    coreFeatures: z.array(z.string()).optional().nullable(),
    useCases: z.array(z.string()).optional().nullable(),
    pros: z.array(z.string()).optional().nullable(),
    cons: z.array(z.string()).optional().nullable(),
    faq: z.array(z.object({
        question: z.string(),
        answer: z.string()
    })).optional().nullable(),

    // Pricing Tiers
    pricingTiers: z.array(z.object({
        name: z.string(),
        price: z.string(),
        billingFrequency: z.string().optional(),
        features: z.array(z.string()),
        highlighted: z.boolean().optional()
    })).optional().nullable(),
    hasFreeTrial: z.boolean().optional().nullable(),
    freeTrialDays: z.number().int().min(0).optional().nullable(),
    discount: z.string().optional().nullable(),
    billingFrequency: z.string().optional().nullable(),

    // Version History
    versionHistory: z.array(z.object({
        version: z.string(),
        releaseNotes: z.string(),
        releasedAt: z.string()
    })).optional().nullable(),

    // Alternatives
    alternativeTools: z.array(z.string()).optional().nullable(),
    manualAlternatives: z.array(z.string()).optional().nullable(),

    // Contact Details
    contactName: z.string().max(100).optional().nullable(),
    contactEmail: z.string().email('Invalid email').optional().nullable().or(z.literal('')),
    contactCompany: z.string().max(100).optional().nullable(),
    contactAddress: z.string().max(500).optional().nullable(),
    contactMobile: z.string().max(20).optional().nullable(),
    socialLinks: z.object({
        instagram: z.string().optional().nullable(),
        facebook: z.string().optional().nullable(),
        twitter: z.string().optional().nullable(),
        linkedin: z.string().optional().nullable(),
        discord: z.string().optional().nullable(),
        youtube: z.string().optional().nullable(),
        tiktok: z.string().optional().nullable(),
        other: z.string().optional().nullable()
    }).optional().nullable(),

    // App Store URLs
    playStoreUrl: z.string().url().optional().nullable().or(z.literal('')),
    appStoreUrl: z.string().url().optional().nullable().or(z.literal('')),

    // Spotlight
    spotlightEnabled: z.boolean().optional().nullable(),
    spotlightPosition: z.number().int().optional().nullable(),
    spotlightStartDate: z.string().optional().nullable(),
    spotlightEndDate: z.string().optional().nullable(),

    // Internal
    internalNotes: z.array(z.object({
        note: z.string(),
        createdAt: z.string()
    })).optional().nullable(),

    // Trending
    trendingPosition: z.number().int().min(0).optional().nullable(),
}); // SECURITY: Removed .passthrough() to prevent injection of arbitrary fields

// Partial schema for updates (all fields optional)
export const toolUpdateSchema = toolSchema.partial();

// Category schema
export const categorySchema = z.object({
    categoryName: z.string().min(1, 'Category name is required').max(50, 'Category name too long'),
    description: z.string().max(500).optional().nullable(),
    icon: z.string().optional().nullable(),
    count: z.number().int().min(0).optional(),
});

// Task schema
export const taskSchema = z.object({
    taskName: z.string().min(1, 'Task name is required').max(50, 'Task name too long'),
    description: z.string().max(500).optional().nullable(),
    icon: z.string().optional().nullable(),
    count: z.number().int().min(0).optional(),
});

// Tag schema
export const tagSchema = z.object({
    tagName: z.string().min(1, 'Tag name is required').max(30, 'Tag name too long'),
    count: z.number().int().min(0).optional(),
});

// Note schema
export const noteSchema = z.object({
    title: z.string().min(1, 'Title is required').max(100),
    content: z.string().max(5000).optional(),
    toolId: z.string().optional().nullable(),
    type: z.string().optional(),
});

// Settings schema
export const settingsSchema = z.object({
    spotlightCount: z.number().int().min(0).max(20).optional(),
    showSpotlightOnHome: z.boolean().optional(),
    showCategoriesOnHome: z.boolean().optional(),
    showTasksOnHome: z.boolean().optional(),
    showTop10OnHome: z.boolean().optional(),
    showFeaturedAlternatives: z.boolean().optional(),
});

/**
 * Helper function to validate and return typed result
 */
export function validateInput<T>(
    schema: z.ZodSchema<T>,
    data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
    const result = schema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data };
    }
    return { success: false, error: result.error };
}
