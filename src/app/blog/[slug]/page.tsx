import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBlogPostBySlug, getRelatedBlogPosts } from '@/lib/data';
import { SEO, getArticleJsonLd, getFaqJsonLd, getBreadcrumbJsonLd, safeJsonLdStringify } from '@/lib/seo';
import { supabaseAdmin } from '@/lib/supabase';
import { linkToolMentions, ToolRef } from '@/lib/blog-tools';
import { BLOG_CATEGORIES } from '@/types/blog';

interface PageProps {
    params: Promise<{ slug: string }>;
}

/** Fetch tool names for auto-linking */
async function getToolRefs(): Promise<ToolRef[]> {
    const { data } = await supabaseAdmin
        .from('tools')
        .select('name, app_username')
        .in('status', ['published', 'approved'])
        .limit(2000);

    return (data || []).map(t => ({ name: t.name, slug: t.app_username }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const post = await getBlogPostBySlug(slug);

    if (!post) {
        return { title: 'Post Not Found' };
    }

    const title = post.metaTitle || post.title;
    const description = post.metaDescription || post.excerpt;

    return {
        title,
        description,
        keywords: post.focusKeywords,
        openGraph: {
            title,
            description,
            url: `${SEO.siteUrl}/blog/${post.slug}`,
            type: 'article',
            publishedTime: post.publishedAt || undefined,
            modifiedTime: post.updatedAt,
            ...(post.coverImage && { images: [{ url: post.coverImage }] }),
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            ...(post.coverImage && { images: [post.coverImage] }),
        },
        alternates: {
            canonical: `${SEO.siteUrl}/blog/${post.slug}`,
        },
    };
}

export default async function BlogPostPage({ params }: PageProps) {
    const { slug } = await params;
    const [post, toolRefs] = await Promise.all([
        getBlogPostBySlug(slug),
        getToolRefs(),
    ]);

    if (!post) notFound();

    const relatedPosts = await getRelatedBlogPosts(post.slug, post.category, 3);
    const linkedContent = linkToolMentions(post.content, toolRefs);

    const breadcrumbs = [
        { name: 'Home', url: SEO.siteUrl },
        { name: 'Blog', url: `${SEO.siteUrl}/blog` },
        { name: post.title, url: `${SEO.siteUrl}/blog/${post.slug}` },
    ];

    const categoryLabel = BLOG_CATEGORIES.find(c => c.value === post.category)?.label || post.category;

    return (
        <>
            {/* Article JSON-LD */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: safeJsonLdStringify(getArticleJsonLd({
                        title: post.title,
                        slug: post.slug,
                        excerpt: post.excerpt,
                        publishedAt: post.publishedAt,
                        updatedAt: post.updatedAt,
                        coverImage: post.coverImage,
                    })),
                }}
            />

            {/* FAQ JSON-LD */}
            {post.faq.length > 0 && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: safeJsonLdStringify(getFaqJsonLd(post.faq)),
                    }}
                />
            )}

            {/* Breadcrumb JSON-LD */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(getBreadcrumbJsonLd(breadcrumbs)) }}
            />

            <article className="blog-article-page">
                {/* Header */}
                <header className="blog-article-header">
                    <nav className="blog-breadcrumb" aria-label="Breadcrumb">
                        <Link href="/">Home</Link>
                        <span className="blog-breadcrumb-sep">/</span>
                        <Link href="/blog">Blog</Link>
                        <span className="blog-breadcrumb-sep">/</span>
                        <span>{post.title}</span>
                    </nav>

                    <div className="blog-article-meta-bar">
                        <Link href={`/blog?category=${post.category}`} className="blog-article-category">
                            {categoryLabel}
                        </Link>
                        {post.publishedAt && (
                            <time dateTime={post.publishedAt} className="blog-article-date">
                                {new Date(post.publishedAt).toLocaleDateString('en-US', {
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric',
                                })}
                            </time>
                        )}
                    </div>

                    <h1 className="blog-article-title">{post.title}</h1>

                    {post.excerpt && (
                        <p className="blog-article-excerpt">{post.excerpt}</p>
                    )}
                </header>

                {/* Cover Image */}
                {post.coverImage && (
                    <div className="blog-article-cover">
                        <img src={post.coverImage} alt={post.title} />
                    </div>
                )}

                {/* Content */}
                <div
                    className="blog-article-content prose"
                    dangerouslySetInnerHTML={{ __html: linkedContent }}
                />

                {/* Tags */}
                {post.tags.length > 0 && (
                    <div className="blog-article-tags">
                        {post.tags.map(tag => (
                            <span key={tag} className="blog-article-tag">{tag}</span>
                        ))}
                    </div>
                )}

                {/* FAQ Section */}
                {post.faq.length > 0 && (
                    <section className="blog-faq">
                        <h2 className="blog-faq-title">Frequently Asked Questions</h2>
                        <div className="blog-faq-list">
                            {post.faq.map((item, i) => (
                                <details key={i} className="blog-faq-item">
                                    <summary className="blog-faq-question">{item.question}</summary>
                                    <div className="blog-faq-answer">{item.answer}</div>
                                </details>
                            ))}
                        </div>
                    </section>
                )}

                {/* Related Tools */}
                {post.relatedTools.length > 0 && (
                    <section className="blog-related-tools">
                        <h2>Tools Mentioned</h2>
                        <div className="blog-related-tools-grid">
                            {post.relatedTools.map(slug => (
                                <Link key={slug} href={`/app/${slug}`} className="blog-related-tool-pill">
                                    {slug}
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* Related Articles */}
                {relatedPosts.length > 0 && (
                    <section className="blog-related-articles">
                        <h2>Related Articles</h2>
                        <div className="blog-related-grid">
                            {relatedPosts.map(related => (
                                <Link key={related.id} href={`/blog/${related.slug}`} className="blog-related-card">
                                    {related.coverImage && (
                                        <img src={related.coverImage} alt={related.title} loading="lazy" />
                                    )}
                                    <div className="blog-related-card-body">
                                        <h3>{related.title}</h3>
                                        {related.excerpt && <p>{related.excerpt}</p>}
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
