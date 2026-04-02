import { NextResponse } from 'next/server';
import { getToolsCount, getCategoriesCount, getTasksCount } from '@/lib/data';

// GET /api/public/stats — lightweight public counts using same functions as homepage
export async function GET() {
    try {
        const [tools, categories, tasks] = await Promise.all([
            getToolsCount(['published', 'approved']),
            getCategoriesCount(),
            getTasksCount(),
        ]);

        const response = NextResponse.json({ tools, categories, tasks });
        // Cache for 1 hour, stale for 24 hours
        response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
        return response;
    } catch (err) {
        console.error('Public stats error:', err);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
