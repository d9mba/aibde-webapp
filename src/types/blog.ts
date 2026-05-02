// =============================================================================
// Blog Post Types
// =============================================================================

export type BlogCategory = 'top-tools' | 'comparisons' | 'guides' | 'news' | 'tutorials';

export const BLOG_CATEGORIES: { value: BlogCategory; label: string }[] = [
    { value: 'top-tools', label: 'Top Tools' },
    { value: 'comparisons', label: 'Comparisons' },
    { value: 'guides', label: 'Guides' },
    { value: 'news', label: 'News' },
    { value: 'tutorials', label: 'Tutorials' },
];

export interface BlogPost {
    id: string;
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    category: BlogCategory;
    tags: string[];
    relatedTools: string[]; // tool app_usernames
    faq: { question: string; answer: string }[];
    status: 'draft' | 'published';
    publishedAt: string | null;
    createdAt: string;
    updatedAt: string;
    metaTitle: string;
    metaDescription: string;
    focusKeywords: string[];
    coverImage: string | null;
    images: string[];
}

/** DB row shape (snake_case) */
export interface DbBlogPost {
    id: string;
    title: string;
    slug: string;
    content: string;
    excerpt: string | null;
    category: string | null;
    tags: string[] | null;
    related_tools: string[] | null;
    faq: { question: string; answer: string }[] | null;
    status: string;
    published_at: string | null;
    created_at: string;
    updated_at: string;
    meta_title: string | null;
    meta_description: string | null;
    focus_keywords: string[] | null;
    cover_image: string | null;
    images: string[] | null;
}

/** Convert DB row → frontend BlogPost */
export function dbBlogPostToFrontend(row: DbBlogPost): BlogPost {
    let faq: { question: string; answer: string }[] = [];
    if (row.faq) {
        faq = typeof row.faq === 'string' ? JSON.parse(row.faq) : row.faq;
    }
    return {
        id: row.id,
        title: row.title,
        slug: row.slug,
        content: row.content,
        excerpt: row.excerpt || '',
        category: (row.category || 'guides') as BlogCategory,
        tags: row.tags || [],
        relatedTools: row.related_tools || [],
        faq,
        status: row.status as 'draft' | 'published',
        publishedAt: row.published_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        metaTitle: row.meta_title || '',
        metaDescription: row.meta_description || '',
        focusKeywords: row.focus_keywords || [],
        coverImage: row.cover_image,
        images: row.images || [],
    };
}

/** Convert frontend BlogPost → DB row for upsert */
export function blogPostToDb(post: Partial<BlogPost>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    const mapping: Record<string, string> = {
        relatedTools: 'related_tools',
        publishedAt: 'published_at',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        metaTitle: 'meta_title',
        metaDescription: 'meta_description',
        focusKeywords: 'focus_keywords',
        coverImage: 'cover_image',
    };

    for (const [key, value] of Object.entries(post)) {
        if (key === 'id') continue; // skip id for inserts
        const dbKey = mapping[key] || key;
        result[dbKey] = value;
    }
    return result;
}
