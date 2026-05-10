import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getNewsArticleBySlug, getRelatedNews } from '@/lib/news-db';
import { dbNewsToFrontend, newsArticleToDb } from '@/types/news';
import type { DbNewsArticle } from '@/types/news';

interface RouteParams {
    params: Promise<{ slug: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
    const { slug } = await params;
    const article = await getNewsArticleBySlug(slug);

    if (!article) {
        return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    const related = await getRelatedNews(slug, article.category, 3);
    return NextResponse.json({ data: article, related });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { slug } = await params;
    const body = await request.json();
    const dbData = newsArticleToDb(body);

    const { data, error } = await supabaseAdmin
        .from('news_articles')
        .update(dbData)
        .eq('id', body.id) // using ID from body is safer than matching by slug for updates
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: dbNewsToFrontend(data as DbNewsArticle) });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { slug } = await params;

    // First, fetch the article to get its images for cleanup
    const { data: article } = await supabaseAdmin
        .from('news_articles')
        .select('content, hero_image, thumbnail')
        .eq('slug', slug)
        .single();

    if (article) {
        // Extract all image URLs
        const matches = (article.content || '').match(/<img[^>]+src=["']([^"']+)["']/gi) || [];
        const contentUrls = matches.map((m: string) => {
            const srcMatch = m.match(/src=["']([^"']+)["']/);
            return srcMatch ? srcMatch[1] : '';
        }).filter(Boolean);
        
        const allUrls = [...contentUrls, article.hero_image, article.thumbnail].filter(Boolean);
        
        if (allUrls.length > 0) {
            const cdnBase = process.env.NEXT_PUBLIC_CDN_URL || '';
            const relativePaths = allUrls.map((url: string) => cdnBase ? url.replace(cdnBase, '') : url);
            
            // Delete from Cloudflare R2 via our cleanup endpoint
            try {
                // Determine base URL for local fetch since we are server-side
                const baseUrl = request.headers.get('origin') || `http://${request.headers.get('host')}`;
                await fetch(`${baseUrl}/api/upload/cleanup`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ files: relativePaths })
                });
            } catch (err) {
                console.error('[DELETE News] Failed to cleanup images:', err);
            }
        }
    }

    // Now delete the article from database
    const { error } = await supabaseAdmin
        .from('news_articles')
        .delete()
        .eq('slug', slug);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Deleted' });
}
