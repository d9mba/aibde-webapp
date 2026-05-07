import { createClient } from '@/lib/supabase/server';
import { dbNewsToFrontend } from '@/types/news';
import type { NewsArticle } from '@/types/news';
import { getMockNews, getMockNewsBySlug, getMockRelatedNews } from './mock-news';

/**
 * Fetch all news articles from Supabase.
 * Falls back to mock data if the table doesn't exist or is empty.
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
        console.warn('Failed to fetch news from Supabase, falling back to mock data:', e);
    }

    // Fallback
    return getMockNews(category);
}

/**
 * Fetch a single news article by slug.
 * Falls back to mock data if not found or on error.
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
        console.warn(`Failed to fetch news article '${slug}' from Supabase, falling back to mock data:`, e);
    }

    return getMockNewsBySlug(slug);
}

/**
 * Fetch related news articles.
 * Falls back to mock data.
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
        console.warn(`Failed to fetch related news for '${slug}' from Supabase, falling back to mock data:`, e);
    }

    return getMockRelatedNews(slug, category, limit);
}
