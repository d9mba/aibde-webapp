import { NextRequest, NextResponse } from 'next/server';
import { supabase, dbToolToAdminTool } from '@/lib/supabase';

/**
 * GET /api/tools/by-task - Paginated tools by task
 * Query params: task (required), offset, limit
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const task = searchParams.get('task');
        const offset = parseInt(searchParams.get('offset') || '0');
        const limit = parseInt(searchParams.get('limit') || '50');

        if (!task) {
            return NextResponse.json({ error: 'Task is required' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('tools')
            .select('*')
            .in('status', ['published', 'approved'])
            .contains('task_name', [task])
            .order('save_count', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Error fetching tools by task:', error);
            return NextResponse.json({ error: 'Failed to fetch tools' }, { status: 500 });
        }

        const tools = (data || []).map(tool => dbToolToAdminTool(tool));

        return NextResponse.json({ tools, count: tools.length });
    } catch (err) {
        console.error('API error:', err);
        return NextResponse.json({ error: 'Failed to fetch tools' }, { status: 500 });
    }
}
