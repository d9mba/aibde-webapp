'use client';

/**
 * Utility functions for consistent formatting across the app.
 * Replaces nested ternaries with clear switch statements.
 */

// ============================================
// Pricing Utilities
// ============================================

export type PricingType = 'free' | 'freemium' | 'paid' | string;

export function getPricingLabel(pricing: PricingType): string {
    switch (pricing) {
        case 'free': return 'Free';
        case 'freemium': return 'Freemium';
        case 'paid': return 'Paid';
        default: return '';
    }
}

export function getPricingColor(pricing: PricingType): string {
    switch (pricing) {
        case 'free': return '#059669';
        case 'freemium': return '#d97706';
        case 'paid': return '#2563eb';
        default: return '#737373';
    }
}

export function getPricingClass(pricing: PricingType): string {
    switch (pricing) {
        case 'free': return 'bg-accent-green/10 text-accent-green';
        case 'freemium': return 'bg-accent-purple/10 text-accent-purple';
        case 'paid': return 'bg-accent-yellow/10 text-accent-yellow';
        default: return 'bg-bg-tertiary text-text-tertiary';
    }
}

// ============================================
// Status Badge Utilities
// ============================================

export type StatusType = 'published' | 'draft' | 'pending' | 'rejected' | 'unpublished' | 'scheduled' | string;

export function getStatusClass(status: StatusType): string {
    switch (status) {
        case 'published': return 'bg-green-500/10 text-green-500';
        case 'draft': return 'bg-yellow-500/10 text-yellow-500';
        case 'pending': return 'bg-blue-500/10 text-blue-500';
        case 'rejected': return 'bg-red-500/10 text-red-500';
        case 'unpublished': return 'bg-gray-500/10 text-gray-500';
        case 'scheduled': return 'bg-cyan-500/10 text-cyan-500';
        default: return 'bg-gray-500/10 text-gray-500';
    }
}

export function getStatusLabel(status: StatusType): string {
    switch (status) {
        case 'published': return 'Published';
        case 'draft': return 'Draft';
        case 'pending': return 'Pending';
        case 'rejected': return 'Rejected';
        case 'unpublished': return 'Unpublished';
        case 'scheduled': return 'Scheduled';
        default: return status;
    }
}

// ============================================
// Time Range Utilities
// ============================================

export type TimeRangeType = 'today' | 'week' | 'month' | string;

export function getTimeRangeLabel(range: TimeRangeType): string {
    switch (range) {
        case 'today': return 'Today';
        case 'week': return 'Last 7 Days';
        case 'month': return 'Last 30 Days';
        default: return range;
    }
}

// ============================================
// Theme Utilities
// ============================================

export type ThemeMode = 'dark' | 'light' | 'system';

export function getNextThemeMode(current: ThemeMode): ThemeMode {
    switch (current) {
        case 'dark': return 'light';
        case 'light': return 'system';
        case 'system': return 'dark';
        default: return 'system';
    }
}

// ============================================
// Media Source Utilities
// ============================================

export function getMediaSourceLabel(url: string, cdnUrl?: string): string {
    if (cdnUrl && url.includes(cdnUrl)) return 'Cloud';
    if (url.startsWith('http://') || url.startsWith('https://')) return 'External';
    return 'Local';
}

export function getMediaSourceColor(url: string, cdnUrl?: string): string {
    if (cdnUrl && url.includes(cdnUrl)) return 'bg-accent-primary';
    if (url.startsWith('http://') || url.startsWith('https://')) return 'bg-amber-500';
    return 'bg-gray-500';
}
