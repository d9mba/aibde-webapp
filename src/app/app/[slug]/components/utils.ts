// Shared utilities and types for tool detail page
import { AdminTool } from '@/types';
// Re-export getFullUrl from canonical source
export { getFullUrl } from '@/lib/url';

export const logoColors = [
    '#ec4899', '#22c55e', '#3b82f6', '#f97316', '#8b5cf6',
    '#ef4444', '#06b6d4', '#eab308', '#14b8a6', '#6366f1',
];

export function ensureProtocol(url: string): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `https://${url}`;
}

export function fixHtmlUrls(html: string): string {
    if (!html) return '';
    return html.replace(/href="([^"]+)"/g, (match, url) => {
        if (url.startsWith('http://') || url.startsWith('https://') ||
            url.startsWith('mailto:') || url.startsWith('tel:') || url.startsWith('#')) {
            return match;
        }
        return `href="https://${url}"`;
    });
}

export function getYouTubeId(url: string): string | null {
    if (!url) return null;
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /youtube\.com\/v\/([^&\n?#]+)/,
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

export function getLogoColor(name: string): string {
    const colorIndex = name.charCodeAt(0) % logoColors.length;
    return logoColors[colorIndex];
}

export type Section = { id: string; label: string };

export const allSections: Section[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'media', label: 'Media' },
    { id: 'features', label: 'Features' },
    { id: 'use-cases', label: 'Uses' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'pros-cons', label: 'Pros & Cons' },
    { id: 'faq', label: 'FAQ' },
    { id: 'alternatives', label: 'Alternatives' },
];

export interface ExtendedInfo {
    longDescription: string;
    pros: string[];
    cons: string[];
    faq: { question: string; answer: string }[];
    pricingPlans: { name: string; price: string; features?: string[]; highlighted?: boolean }[];
    coreFeatures: string[];
    useCases: string[];
}

function generateFallbackFAQ(tool: AdminTool): ExtendedInfo['faq'] {
    const name = tool.name || 'this tool';
    const category = (tool.categoryName || [])[0] || 'AI';
    const pricing = tool.pricing || '';

    const faqs: ExtendedInfo['faq'] = [
        {
            question: `What is ${name}?`,
            answer: tool.summary || `${name} is an AI-powered tool in the ${category} category designed to help users be more productive and efficient.`,
        },
        {
            question: `How do I get started with ${name}?`,
            answer: `You can get started by visiting the official ${name} website using the "Try Now" button above. Most AI tools offer a quick onboarding process to help you start using the product right away.`,
        },
    ];

    if (pricing === 'free' || pricing === 'freemium' || pricing === 'open_source') {
        faqs.push({
            question: `Is ${name} free to use?`,
            answer: pricing === 'free'
                ? `Yes, ${name} is completely free to use.`
                : pricing === 'open_source'
                    ? `Yes, ${name} is open source and free to use. You can also contribute to its development.`
                    : `${name} offers a free tier with basic features. Premium plans are available for advanced functionality.`,
        });
    } else if (pricing === 'paid' || pricing === 'free_trial') {
        faqs.push({
            question: `Does ${name} offer a free trial?`,
            answer: pricing === 'free_trial'
                ? `Yes, ${name} offers a free trial so you can explore its features before committing to a paid plan.`
                : `${name} is a paid tool. Visit the official website to view current pricing and plan options.`,
        });
    }

    faqs.push({
        question: `What are the main features of ${name}?`,
        answer: tool.coreFeatures && tool.coreFeatures.length > 0
            ? `Key features of ${name} include: ${tool.coreFeatures.slice(0, 4).join(', ')}.`
            : `${name} offers a range of ${category}-focused capabilities. Visit the Features section above or the official website for a detailed breakdown.`,
    });

    faqs.push({
        question: `Who is ${name} best suited for?`,
        answer: tool.useCases && tool.useCases.length > 0
            ? `${name} is ideal for users looking to ${tool.useCases.slice(0, 3).join(', ').toLowerCase()}.`
            : `${name} is designed for professionals, teams, and individuals who work with ${category.toLowerCase()} tools and want to boost their productivity.`,
    });

    return faqs;
}

export function getExtendedInfo(tool: AdminTool): ExtendedInfo {
    const customFaq = tool.faq || [];
    return {
        longDescription: tool.description || '',
        pros: tool.pros || [],
        cons: tool.cons || [],
        faq: customFaq.length > 0 ? customFaq : generateFallbackFAQ(tool),
        pricingPlans: (tool.pricingTiers || []) as ExtendedInfo['pricingPlans'],
        coreFeatures: tool.coreFeatures || [],
        useCases: tool.useCases || [],
    };
}

export function getSections(tool: AdminTool, extendedInfo: ExtendedInfo, hasAlternatives: boolean): Section[] {
    const hasMedia = (tool?.images?.length || 0) > 0 || (tool?.videos?.length || 0) > 0;
    return allSections.filter(section => {
        switch (section.id) {
            case 'overview': return true;
            case 'media': return hasMedia;
            case 'features': return extendedInfo.coreFeatures.length > 0;
            case 'use-cases': return extendedInfo.useCases.length > 0;
            case 'pricing': return extendedInfo.pricingPlans.length > 0;
            case 'pros-cons': return extendedInfo.pros.length > 0 || extendedInfo.cons.length > 0;
            case 'faq': return true; // Always show — fallback FAQs are generated if none exist
            case 'alternatives': return hasAlternatives;
            default: return true;
        }
    });
}
