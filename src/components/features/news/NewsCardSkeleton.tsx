'use client';

/**
 * Skeleton loader for news cards — shows during initial load and infinite scroll.
 */
export function NewsCardSkeleton() {
    return (
        <div className="news-card news-card--skeleton" aria-hidden="true">
            <div className="news-card-link">
                <div className="news-card-content">
                    {/* Meta row */}
                    <div className="news-card-meta">
                        <span className="skeleton" style={{ width: 60, height: 16, borderRadius: 9999 }} />
                        <span className="skeleton" style={{ width: 50, height: 14, borderRadius: 4 }} />
                        <span className="skeleton" style={{ width: 60, height: 14, borderRadius: 4 }} />
                    </div>

                    {/* Title */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <span className="skeleton" style={{ width: '90%', height: 18, borderRadius: 4 }} />
                        <span className="skeleton" style={{ width: '70%', height: 18, borderRadius: 4 }} />
                    </div>

                    {/* Summary */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
                        <span className="skeleton" style={{ width: '100%', height: 14, borderRadius: 4 }} />
                        <span className="skeleton" style={{ width: '85%', height: 14, borderRadius: 4 }} />
                    </div>

                    {/* Footer */}
                    <div className="news-card-footer" style={{ marginTop: 12 }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                            <span className="skeleton" style={{ width: 18, height: 18, borderRadius: '50%' }} />
                            <span className="skeleton" style={{ width: 18, height: 18, borderRadius: '50%' }} />
                            <span className="skeleton" style={{ width: 18, height: 18, borderRadius: '50%' }} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function NewsCardSkeletonList({ count = 5 }: { count?: number }) {
    return (
        <>
            {Array.from({ length: count }, (_, i) => (
                <NewsCardSkeleton key={i} />
            ))}
        </>
    );
}
