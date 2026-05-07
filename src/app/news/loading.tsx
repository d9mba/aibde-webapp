import { NewsCardSkeletonList } from '@/components/features/news';

export default function NewsLoading() {
    return (
        <div className="news-page">
            {/* Hero skeleton */}
            <section className="news-hero">
                <div className="news-hero-inner">
                    <div className="skeleton" style={{ width: 80, height: 24, borderRadius: 9999, margin: '0 auto 12px' }} />
                    <div className="skeleton" style={{ width: 180, height: 36, borderRadius: 8, margin: '0 auto 8px' }} />
                    <div className="skeleton" style={{ width: 400, height: 18, borderRadius: 6, margin: '0 auto', maxWidth: '100%' }} />
                </div>
            </section>

            {/* Search skeleton */}
            <div className="news-search-wrapper">
                <div className="skeleton" style={{ width: '100%', maxWidth: 560, height: 44, borderRadius: 12, margin: '0 auto' }} />
            </div>

            {/* Pills skeleton */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', padding: '16px 0', flexWrap: 'wrap' }}>
                {Array.from({ length: 7 }, (_, i) => (
                    <span key={i} className="skeleton" style={{ width: 70 + i * 8, height: 32, borderRadius: 9999 }} />
                ))}
            </div>

            {/* Cards skeleton */}
            <section className="news-feed" style={{ maxWidth: 720, margin: '0 auto' }}>
                <div className="news-feed-list">
                    <NewsCardSkeletonList count={6} />
                </div>
            </section>
        </div>
    );
}
