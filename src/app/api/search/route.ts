import { NextRequest, NextResponse } from 'next/server';
import { supabase, dbToolToAdminTool } from '@/lib/supabase';

/**
 * GET /api/search - Search tools on demand
 * Query params: q (search query), category, task, pricing, limit
 * Results are sorted with name matches first
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q') || '';
        const category = searchParams.get('category');
        const task = searchParams.get('task');
        const pricing = searchParams.get('pricing');
        const limit = parseInt(searchParams.get('limit') || '100');

        // Build the query
        let dbQuery = supabase
            .from('tools')
            .select('*')
            .in('status', ['published', 'approved']);

        // Apply text search if query provided
        if (query) {
            // Use ilike for prefix search (allows index usage)
            // Note: Removed leading % to enable index optimization
            dbQuery = dbQuery.or(`name.ilike.${query}%,summary.ilike.${query}%,description.ilike.${query}%`);
        }

        // Apply category filter
        if (category) {
            dbQuery = dbQuery.contains('category_name', [category]);
        }

        // Apply task filter
        if (task) {
            dbQuery = dbQuery.contains('task_name', [task]);
        }

        // Apply pricing filter
        if (pricing) {
            dbQuery = dbQuery.eq('pricing', pricing);
        }

        // Fetch more than needed for sorting
        dbQuery = dbQuery.limit(limit * 2);

        const { data, error } = await dbQuery;

        if (error) {
            console.error('Search error:', error);
            return NextResponse.json({ error: 'Search failed' }, { status: 500 });
        }

        let tools = (data || []).map(tool => dbToolToAdminTool(tool));

        // Sort: Name matches first, then by save_count
        if (query) {
            const lowerQuery = query.toLowerCase();
            tools = tools.sort((a, b) => {
                const aNameMatch = a.name.toLowerCase().includes(lowerQuery);
                const bNameMatch = b.name.toLowerCase().includes(lowerQuery);
                const aNameStarts = a.name.toLowerCase().startsWith(lowerQuery);
                const bNameStarts = b.name.toLowerCase().startsWith(lowerQuery);

                // Priority: starts with > contains in name > contains elsewhere
                if (aNameStarts && !bNameStarts) return -1;
                if (!aNameStarts && bNameStarts) return 1;
                if (aNameMatch && !bNameMatch) return -1;
                if (!aNameMatch && bNameMatch) return 1;

                // Same category, sort by save_count
                return b.saveCount - a.saveCount;
            });
        }

        // Apply final limit after sorting
        tools = tools.slice(0, limit);

        return NextResponse.json({ tools, count: tools.length });
    } catch (err) {
        console.error('Search API error:', err);
        return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }
}
