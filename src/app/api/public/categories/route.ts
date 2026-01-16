import { NextResponse } from 'next/server';
// SECURITY: Use anonymous client (not admin) to let RLS act as safety net
import { supabase } from '@/lib/supabase';

// PERFORMANCE: Edge runtime for faster cold starts
export const runtime = 'edge';

// GET /api/public/categories - Public categories listing (NO AUTH REQUIRED)
export async function GET() {
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('id, category_name, description, count, icon')
            .order('category_name', { ascending: true });

        if (error) {
            console.error('Public categories fetch error:', error);
            return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
        }

        const mappedData = (data || []).map(row => ({
            id: row.id,
            categoryName: row.category_name,
            description: row.description,
            count: row.count,
            icon: row.icon,
        }));

        // PERFORMANCE: Cache public responses
        const response = NextResponse.json(mappedData);
        response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
        return response;
    } catch (err) {
        console.error('Public categories error:', err);
        return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }
}

