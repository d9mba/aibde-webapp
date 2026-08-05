import type { Metadata } from 'next';
import Link from 'next/link';
import { getPublishedBlogPosts } from '@/lib/data';
import { BLOG_CATEGORIES, BlogCategory } from '@/types/blog';
import { SEO } from '@/lib/seo';
import { getBreadcrumbJsonLd, safeJsonLdStringify } from '@/lib/seo';

export const metadata: Metadata = {
    title: 'Blog — Best AI Tools, Guides & Comparisons',
    description: 'Discover the best AI tools for 2026. Read guides, comparisons, and in-depth reviews of top AI tools for writing, design, coding, marketing, and more.',
    keywords: ['AI tools blog', 'best AI tools 2026', 'AI tools comparison', 'top AI tools', 'AI guides'],
    openGraph: {
        title: 'Blog — Best AI Tools, Guides & Comparisons | BrowseForAI',
        description: 'Discover the best AI tools for 2026. Read guides, comparisons, and in-depth reviews.',
        url: `${SEO.siteUrl}/blog`,
        type: 'website',
    },
    alternates: {
        canonical: `${SEO.siteUrl}/blog`,
    },
};

interface PageProps {
    searchParams: Promise<{ page?: string; category?: string }>;
}

export default async function BlogPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const page = parseInt(params.page || '1', 10);
    const category = params.category || undefined;
    const pageSize = 12;

    const { posts, total } = await getPublishedBlogPosts(page, pageSize, category);
    const totalPages = Math.ceil(total / pageSize);

    const breadcrumbs = [
        { name: 'Home', url: SEO.siteUrl },
        { name: 'Blog', url: `${SEO.siteUrl}/blog` },
    ];

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(getBreadcrumbJsonLd(breadcrumbs)) }}
            />

            <div className="blog-page">
                {/* Hero */}
                <section className="blog-hero">
                    <div className="blog-hero-inner">
                        <h1 className="blog-hero-title">
                            AI Tools Blog
                        </h1>
                        <p className="blog-hero-subtitle">
                            Guides, comparisons &amp; reviews of the best AI tools in 2026
                        </p>
                    </div>
                </section>

                {/* Category Filter */}
                <nav className="blog-categories" aria-label="Blog categories">
                    <div className="blog-categories-inner">
                        <Link
                            href="/blog"
                            className={`blog-category-pill ${!category ? 'active' : ''}`}
                        >
                            All Posts
                        </Link>
                        {BLOG_CATEGORIES.map(cat => (
                            <Link
                                key={cat.value}
                                href={`/blog?category=${cat.value}`}
                                className={`blog-category-pill ${category === cat.value ? 'active' : ''}`}
                            >
                                {cat.label}
                            </Link>
                        ))}
                    </div>
                </nav>

                {/* Posts Grid */}
                <section className="blog-grid-section">
                    {posts.length === 0 ? (
                        <div className="blog-empty">
                            <p>No articles published yet. Check back soon!</p>
                        </div>
                    ) : (
                        <div className="blog-grid">
                            {posts.map(post => (
                                <article key={post.id} className="blog-card">
                                    <Link href={`/blog/${post.slug}`} className="blog-card-link">
                                        {post.coverImage && (
                                            <div className="blog-card-image">
                                                <img
                                                    src={post.coverImage}
                                                    alt={post.title}
                                                    loading="lazy"
                                                />
                                            </div>
                                        )}
                                        <div className="blog-card-body">
                                            <div className="blog-card-meta">
                                                <span className="blog-card-category">
                                                    {BLOG_CATEGORIES.find(c => c.value === post.category)?.label || post.category}
                                                </span>
                                                {post.publishedAt && (
                                                    <time dateTime={post.publishedAt}>
                                                        {new Date(post.publishedAt).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric',
                                                        })}
                                                    </time>
                                                )}
                                            </div>
                                            <h2 className="blog-card-title">{post.title}</h2>
                                            {post.excerpt && (
                                                <p className="blog-card-excerpt">{post.excerpt}</p>
                                            )}
                                            <div className="blog-card-tags">
                                                {post.tags.slice(0, 3).map(tag => (
                                                    <span key={tag} className="blog-card-tag">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </Link>
                                </article>
                            ))}
                        </div>
                    )}
                </section>

                {/* Pagination */}
                {totalPages > 1 && (
                    <nav className="blog-pagination" aria-label="Blog pagination">
                        {page > 1 && (
                            <Link
                                href={`/blog?page=${page - 1}${category ? `&category=${category}` : ''}`}
                                className="blog-pagination-btn"
                            >
                                ← Previous
                            </Link>
                        )}
                        <span className="blog-pagination-info">
                            Page {page} of {totalPages}
                        </span>
                        {page < totalPages && (
                            <Link
                                href={`/blog?page=${page + 1}${category ? `&category=${category}` : ''}`}
                                className="blog-pagination-btn"
                            >
                                Next →
                            </Link>
                        )}
                    </nav>
                )}
            </div>
        </>
    );
}
