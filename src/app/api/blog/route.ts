import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';
import { dbBlogPostToFrontend, blogPostToDb } from '@/types/blog';
import type { DbBlogPost } from '@/types/blog';

/** GET /api/blog — list all blog posts (admin) */
export async function GET(request: NextRequest) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    let query = supabaseAdmin
        .from('blog_posts')
        .select('*', { count: 'exact' })
        .order('updated_at', { ascending: false });

    if (status) {
        query = query.eq('status', status);
    }

    const offset = (page - 1) * pageSize;
    query = query.range(offset, offset + pageSize - 1);

    const { data, count, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const posts = (data as DbBlogPost[] || []).map(dbBlogPostToFrontend);

    return NextResponse.json({
        data: posts,
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
    });
}

/** POST /api/blog — create a new blog post */
export async function POST(request: NextRequest) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const dbData = blogPostToDb(body);

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
        .from('blog_posts')
        .insert(dbData)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: dbBlogPostToFrontend(data as DbBlogPost) }, { status: 201 });
}
