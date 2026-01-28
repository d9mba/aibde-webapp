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

export function getExtendedInfo(tool: AdminTool): ExtendedInfo {
    return {
        longDescription: tool.description || '',
        pros: tool.pros || [],
        cons: tool.cons || [],
        faq: tool.faq || [],
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
            case 'faq': return extendedInfo.faq.length > 0;
            case 'alternatives': return hasAlternatives;
            default: return true;
        }
    });
}
