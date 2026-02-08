import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
    return twMerge(clsx(inputs));
}

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

/** URL-safe slug from category/task names. Must match sitemap and [slug] resolution. */
export function slugify(str: string): string {
    return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export function escapeLike(value: string): string {
    return value
        .replace(/\\/g, '\\\\')
        .replace(/%/g, '\\%')
        .replace(/_/g, '\\_');
}

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || '';

export function getFullUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const prefix = path.startsWith('/') ? '' : '/';
    return `${CDN_URL}${prefix}${path}`;
}
