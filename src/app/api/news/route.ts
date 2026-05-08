import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getNewsArticles } from '@/lib/news-db';
import { dbNewsToFrontend, newsArticleToDb } from '@/types/news';
import type { DbNewsArticle } from '@/types/news';

export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const category = searchParams.get('category') || undefined;

    // Check if it's an admin request requiring pagination
    const page = searchParams.get('page');
    if (page) {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const pageNum = parseInt(page, 10) || 1;
        const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
        
        let query = supabaseAdmin
            .from('news_articles')
            .select('*', { count: 'exact' })
            .order('published_at', { ascending: false });

        if (category && category !== 'all') {
            query = query.eq('category', category);
        }

        const offset = (pageNum - 1) * pageSize;
        query = query.range(offset, offset + pageSize - 1);

        const { data, count, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const articles = (data as DbNewsArticle[] || []).map(dbNewsToFrontend);

        return NextResponse.json({
            data: articles,
            total: count || 0,
            page: pageNum,
            pageSize,
            totalPages: Math.ceil((count || 0) / pageSize),
        });
    }

    // Public request - fetch all or by category
    const articles = await getNewsArticles(category);
    return NextResponse.json({ data: articles, total: articles.length });
}

export async function POST(request: NextRequest) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const dbData = newsArticleToDb(body);

    // Auto-generate slug from title if not provided
    if (!dbData.slug && body.title) {
        dbData.slug = body.title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    }

    const { data, error } = await supabaseAdmin
        .from('news_articles')
        .insert(dbData)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: dbNewsToFrontend(data as DbNewsArticle) }, { status: 201 });
}
