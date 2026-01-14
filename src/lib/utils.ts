import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind CSS classes with proper conflict resolution
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Get a consistent brand color class based on a name
 * Used for avatar fallbacks when no logo is provided
 */
export function getBrandColorClass(name: string): string {
    const colors = [
        'bg-pink-500',
        'bg-green-500',
        'bg-blue-500',
        'bg-orange-500',
        'bg-purple-500',
        'bg-red-500',
        'bg-cyan-500',
        'bg-yellow-500',
        'bg-teal-500',
        'bg-indigo-500',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
}

/**
 * Format a date to relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(date: string | Date): string {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
}

/**
 * Get CDN URL for assets
 */
const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || '';

export function getFullUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${CDN_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}
