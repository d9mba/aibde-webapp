import { z } from 'zod';

// Zod schema for tool form validation
export const toolSchema = z.object({
    // Basic Settings
    name: z.string().min(1, "Name is required"),
    slug: z.string().default(''),
    summary: z.string().min(1, "Summary is required"),
    description: z.string().min(1, "Description is required"),
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
    pricing: z.enum(['free', 'freemium', 'paid']).default('free'),
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
        instagram: z.string().optional(),
        facebook: z.string().optional(),
        twitter: z.string().optional(),
        linkedin: z.string().optional(),
        discord: z.string().optional(),
        youtube: z.string().optional(),
        tiktok: z.string().optional(),
        other: z.string().optional(),
    }).default({}),

    // Internal Notes
    internalNotes: z.array(z.object({
        note: z.string(),
        createdAt: z.string(),
    })).default([]),

    // Version History
    versionHistory: z.array(z.object({
        version: z.string(),
        releaseNotes: z.string(),
        releasedAt: z.string(),
    })).default([]),

    // Alternative Tools
    alternativeTools: z.array(z.string()).default([]),
    references: z.array(z.string()).default([]),

    // Publishing
    status: z.enum(['draft', 'pending', 'published', 'unpublished', 'scheduled']).default('draft'),
    scheduledAt: z.string().default(''),
    releasedAt: z.string().default(''),
    spotlightEnabled: z.boolean().default(false),
    spotlightPosition: z.number().default(1),
    spotlightStartDate: z.string().default(''),
    spotlightEndDate: z.string().default(''),

    // Premium - gives dofollow backlinks (SEO value)
    premium: z.boolean().default(false),

    // Stats
    saveCount: z.number().default(0),
});

// Use z.input for form data (allows undefined for defaulted fields)
export type ToolFormData = z.input<typeof toolSchema>;

// Default values for the form
export const defaultToolValues: ToolFormData = {
    name: '',
    slug: '',
    summary: '',
    description: '',
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
    releasedAt: '',
    spotlightEnabled: false,
    spotlightPosition: 1,
    spotlightStartDate: '',
    spotlightEndDate: '',
    premium: false,
    saveCount: 0,
};
