'use client';

import { useState } from 'react';
import { Share2 } from 'lucide-react';
import ShareModal from '@/components/ui/ShareModal';

interface ArticleShareButtonProps {
    url: string;
    title: string;
    summary: string;
}

/** Article page share section — opens the site-wide ShareModal (same as tool pages) */
export function ArticleShareButton({ url, title, summary }: ArticleShareButtonProps) {
    const [shareOpen, setShareOpen] = useState(false);

    return (
        <>
            <div className="news-article-share">
                <button
                    className="news-article-share-btn"
                    onClick={() => setShareOpen(true)}
                    aria-label="Share article"
                >
                    <Share2 size={16} />
                    Share this article
                </button>
            </div>

            <ShareModal
                isOpen={shareOpen}
                onClose={() => setShareOpen(false)}
                url={url}
                title={title}
                description={summary}
            />
        </>
    );
}
