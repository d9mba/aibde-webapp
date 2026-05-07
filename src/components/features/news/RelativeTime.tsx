'use client';

import { formatRelativeTime, toDateTimeAttr } from '@/lib/news-utils';

interface RelativeTimeProps {
    dateISO: string;
    className?: string;
}

/**
 * Client component that renders a <time> element with a relative timestamp.
 * Re-renders on mount so the time is always relative to the user's local clock.
 */
export function RelativeTime({ dateISO, className }: RelativeTimeProps) {
    return (
        <time dateTime={toDateTimeAttr(dateISO)} className={className}>
            {formatRelativeTime(dateISO)}
        </time>
    );
}
