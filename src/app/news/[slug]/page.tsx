import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getNewsArticleBySlug, getRelatedNews } from '@/lib/news-db';
import { SEO, getNewsArticleJsonLd, getBreadcrumbJsonLd, safeJsonLdStringify } from '@/lib/seo';
import { formatReadTime } from '@/lib/news-utils';
import { NEWS_CATEGORIES } from '@/types/news';
import { SourceFavicons, RelativeTime } from '@/components/features/news';
import { ArrowLeft } from 'lucide-react';
import { ArticleShareButton } from './ArticleShareButton';

interface PageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const article = await getNewsArticleBySlug(slug);

    if (!article) {
        return { title: 'Article Not Found' };
    }

    return {
        title: article.title,
        description: article.summary,
        openGraph: {
            title: article.title,
            description: article.summary,
            url: `${SEO.siteUrl}/news/${article.slug}`,
            type: 'article',
            publishedTime: article.publishedAt,
            ...(article.heroImage && { images: [{ url: article.heroImage }] }),
        },
        twitter: {
            card: 'summary_large_image',
            title: article.title,
            description: article.summary,
            ...(article.heroImage && { images: [article.heroImage] }),
        },
        alternates: {
            canonical: `${SEO.siteUrl}/news/${article.slug}`,
        },
    };
}

export default async function NewsArticlePage({ params }: PageProps) {
    const { slug } = await params;
    const article = await getNewsArticleBySlug(slug);

    if (!article) notFound();

    const relatedNews = await getRelatedNews(slug, article.category, 3);
    const categoryMeta = NEWS_CATEGORIES.find(c => c.value === article.category);

    const breadcrumbs = [
        { name: 'Home', url: SEO.siteUrl },
        { name: 'News', url: `${SEO.siteUrl}/news` },
        { name: article.title, url: `${SEO.siteUrl}/news/${article.slug}` },
    ];

    const shareUrl = `${SEO.siteUrl}/news/${article.slug}`;

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: safeJsonLdStringify(getNewsArticleJsonLd({
                        title: article.title,
                        slug: article.slug,
                        summary: article.summary,
                        publishedAt: article.publishedAt,
                        heroImage: article.heroImage,
                        sources: article.sources,
                    })),
                }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(getBreadcrumbJsonLd(breadcrumbs)) }}
            />

            <article className="news-article-page">
                {/* Back link */}
                <nav className="news-article-back">
                    <Link href="/news" className="news-article-back-link">
                        <ArrowLeft size={16} />
                        Back to News
                    </Link>
                </nav>

                {/* Header */}
                <header className="news-article-header">
                    <div className="news-article-meta-bar">
                        <span className="news-article-category">
                            {categoryMeta?.icon} {categoryMeta?.label}
                        </span>
                        <span className="news-article-time-row">
                            <svg className="news-article-clock" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <RelativeTime dateISO={article.publishedAt} className="news-article-time" />
                        </span>
                        <span className="news-article-readtime">
                            {formatReadTime(article.readTimeMinutes)}
                        </span>
                    </div>

                    <h1 className="news-article-title">{article.title}</h1>

                    {/* Source Row */}
                    <div className="news-article-source-row">
                        <SourceFavicons sources={article.sources} size={22} maxVisible={3} />
                        <span className="news-article-source-label">
                            {article.sources.length} source{article.sources.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                </header>

                {/* Hero Image */}
                {article.heroImage && (
                    <div className="news-article-hero-image">
                        <img src={article.heroImage} alt={article.title} />
                    </div>
                )}

                {/* AI Summary */}
                {article.summary && (
                    <div className="news-article-summary">
                        <div className="news-article-summary-label">
                            <span className="news-article-summary-icon">✨</span>
                            AI Summary
                        </div>
                        <p>{article.summary}</p>
                    </div>
                )}

                {/* Article Body */}
                <div
                    className="news-article-content rich-text"
                    dangerouslySetInnerHTML={{ __html: article.content }}
                />

                {/* Tags — clickable, link to /news?tag=X */}
                {article.tags.length > 0 && (
                    <div className="news-article-tags">
                        {article.tags.map(tag => (
                            <Link
                                key={tag}
                                href={`/news?tag=${encodeURIComponent(tag)}`}
                                className="news-article-tag"
                            >
                                #{tag}
                            </Link>
                        ))}
                    </div>
                )}

                {/* Share — reuses site-wide ShareModal */}
                <ArticleShareButton url={shareUrl} title={article.title} summary={article.summary} />

                {/* Related Tools */}
                {article.relatedToolSlugs.length > 0 && (
                    <section className="news-related-tools">
                        <h2>Related AI Tools</h2>
                        <div className="news-related-tools-grid">
                            {article.relatedToolSlugs.map(toolSlug => (
                                <Link key={toolSlug} href={`/app/${toolSlug}`} className="news-related-tool-pill">
                                    {toolSlug}
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* Related News */}
                {relatedNews.length > 0 && (
                    <section className="news-related-articles">
                        <h2>Related News</h2>
                        <div className="news-related-grid">
                            {relatedNews.map(related => (
                                <Link key={related.id} href={`/news/${related.slug}`} className="news-related-card">
                                    <div className="news-related-card-body">
                                        <span className="news-related-card-category">
                                            {NEWS_CATEGORIES.find(c => c.value === related.category)?.label}
                                        </span>
                                        <h3>{related.title}</h3>
                                        <p>{related.summary}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </article>
        </>
    );
}
