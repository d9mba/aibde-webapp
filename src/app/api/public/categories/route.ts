import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/public/categories - List categories (PROTECTED)
export async function GET() {
    try {
        // SECURITY: Require authentication
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data, error } = await supabaseAdmin
            .from('categories')
            .select('*')
            .order('category_name', { ascending: true });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const mappedData = (data || []).map(row => ({
            id: row.id,
            categoryName: row.category_name,
            description: row.description,
            count: row.count,
            icon: row.icon,
        }));

        return NextResponse.json(mappedData);
    } catch (err) {
        return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }
}

