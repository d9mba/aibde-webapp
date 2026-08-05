/**
 * SEO helpers: JSON-LD structured data and shared constants
 */

/** Safely stringify JSON-LD, escaping sequences that could break out of a script tag */
export function safeJsonLdStringify(data: unknown): string {
    return JSON.stringify(data)
        .replace(/</g, '\\u003c')
        .replace(/>/g, '\\u003e');
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.browseforai.com';
const SITE_NAME = 'BrowseForAI';

export const SEO = {
    siteUrl: SITE_URL,
    siteName: SITE_NAME,
} as const;

/** WebSite + Organization for root layout (sitelinks search box eligible) */
export function getWebSiteJsonLd() {
    return {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'WebSite',
                '@id': `${SITE_URL}/#website`,
                url: SITE_URL,
                name: SITE_NAME,
                description: 'Discover and compare 10,000+ AI tools for writing, design, coding, marketing, and more.',
                publisher: { '@id': `${SITE_URL}/#organization` },
                potentialAction: {
                    '@type': 'SearchAction',
                    target: {
                        '@type': 'EntryPoint',
                        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
                    },
                    'query-input': 'required name=search_term_string',
                },
                inLanguage: 'en-US',
            },
            {
                '@type': 'Organization',
                '@id': `${SITE_URL}/#organization`,
                name: SITE_NAME,
                url: SITE_URL,
                logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` },
            },
        ],
    };
}

/** SoftwareApplication for a single AI tool page */
export function getToolJsonLd(tool: {
    name: string;
    appUsername: string;
    summary?: string | null;
    description?: string | null;
    websiteUrl?: string | null;
    logoUrl?: string | null;
    categoryName?: string[];
    taskName?: string[];
    pricing?: string;
}) {
    return {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: tool.name,
        url: `${SITE_URL}/app/${tool.appUsername}`,
        description: (tool.summary || tool.description || '').slice(0, 500),
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Any',
        ...(tool.pricing === 'free' && { offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } }),
        image: tool.logoUrl || undefined,
        ...(tool.websiteUrl && { sameAs: tool.websiteUrl }),
        ...(tool.categoryName?.length && { keywords: tool.categoryName.join(', ') }),
    };
}

/** BreadcrumbList for category or task slug page */
export function getBreadcrumbJsonLd(items: { name: string; url: string }[]) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: item.name,
            item: item.url,
        })),
    };
}

/** ItemList for a category or task listing page (top tools) */
export function getItemListJsonLd(
    name: string,
    url: string,
    items: { name: string; url: string }[],
    description?: string
) {
    return {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name,
        url,
        description: description || undefined,
        numberOfItems: items.length,
        itemListElement: items.slice(0, 10).map((item, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: item.url,
            name: item.name,
        })),
    };
}

/** FAQPage for pages with FAQ sections (rich results in Google) */
export function getFaqJsonLd(faqs: { question: string; answer: string }[]) {
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
            },
        })),
    };
}

/** Article JSON-LD for blog posts */
export function getArticleJsonLd(article: {
    title: string;
    slug: string;
    excerpt: string;
    publishedAt: string | null;
    updatedAt: string;
    coverImage?: string | null;
}) {
    return {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: article.title,
        url: `${SITE_URL}/blog/${article.slug}`,
        description: article.excerpt,
        datePublished: article.publishedAt || article.updatedAt,
        dateModified: article.updatedAt,
        author: {
            '@type': 'Organization',
            name: SITE_NAME,
            url: SITE_URL,
        },
        publisher: {
            '@type': 'Organization',
            name: SITE_NAME,
            logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` },
        },
        ...(article.coverImage && { image: article.coverImage }),
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `${SITE_URL}/blog/${article.slug}`,
        },
    };
}

/** NewsArticle JSON-LD for /news/[slug] pages (Google News eligible) */
export function getNewsArticleJsonLd(article: {
    title: string;
    slug: string;
    summary: string;
    publishedAt: string;
    heroImage?: string | null;
    sources?: { name: string; url: string }[];
}) {
    return {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        headline: article.title,
        url: `${SITE_URL}/news/${article.slug}`,
        description: article.summary,
        datePublished: article.publishedAt,
        dateModified: article.publishedAt,
        author: {
            '@type': 'Organization',
            name: SITE_NAME,
            url: SITE_URL,
        },
        publisher: {
            '@type': 'Organization',
            name: SITE_NAME,
            logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` },
        },
        ...(article.heroImage && { image: article.heroImage }),
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `${SITE_URL}/news/${article.slug}`,
        },
        ...(article.sources?.length && {
            citation: article.sources.map(s => ({
                '@type': 'WebPage',
                name: s.name,
                url: s.url,
            })),
        }),
    };
}

