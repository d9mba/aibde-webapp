import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/public/tasks - Public tasks listing (NO AUTH REQUIRED)
export async function GET() {
    try {
        const { data, error } = await supabaseAdmin
            .from('tasks')
            .select('id, task_name, description, count')
            .order('task_name', { ascending: true });

        if (error) {
            console.error('Public tasks fetch error:', error);
            return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
        }

        const mappedData = (data || []).map(row => ({
            id: row.id,
            taskName: row.task_name,
            description: row.description,
            count: row.count,
        }));

        // PERFORMANCE: Cache public responses
        const response = NextResponse.json(mappedData);
        response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
        return response;
    } catch (err) {
        console.error('Public tasks error:', err);
        return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }
}

