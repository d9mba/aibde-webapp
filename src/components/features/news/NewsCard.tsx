'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { NewsArticle } from '@/types/news';
import { NEWS_CATEGORIES } from '@/types/news';
import { formatReadTime } from '@/lib/news-utils';
import { SourceFavicons } from './SourceFavicons';
import { RelativeTime } from './RelativeTime';
import { Share2 } from 'lucide-react';
import ShareModal from '@/components/ui/ShareModal';

interface NewsCardProps {
    article: NewsArticle;
}

/**
 * Compact news card for the feed.
 * Uses div wrapper with onClick to avoid nested <a> hydration errors.
 * Share opens the site-wide ShareModal (same as tool pages).
 */
export function NewsCard({ article }: NewsCardProps) {
    const [shareOpen, setShareOpen] = useState(false);
    const categoryMeta = NEWS_CATEGORIES.find(c => c.value === article.category);

    function handleCardClick(e: React.MouseEvent) {
        const target = e.target as HTMLElement;
        if (target.closest('a') || target.closest('button')) return;
        window.location.href = `/news/${article.slug}`;
    }

    return (
        <>
            <article
                className="news-card"
                id={`news-card-${article.id}`}
                onClick={handleCardClick}
                role="link"
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter') handleCardClick(e as unknown as React.MouseEvent); }}
            >
                <div className="news-card-link">
                    <div className="news-card-content">
                        {/* Category + Clock + Time + Read time */}
                        <div className="news-card-meta">
                            <span className="news-card-category">
                                {categoryMeta?.icon} {categoryMeta?.label || article.category}
                            </span>
                            <span className="news-card-dot">·</span>
                            <span className="news-card-time-row">
                                <svg className="news-card-clock" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <RelativeTime dateISO={article.publishedAt} className="news-card-time" />
                            </span>
                            <span className="news-card-dot">·</span>
                            <span className="news-card-readtime">{formatReadTime(article.readTimeMinutes)}</span>
                        </div>

                        {/* Title */}
                        <h2 className="news-card-title">
                            <Link href={`/news/${article.slug}`} className="news-card-title-link">
                                {article.title}
                            </Link>
                        </h2>

                        {/* Summary */}
                        <p className="news-card-summary">{article.summary}</p>

                        {/* Bottom row: sources + share */}
                        <div className="news-card-footer">
                            <SourceFavicons sources={article.sources} size={18} />

                            <div className="news-card-actions">
                                {/* Save — commented out for now */}
                                {/* <button className="news-card-action-btn" aria-label="Save" title="Save">
                                    <Bookmark size={15} />
                                </button> */}
                                <button
                                    className="news-card-action-btn"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShareOpen(true); }}
                                    aria-label="Share article"
                                    title="Share"
                                >
                                    <Share2 size={15} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {article.thumbnail && (
                        <div className="news-card-thumbnail">
                            <img src={article.thumbnail} alt="" loading="lazy" />
                        </div>
                    )}
                </div>
            </article>

            {/* Site-wide ShareModal — same as tool pages */}
            <ShareModal
                isOpen={shareOpen}
                onClose={() => setShareOpen(false)}
                url={typeof window !== 'undefined' ? `${window.location.origin}/news/${article.slug}` : `/news/${article.slug}`}
                title={article.title}
                description={article.summary}
            />
        </>
    );
}
