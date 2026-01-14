import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/public/tasks - List tasks (PROTECTED)
export async function GET() {
    try {
        // SECURITY: Require authentication
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data, error } = await supabaseAdmin
            .from('tasks')
            .select('*')
            .order('task_name', { ascending: true });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const mappedData = (data || []).map(row => ({
            id: row.id,
            taskName: row.task_name,
            description: row.description,
            count: row.count,
        }));

        return NextResponse.json(mappedData);
    } catch (err) {
        return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }
}

