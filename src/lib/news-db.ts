import { createClient } from '@/lib/supabase/server';
import { dbNewsToFrontend } from '@/types/news';
import type { NewsArticle } from '@/types/news';

/**
 * Fetch all news articles from Supabase.
 */
export async function getNewsArticles(category?: string): Promise<NewsArticle[]> {
    try {
        const supabase = await createClient();
        let query = supabase
            .from('news_articles')
            .select('*')
            .order('published_at', { ascending: false });

        if (category && category !== 'all') {
            query = query.eq('category', category);
        }

        const { data, error } = await query;

        if (error) throw error;

        if (data && data.length > 0) {
            return data.map(dbNewsToFrontend);
        }
    } catch (e) {
        console.error('Failed to fetch news from Supabase:', e);
    }

    return [];
}

/**
 * Fetch a single news article by slug.
 */
export async function getNewsArticleBySlug(slug: string): Promise<NewsArticle | null> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('news_articles')
            .select('*')
            .eq('slug', slug)
            .single();

        if (error) {
            if (error.code !== 'PGRST116') { // not found
                throw error;
            }
        } else if (data) {
            return dbNewsToFrontend(data);
        }
    } catch (e) {
        console.error(`Failed to fetch news article '${slug}' from Supabase:`, e);
    }

    return null;
}

/**
 * Fetch related news articles.
 */
export async function getRelatedNews(slug: string, category: string, limit: number = 3): Promise<NewsArticle[]> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('news_articles')
            .select('*')
            .eq('category', category)
            .neq('slug', slug)
            .order('published_at', { ascending: false })
            .limit(limit);

        if (error) throw error;

        if (data && data.length > 0) {
            return data.map(dbNewsToFrontend);
        }
    } catch (e) {
        console.error(`Failed to fetch related news for '${slug}' from Supabase:`, e);
    }

    return [];
}
