/**
 * News utility functions: read-time calculation and relative timestamp formatting.
 */

// =============================================================================
// Read Time
// =============================================================================

const WORDS_PER_MINUTE = 200;

/** Calculate read time from raw text or HTML content */
export function calculateReadTime(content: string): number {
    const text = content.replace(/<[^>]*>/g, '').trim();
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE));
}

/** Format read time for display */
export function formatReadTime(minutes: number): string {
    return `${minutes} min read`;
}

// =============================================================================
// Relative Timestamp
// =============================================================================

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Format a UTC ISO string into a user-friendly relative timestamp.
 * Uses Intl.RelativeTimeFormat + Intl.DateTimeFormat for localization.
 *
 * Examples:
 * - "5 mins ago"
 * - "2 hours ago"
 * - "Yesterday at 8:42 PM"
 * - "May 4, 2026"
 */
export function formatRelativeTime(utcIso: string): string {
    const date = new Date(utcIso);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    // Future dates — just show the full date
    if (diff < 0) {
        return formatFullDate(date);
    }

    // < 1 minute
    if (diff < MINUTE) {
        return 'Just now';
    }

    // < 1 hour
    if (diff < HOUR) {
        const mins = Math.floor(diff / MINUTE);
        return `${mins} min${mins === 1 ? '' : 's'} ago`;
    }

    // < 24 hours
    if (diff < DAY) {
        const hours = Math.floor(diff / HOUR);
        return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    }

    // Yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
        const time = new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        }).format(date);
        return `Yesterday at ${time}`;
    }

    // < 7 days
    if (diff < 7 * DAY) {
        const days = Math.floor(diff / DAY);
        return `${days} day${days === 1 ? '' : 's'} ago`;
    }

    // Older — full date
    return formatFullDate(date);
}

function formatFullDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(date);
}

/**
 * Format ISO date for <time> element's datetime attribute.
 * Returns ISO string as-is (already valid).
 */
export function toDateTimeAttr(utcIso: string): string {
    return new Date(utcIso).toISOString();
}
