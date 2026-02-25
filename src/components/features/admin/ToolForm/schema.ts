import { z } from 'zod';

// Zod schema for tool form validation
export const toolSchema = z.object({
    // Basic Settings
    name: z.string().min(1, "Name is required"),
    app_username: z.string().default(''),
    summary: z.string().min(1, "Summary is required"),
    description: z.string().default(''),
    isAiGenerated: z.boolean().default(false),
    logoUrl: z.string().default(''),
    websiteUrl: z.string().default(''),
    affiliateUrl: z.string().default(''),

    // Company Info
    playStoreUrl: z.string().optional().default(''),
    appStoreUrl: z.string().optional().default(''),
    affiliateEnabled: z.boolean().default(false),

    // Categories & Classification
    categoryName: z.array(z.string()).default([]),
    taskName: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),

    // Pricing
    pricing: z.enum(['free', 'freemium', 'paid', 'open_source']).default('free'),
    pricingLabel: z.string().default(''),
    billingFrequency: z.string().default('monthly'),
    discount: z.string().default(''),
    hasFreeTrial: z.boolean().default(false),
    freeTrialDays: z.number().default(14),
    pricingTiers: z.array(z.object({
        name: z.string(),
        price: z.string(),
        billingFrequency: z.string().optional(),
        features: z.array(z.string()).default([]),
        highlighted: z.boolean().default(false),
    })).default([]),

    // Features & Content
    coreFeatures: z.array(z.string()).default([]),
    useCases: z.array(z.string()).default([]),
    pros: z.array(z.string()).default([]),
    cons: z.array(z.string()).default([]),
    faq: z.array(z.object({
        question: z.string(),
        answer: z.string(),
    })).default([]),

    // Media
    images: z.array(z.string()).default([]),
    videos: z.array(z.string()).default([]),

    // Contact
    contactName: z.string().default(''),
    contactEmail: z.string().default(''),
    contactCompany: z.string().default(''),
    contactAddress: z.string().default(''),
    contactMobile: z.string().default(''),
    socialLinks: z.object({
        instagram: z.string().optional().nullable(),
        facebook: z.string().optional().nullable(),
        twitter: z.string().optional().nullable(),
        linkedin: z.string().optional().nullable(),
        discord: z.string().optional().nullable(),
        youtube: z.string().optional().nullable(),
        tiktok: z.string().optional().nullable(),
        other: z.string().optional().nullable(),
    }).nullable().optional().default({}),

    // Internal Notes
    internalNotes: z.array(z.object({
        note: z.string(),
        createdAt: z.string(),
    })).default([]),

    // Version History
    versionHistory: z.array(z.object({
        version: z.string(),
        releaseNotes: z.string(),
        launchedOn: z.string(),
    })).default([]),

    // Alternative Tools
    alternativeTools: z.array(z.string()).default([]),
    references: z.array(z.string()).default([]),

    // Publishing
    status: z.enum(['draft', 'pending', 'published', 'unpublished', 'scheduled']).default('draft'),
    scheduledAt: z.string().default(''),
    launchedOn: z.string().default(''),
    spotlightEnabled: z.boolean().default(false),
    spotlightPosition: z.number().default(1),
    spotlightStartDate: z.string().default(''),
    spotlightEndDate: z.string().default(''),
    listingType: z.enum(['free', 'fast', 'verified', 'featured', 'spotlight']).default('free'),

    // Back Links - gives dofollow backlinks (SEO value)
    backLinks: z.boolean().default(false),

    // Stats
    saveCount: z.number().default(0),

    // Rating (0-5 scale, e.g., 4.5)
    rating: z.number().min(0).max(5).optional().nullable(),
}).refine(
    (data) => !data.spotlightEnabled || data.listingType === 'spotlight',
    { message: 'Spotlight must be enabled only when listing type is "spotlight"', path: ['spotlightEnabled'] },
);

// Use z.input for form data (allows undefined for defaulted fields)
export type ToolFormData = z.input<typeof toolSchema>;

// Default values for the form
export const defaultToolValues: ToolFormData = {
    name: '',
    app_username: '',
    summary: '',
    description: '',
    isAiGenerated: false,
    logoUrl: '',
    websiteUrl: '',
    affiliateUrl: '',
    affiliateEnabled: false,
    playStoreUrl: '',
    appStoreUrl: '',
    categoryName: [],
    taskName: [],
    tags: [],
    pricing: 'free',
    pricingLabel: '',
    billingFrequency: 'monthly',
    discount: '',
    hasFreeTrial: false,
    freeTrialDays: 14,
    pricingTiers: [],
    coreFeatures: [],
    useCases: [],
    pros: [],
    cons: [],
    faq: [],
    images: [],
    videos: [],
    contactName: '',
    contactEmail: '',
    contactCompany: '',
    contactAddress: '',
    contactMobile: '',
    socialLinks: {},
    internalNotes: [],
    versionHistory: [],
    alternativeTools: [],
    references: [],
    status: 'draft',
    scheduledAt: '',
    launchedOn: '',
    spotlightEnabled: false,
    spotlightPosition: 1,
    spotlightStartDate: '',
    spotlightEndDate: '',
    listingType: 'free',
    backLinks: false,
    saveCount: 0,
    rating: undefined,
};
