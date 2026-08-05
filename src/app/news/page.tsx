import type { Metadata } from 'next';
import { SEO, getBreadcrumbJsonLd, safeJsonLdStringify } from '@/lib/seo';
import { getNewsArticles } from '@/lib/news-db';
import { NewsFeedClient } from '@/components/features/news';

export const metadata: Metadata = {
    title: 'AI News — Latest AI Launches, Model Updates & Industry Breakthroughs',
    description: 'Stay updated with the latest AI news: model releases, startup launches, funding rounds, open-source breakthroughs, and industry trends. Updated in real-time.',
    keywords: ['AI news', 'AI updates', 'AI launches', 'AI models', 'AI funding', 'AI startups', 'AI industry news'],
    openGraph: {
        title: 'AI News — Latest AI Launches & Breakthroughs | BrowseForAI',
        description: 'Stay updated with the latest AI news: model releases, startup launches, funding rounds, and more.',
        url: `${SEO.siteUrl}/news`,
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'AI News — Latest AI Launches & Breakthroughs | BrowseForAI',
        description: 'Stay updated with the latest AI news: model releases, startup launches, funding rounds, and more.',
    },
    alternates: {
        canonical: `${SEO.siteUrl}/news`,
    },
};

/**
 * Server component that fetches news from the API.
 * Currently uses internal imports; will switch to fetch('/api/news') when DB is ready.
 */
export default async function NewsPage() {
    // Server-side: fetch from Supabase with fallback
    const articles = await getNewsArticles();

    const breadcrumbs = [
        { name: 'Home', url: SEO.siteUrl },
        { name: 'News', url: `${SEO.siteUrl}/news` },
    ];

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(getBreadcrumbJsonLd(breadcrumbs)) }}
            />

            <div className="news-page">
                {/* Hero */}
                <section className="news-hero">
                    <div className="news-hero-inner">
                        <div className="news-hero-badge">
                            <span className="news-hero-pulse" />
                            Live Feed
                        </div>
                        <h1 className="news-hero-title">AI News</h1>
                        <p className="news-hero-subtitle">
                            Latest AI launches, model updates, funding rounds &amp; industry breakthroughs.
                        </p>
                    </div>
                </section>

                {/* Feed (Client Component) */}
                <NewsFeedClient initialArticles={articles} />
            </div>
        </>
    );
}
