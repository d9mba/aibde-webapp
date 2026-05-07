// =============================================================================
// News Types
// =============================================================================

export type NewsCategory =
    | 'all'
    | 'models'
    | 'startups'
    | 'funding'
    | 'open-source'
    | 'research'
    | 'ai-tools'
    | 'video-ai'
    | 'coding-ai';

export const NEWS_CATEGORIES: { value: NewsCategory; label: string; icon: string }[] = [
    { value: 'all', label: 'All', icon: '🔥' },
    { value: 'models', label: 'Models', icon: '🧠' },
    { value: 'startups', label: 'Startups', icon: '🚀' },
    { value: 'funding', label: 'Funding', icon: '💰' },
    { value: 'open-source', label: 'Open Source', icon: '🔓' },
    { value: 'research', label: 'Research', icon: '🔬' },
    { value: 'ai-tools', label: 'AI Tools', icon: '🛠️' },
    { value: 'video-ai', label: 'Video AI', icon: '🎬' },
    { value: 'coding-ai', label: 'Coding AI', icon: '💻' },
];

export interface NewsSource {
    name: string;
    url: string;
    favicon: string;
}

export interface NewsArticle {
    id: string;
    title: string;
    slug: string;
    summary: string;
    content: string;
    category: NewsCategory;
    thumbnail: string | null;
    sources: NewsSource[];
    publishedAt: string; // UTC ISO string
    readTimeMinutes: number;
    relatedToolSlugs: string[];
    tags: string[];
    heroImage: string | null;
    isFeatured: boolean;
}

/** DB row shape (snake_case) — ready for Supabase */
export interface DbNewsArticle {
    id: string;
    title: string;
    slug: string;
    summary: string | null;
    content: string;
    category: string | null;
    thumbnail: string | null;
    sources: NewsSource[] | null;
    published_at: string;
    read_time_minutes: number | null;
    related_tool_slugs: string[] | null;
    tags: string[] | null;
    hero_image: string | null;
    is_featured: boolean;
    created_at: string;
    updated_at: string;
}

/** Convert DB row → frontend NewsArticle */
export function dbNewsToFrontend(row: DbNewsArticle): NewsArticle {
    return {
        id: row.id,
        title: row.title,
        slug: row.slug,
        summary: row.summary || '',
        content: row.content,
        category: (row.category || 'all') as NewsCategory,
        thumbnail: row.thumbnail,
        sources: row.sources || [],
        publishedAt: row.published_at,
        readTimeMinutes: row.read_time_minutes || 1,
        relatedToolSlugs: row.related_tool_slugs || [],
        tags: row.tags || [],
        heroImage: row.hero_image,
        isFeatured: row.is_featured,
    };
}
