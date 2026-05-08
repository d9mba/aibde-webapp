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

    const { error } = await supabaseAdmin
        .from('news_articles')
        .delete()
        .eq('slug', slug);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Deleted' });
}
