import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';
import { dbBlogPostToFrontend, blogPostToDb } from '@/types/blog';
import type { DbBlogPost } from '@/types/blog';

interface RouteParams {
    params: Promise<{ id: string }>;
}

/** GET /api/blog/[id] — fetch single post (admin) */
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const { data, error } = await supabaseAdmin
        .from('blog_posts')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        const status = error.code === 'PGRST116' ? 404 : 500;
        return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ data: dbBlogPostToFrontend(data as DbBlogPost) });
}

/** PUT /api/blog/[id] — update a blog post */
export async function PUT(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const dbData = blogPostToDb(body);

    // Set published_at when publishing for the first time
    if (body.status === 'published' && !body.publishedAt) {
        dbData.published_at = new Date().toISOString();
    }

    const { data, error } = await supabaseAdmin
        .from('blog_posts')
        .update(dbData)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: dbBlogPostToFrontend(data as DbBlogPost) });
}

/** DELETE /api/blog/[id] — delete a blog post */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const { error } = await supabaseAdmin
        .from('blog_posts')
        .delete()
        .eq('id', id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Deleted' });
}
