import { NextRequest, NextResponse } from 'next/server';
import { getNewsArticleBySlug, getRelatedNews } from '@/lib/news-db';

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
