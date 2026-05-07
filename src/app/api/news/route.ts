import { NextRequest, NextResponse } from 'next/server';
import { getNewsArticles } from '@/lib/news-db';

export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const category = searchParams.get('category') || undefined;

    const articles = await getNewsArticles(category);
    return NextResponse.json({ data: articles, total: articles.length });
}
