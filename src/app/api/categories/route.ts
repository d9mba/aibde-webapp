import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { categorySchema } from '@/lib/validations';
import { requireAdmin, isAuthError } from '@/lib/auth-utils';

// Escape SQL LIKE wildcards so user input is matched literally
function escapeLikePattern(input: string): string {
    return input.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

// GET /api/categories - List categories with pagination (ADMIN ONLY)
export async function GET(request: NextRequest) {
    try {
        const authResult = await requireAdmin();
        if (isAuthError(authResult)) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '25');
        const all = searchParams.get('all') === 'true';
        const MAX_SEARCH_LENGTH = 100;
        const search = (searchParams.get('search') || '').trim().slice(0, MAX_SEARCH_LENGTH);

        // If all=true, fetch all records (for dashboard stats, etc.)
        if (all) {
            const PAGE_SIZE = 1000;
            let allData: Array<{ id: string; category_name: string; description: string; count: number; icon: string }> = [];
            let pageNum = 0;
            let hasMore = true;

            while (hasMore) {
                let query = supabaseAdmin
                    .from('categories')
                    .select('*')
                    .order('category_name', { ascending: true })
                    .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);
                if (search) query = query.ilike('category_name', `%${escapeLikePattern(search)}%`);
                const { data, error } = await query;

                if (error) {
                    return NextResponse.json({ error: error.message }, { status: 500 });
                }

                if (data && data.length > 0) {
                    allData = [...allData, ...data];
                    hasMore = data.length === PAGE_SIZE;
                    pageNum++;
                } else {
                    hasMore = false;
                }
            }

            const mappedData = allData.map(row => ({
                id: row.id,
                categoryName: row.category_name,
                description: row.description,
                count: row.count,
                icon: row.icon,
            }));

            return NextResponse.json(mappedData);
        }


        // Build base query with optional search filter
        let countQuery = supabaseAdmin.from('categories').select('*', { count: 'exact', head: true });
        if (search) countQuery = countQuery.ilike('category_name', `%${escapeLikePattern(search)}%`);

        const { count: totalCount, error: countError } = await countQuery;

        if (countError) {
            return NextResponse.json({ error: countError.message }, { status: 500 });
        }

        // Get paginated data
        const offset = (page - 1) * limit;
        let dataQuery = supabaseAdmin
            .from('categories')
            .select('*')
            .order('category_name', { ascending: true })
            .range(offset, offset + limit - 1);
        if (search) dataQuery = dataQuery.ilike('category_name', `%${escapeLikePattern(search)}%`);

        const { data, error } = await dataQuery;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Map database column names to frontend field names
        const mappedData = (data || []).map(row => ({
            id: row.id,
            categoryName: row.category_name,
            description: row.description,
            count: row.count,
            icon: row.icon,
        }));

        return NextResponse.json({
            data: mappedData,
            pagination: {
                page,
                limit,
                total: totalCount || 0,
                totalPages: Math.ceil((totalCount || 0) / limit),
            },
        });
    } catch (err) {
        return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }
}

// POST /api/categories - Create new category (ADMIN ONLY)
export async function POST(request: NextRequest) {
    try {
        const authResult = await requireAdmin();
        if (isAuthError(authResult)) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const body = await request.json();

        // Validate input
        const parseResult = categorySchema.safeParse(body);
        if (!parseResult.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: parseResult.error.flatten() },
                { status: 400 }
            );
        }

        const { data, error } = await supabaseAdmin
            .from('categories')
            .insert([{
                category_name: body.categoryName,
                description: body.description || '',
                count: body.count || 0,
            }])
            .select()
            .single();

        if (error) {
            // Check for unique constraint violation (duplicate)
            if (error.code === '23505') {
                return NextResponse.json({ error: 'Category already exists' }, { status: 409 });
            }
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data, { status: 201 });
    } catch (err) {
        return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
    }
}

// PUT /api/categories - Update category (ADMIN ONLY)
export async function PUT(request: NextRequest) {
    try {
        const authResult = await requireAdmin();
        if (isAuthError(authResult)) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const body = await request.json();
        const { id, ...updates } = body;

        // Validate input
        const parseResult = categorySchema.partial().safeParse(updates);
        if (!parseResult.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: parseResult.error.flatten() },
                { status: 400 }
            );
        }

        // Map frontend field names to database column names
        const dbUpdates: Record<string, unknown> = {};
        if (updates.categoryName !== undefined) dbUpdates.category_name = updates.categoryName;
        if (updates.description !== undefined) dbUpdates.description = updates.description;
        if (updates.count !== undefined) dbUpdates.count = updates.count;
        if (updates.icon !== undefined) dbUpdates.icon = updates.icon;

        const { data, error } = await supabaseAdmin
            .from('categories')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (err) {
        return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
    }
}

// DELETE /api/categories - Delete category (ADMIN ONLY)
export async function DELETE(request: NextRequest) {
    try {
        const authResult = await requireAdmin();
        if (isAuthError(authResult)) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID required' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('categories')
            .delete()
            .eq('id', id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
    }
}
