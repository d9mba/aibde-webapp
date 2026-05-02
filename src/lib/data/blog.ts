/**
 * Blog Data Layer (SERVER-ONLY)
 *
 * Fetches blog posts from Supabase for server components.
 */

import 'server-only';

import { supabaseAdmin } from '../supabase';
import { BlogPost, DbBlogPost, dbBlogPostToFrontend } from '@/types/blog';

const BLOG_LIST_FIELDS = `
    id, title, slug, excerpt, category, tags, related_tools,
    status, published_at, created_at, updated_at,
    meta_title, meta_description, cover_image
`;

const BLOG_DETAIL_FIELDS = `
    id, title, slug, content, excerpt, category, tags, related_tools,
    faq, status, published_at, created_at, updated_at,
    meta_title, meta_description, focus_keywords,
    cover_image, images
`;

/** Fetch published blog posts with pagination */
export async function getPublishedBlogPosts(
    page: number = 1,
    pageSize: number = 12,
    category?: string
): Promise<{ posts: BlogPost[]; total: number }> {
    let query = supabaseAdmin
        .from('blog_posts')
        .select(BLOG_LIST_FIELDS, { count: 'exact' })
        .eq('status', 'published')
        .not('published_at', 'is', null)
        .order('published_at', { ascending: false });

    if (category) {
        query = query.eq('category', category);
    }

    const offset = (page - 1) * pageSize;
    query = query.range(offset, offset + pageSize - 1);

    const { data, count, error } = await query;

    if (error) {
        console.error('Error fetching blog posts:', error);
        return { posts: [], total: 0 };
    }

    const posts = (data as DbBlogPost[] || []).map(row => ({
        ...dbBlogPostToFrontend(row),
        content: '', // Don't send content in list view
    }));

    return { posts, total: count || 0 };
}

/** Fetch a single published blog post by slug */
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
    const { data, error } = await supabaseAdmin
        .from('blog_posts')
        .select(BLOG_DETAIL_FIELDS)
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        console.error('Error fetching blog post:', error);
        return null;
    }

    return dbBlogPostToFrontend(data as DbBlogPost);
}

/** Fetch all published blog posts for sitemap */
export async function getAllPublishedBlogSlugs(): Promise<{ slug: string; updatedAt: string }[]> {
    const { data, error } = await supabaseAdmin
        .from('blog_posts')
        .select('slug, updated_at')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

    if (error) {
        console.error('Error fetching blog slugs:', error);
        return [];
    }

    return (data || []).map(row => ({
        slug: row.slug,
        updatedAt: row.updated_at,
    }));
}

/** Get published blog post count */
export async function getBlogPostsCount(): Promise<number> {
    const { count, error } = await supabaseAdmin
        .from('blog_posts')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'published');

    if (error) {
        console.error('Error counting blog posts:', error);
        return 0;
    }
    return count || 0;
}

/** Fetch related blog posts (same category, exclude current) */
export async function getRelatedBlogPosts(
    currentSlug: string,
    category: string,
    limit: number = 3
): Promise<BlogPost[]> {
    const { data, error } = await supabaseAdmin
        .from('blog_posts')
        .select(BLOG_LIST_FIELDS)
        .eq('status', 'published')
        .eq('category', category)
        .neq('slug', currentSlug)
        .order('published_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching related blog posts:', error);
        return [];
    }

    return (data as DbBlogPost[] || []).map(row => ({
        ...dbBlogPostToFrontend(row),
        content: '',
    }));
}
