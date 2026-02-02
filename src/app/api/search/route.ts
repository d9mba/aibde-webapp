import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * Handle GET /api/search: return a list of public tool summaries matching query and filters.
 *
 * Performs a filtered search over public tool records (status 'published' or 'approved')
 * using optional query parameters: `q` (text prefix search against name and summary),
 * `category`, `task`, `pricing`, and `limit`. When `q` is provided, results are ordered
 * to prefer name prefix matches, then name contains matches, and finally by `saveCount`.
 *
 * The response payload is a JSON object with `tools` — an array of sanitized public tool
 * objects — and `count` — the number of returned tools. Each tool includes public-safe
 * fields such as `id`, `name`, `app_username`, `logoUrl`, `summary`, `categoryName`,
 * `taskName`, `tags`, `pricing`, `saveCount`, and `isFeatured`.
 *
 * On failure the handler responds with status 500 and a JSON error object: `{ error: 'Search failed' }`.
 *
 * @returns A JSON object `{ tools, count }` where `tools` is an array of public tool summaries and `count` is the number returned.
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q') || '';
        const category = searchParams.get('category');
        const task = searchParams.get('task');
        const pricing = searchParams.get('pricing');
        const limit = parseInt(searchParams.get('limit') || '100');

        // SECURITY: Only select public-safe fields, not all data
        const PUBLIC_SEARCH_FIELDS = `
            id, name, app_username, logo_url, summary, description,
            category_name, task_name, tags,
            pricing, pricing_label, save_count, is_featured,
            status, created_at, updated_at
        `;

        // Build the query
        let dbQuery = supabase
            .from('tools')
            .select(PUBLIC_SEARCH_FIELDS)
            .in('status', ['published', 'approved']);

        // Apply text search if query provided
        if (query) {
            // Use ilike for prefix search on short text fields only
            // NOTE: Removed description - prefix search is useless on long text
            // (descriptions rarely start with the search term)
            dbQuery = dbQuery.or(`name.ilike.${query}%,summary.ilike.${query}%`);
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

        // SECURITY: Use light transformation - only return essential public fields
        // Don't use dbToolToAdminTool as it adds internal fields like internalNotes
        interface PublicTool {
            id: string;
            name: string;
            app_username: string;
            logoUrl: string | null;
            summary: string;
            categoryName: string[];
            taskName: string[];
            tags: string[];
            pricing: string;
            saveCount: number;
            isFeatured: boolean;
        }

        const toPublicTool = (tool: Record<string, unknown>): PublicTool => ({
            id: tool.id as string,
            name: tool.name as string,
            app_username: tool.app_username as string,
            logoUrl: tool.logo_url as string | null,
            summary: tool.summary as string,
            categoryName: tool.category_name as string[],
            taskName: tool.task_name as string[],
            tags: tool.tags as string[],
            pricing: tool.pricing as string,
            saveCount: (tool.save_count as number) || 0,
            isFeatured: tool.is_featured as boolean,
        });

        let tools = (data || []).map(tool => toPublicTool(tool));

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