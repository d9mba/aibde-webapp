'use client';

import type { NewsSource } from '@/types/news';

interface SourceFaviconsProps {
    sources: NewsSource[];
    size?: number;
    /** Max favicons to show before "+N more" badge. Default: 3 */
    maxVisible?: number;
}

/**
 * ChatGPT-style source attribution — overlapping favicons.
 * Shows max 3 + "+N more" badge for overflow.
 */
export function SourceFavicons({ sources, size = 20, maxVisible = 3 }: SourceFaviconsProps) {
    if (sources.length === 0) return null;

    const visible = sources.slice(0, maxVisible);
    const overflowCount = sources.length - maxVisible;

    return (
        <div className="news-source-favicons">
            {visible.map((source, i) => (
                <a
                    key={`${source.url}-${i}`}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="news-source-favicon"
                    title={source.name}
                    aria-label={`Source: ${source.name}`}
                >
                    <img
                        src={source.favicon}
                        alt={source.name}
                        width={size}
                        height={size}
                        loading="lazy"
                    />
                </a>
            ))}
            {overflowCount > 0 && (
                <span className="news-source-overflow" title={sources.slice(maxVisible).map(s => s.name).join(', ')}>
                    +{overflowCount}
                </span>
            )}
        </div>
    );
}
