import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, adminToolToDbTool } from '@/lib/supabase';
import { requireAdmin, isAuthError } from '@/lib/auth-utils';

/**
 * POST /api/tools/bulk
 * Bulk import tools from CSV data
 * Expects JSON body with array of tool objects
 */
export async function POST(request: NextRequest) {
    try {
        const authResult = await requireAdmin();
        if (isAuthError(authResult)) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const body = await request.json();
        const { tools } = body;

        if (!Array.isArray(tools) || tools.length === 0) {
            return NextResponse.json({ error: 'No tools provided' }, { status: 400 });
        }

        // Limit bulk import
        if (tools.length > 200) {
            return NextResponse.json({ error: 'Maximum 200 tools per import' }, { status: 400 });
        }

        const results = {
            success: 0,
            failed: 0,
            errors: [] as { name: string; error: string }[]
        };

        // Fetch existing categories and tasks for matching
        const [categoriesResult, tasksResult, tagsResult] = await Promise.all([
            supabaseAdmin.from('categories').select('id, category_name'),
            supabaseAdmin.from('tasks').select('id, task_name'),
            supabaseAdmin.from('tags').select('id, tag_name')
        ]);

        // Build lookup maps (case-insensitive)
        const categoryMap = new Map<string, string>();
        (categoriesResult.data || []).forEach(c => {
            categoryMap.set(c.category_name.toLowerCase(), c.category_name);
        });

        const taskMap = new Map<string, string>();
        (tasksResult.data || []).forEach(t => {
            taskMap.set(t.task_name.toLowerCase(), t.task_name);
        });

        const tagMap = new Map<string, string>();
        (tagsResult.data || []).forEach(t => {
            tagMap.set(t.tag_name.toLowerCase(), t.tag_name);
        });

        // Helper to match or create category
        const matchCategory = async (name: string): Promise<string> => {
            const lowerName = name.toLowerCase().trim();
            if (categoryMap.has(lowerName)) {
                return categoryMap.get(lowerName)!;
            }
            // Create new category if it doesn't exist
            const { data, error } = await supabaseAdmin
                .from('categories')
                .insert({ category_name: name.trim(), count: 0 })
                .select('category_name')
                .single();
            if (!error && data) {
                categoryMap.set(lowerName, data.category_name);
                return data.category_name;
            }
            // Return original name if creation fails (might be duplicate)
            return name.trim();
        };

        // Helper to match or create task
        const matchTask = async (name: string): Promise<string> => {
            const lowerName = name.toLowerCase().trim();
            if (taskMap.has(lowerName)) {
                return taskMap.get(lowerName)!;
            }
            // Create new task if it doesn't exist
            const { data, error } = await supabaseAdmin
                .from('tasks')
                .insert({ task_name: name.trim(), count: 0 })
                .select('task_name')
                .single();
            if (!error && data) {
                taskMap.set(lowerName, data.task_name);
                return data.task_name;
            }
            return name.trim();
        };

        // Helper to match or create tag
        const matchTag = async (name: string): Promise<string> => {
            const lowerName = name.toLowerCase().trim();
            if (tagMap.has(lowerName)) {
                return tagMap.get(lowerName)!;
            }
            // Create new tag if it doesn't exist
            const { data, error } = await supabaseAdmin
                .from('tags')
                .insert({ tag_name: name.trim() })
                .select('tag_name')
                .single();
            if (!error && data) {
                tagMap.set(lowerName, data.tag_name);
                return data.tag_name;
            }
            return name.trim();
        };

        // Fetch existing tools for duplicate check
        const { data: existingTools } = await supabaseAdmin
            .from('tools')
            .select('name, app_username');

        const existingNames = new Set((existingTools || []).map(t => t.name?.toLowerCase()));
        const existingSlugs = new Set((existingTools || []).map(t => t.app_username?.toLowerCase()));

        // Track names within this batch to detect duplicates in the CSV itself
        const batchNames = new Set<string>();
        const batchSlugs = new Set<string>();

        // Process each tool
        for (const tool of tools) {
            try {
                // Generate slug from name if not provided
                const slug = tool.slug || tool.name
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)/g, '');

                const toolNameLower = tool.name?.toLowerCase();

                // Check for duplicate in the database
                if (existingNames.has(toolNameLower)) {
                    results.errors.push({
                        name: tool.name,
                        error: `Duplicate: Tool "${tool.name}" already exists in database`
                    });
                    results.failed++;
                    continue;
                }

                if (existingSlugs.has(slug)) {
                    results.errors.push({
                        name: tool.name,
                        error: `Duplicate: Slug "${slug}" already exists in database`
                    });
                    results.failed++;
                    continue;
                }

                // Check for duplicate within the same batch/CSV
                if (batchNames.has(toolNameLower)) {
                    results.errors.push({
                        name: tool.name,
                        error: `Duplicate in CSV: Tool "${tool.name}" appears multiple times in this import`
                    });
                    results.failed++;
                    continue;
                }

                if (batchSlugs.has(slug)) {
                    results.errors.push({
                        name: tool.name,
                        error: `Duplicate in CSV: Slug "${slug}" appears multiple times in this import`
                    });
                    results.failed++;
                    continue;
                }

                // Add to batch tracking
                batchNames.add(toolNameLower);
                batchSlugs.add(slug);

                // Helper to parse JSON safely
                const parseJSON = (val: any, defaultVal: any) => {
                    if (!val) return defaultVal;
                    if (typeof val !== 'string') return val;
                    try { return JSON.parse(val); } catch { return defaultVal; }
                };

                // Helper for arrays
                const parseArray = (val: any) => {
                    if (Array.isArray(val)) return val;
                    if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean);
                    return [];
                };

                // Helper for dates - normalize to YYYY-MM-DD format
                // Only accepts: ISO format (YYYY-MM-DD) or year-only (YYYY)
                // Rejects ambiguous formats like DD-MM-YYYY or MM-DD-YYYY
                const formatDate = (d: string): string => {
                    if (!d) return '';

                    // Strip time portion first
                    const dateStr = d.split('T')[0].split(' ')[0].trim();

                    // Accept ISO format: YYYY-MM-DD
                    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                        return dateStr;
                    }

                    // Accept year-only format: YYYY
                    if (/^\d{4}$/.test(dateStr)) {
                        return `${dateStr}-01-01`;
                    }

                    // Reject ambiguous formats (DD-MM-YYYY, MM-DD-YYYY, etc.)
                    // Log warning but return empty to avoid silent misinterpretation
                    if (/^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}$/.test(dateStr)) {
                        console.warn(`[Bulk Import] Ambiguous date format rejected: "${dateStr}". Use ISO format YYYY-MM-DD.`);
                        return '';
                    }

                    return dateStr;
                };

                // Helper for FAQ - supports JSON, "Q::A;;Q::A" format, and legacy "Q|A|Q|A" format
                const parseFAQ = (val: any): { question: string; answer: string }[] => {
                    if (!val) return [];
                    if (Array.isArray(val)) return val;
                    if (typeof val !== 'string') return [];

                    // Try JSON first
                    try {
                        const parsed = JSON.parse(val);
                        if (Array.isArray(parsed)) return parsed;
                    } catch { /* not JSON */ }

                    // Try "Q::A;;Q::A" format (preferred)
                    if (val.includes('::') && val.includes(';;')) {
                        return val.split(';;').map((pair: string) => {
                            const [question, answer] = pair.split('::');
                            return { question: question?.trim() || '', answer: answer?.trim() || '' };
                        }).filter((faq: { question: string; answer: string }) => faq.question && faq.answer);
                    }

                    // Try "Q::A" format (single FAQ)
                    if (val.includes('::')) {
                        const [question, answer] = val.split('::');
                        if (question && answer) {
                            return [{ question: question.trim(), answer: answer.trim() }];
                        }
                    }

                    // Legacy "Q|A|Q|A" format
                    if (val.includes('|')) {
                        const parts = val.split('|');
                        const faqs: { question: string; answer: string }[] = [];
                        for (let i = 0; i < parts.length - 1; i += 2) {
                            if (parts[i] && parts[i + 1]) {
                                faqs.push({ question: parts[i].trim(), answer: parts[i + 1].trim() });
                            }
                        }
                        return faqs;
                    }

                    return [];
                };

                // Helper for social links - parse "platform:url,platform:url" format
                // Uses indexOf to find first colon to avoid breaking URLs with colons
                const parseSocialLinks = (val: any): Record<string, string | null> | undefined => {
                    if (!val) return undefined;
                    if (typeof val === 'object' && !Array.isArray(val)) return val;
                    if (typeof val !== 'string') return undefined;

                    const links: Record<string, string | null> = {};
                    val.split(',').forEach((pair: string) => {
                        const colonIdx = pair.indexOf(':');
                        if (colonIdx === -1) return;

                        const platform = pair.substring(0, colonIdx).trim().toLowerCase();
                        const fullUrl = pair.substring(colonIdx + 1).trim();

                        if (platform && fullUrl) {
                            links[platform] = fullUrl;
                        }
                    });
                    return Object.keys(links).length > 0 ? links : undefined;
                };

                // Parse and match categories, tasks, and tags
                const rawCategories = parseArray(tool.categoryName || tool.category || tool.categories);
                const rawTasks = parseArray(tool.taskName || tool.task || tool.tasks);
                const rawTags = parseArray(tool.tags);

                // Match against existing records (or create new ones)
                const matchedCategories = await Promise.all(rawCategories.map(matchCategory));
                const matchedTasks = await Promise.all(rawTasks.map(matchTask));
                const matchedTags = await Promise.all(rawTags.map(matchTag));

                const toolData = {
                    name: tool.name,
                    app_username: slug,
                    summary: tool.summary || '',
                    description: tool.description || '',
                    websiteUrl: tool.websiteUrl || tool.website_url || tool.website || tool.url || '',
                    logoUrl: tool.logoUrl || tool.logo_url || '',

                    // Classification - use matched names
                    categoryName: matchedCategories,
                    taskName: matchedTasks,
                    tags: matchedTags,

                    // Pricing
                    pricing: tool.pricing || 'freemium',
                    pricingLabel: tool.pricingLabel || tool.pricing_label || '',

                    // Content - database uses core_features, not features
                    coreFeatures: parseArray(tool.coreFeatures || tool.core_features || tool.features),
                    useCases: parseArray(tool.useCases || tool.use_cases),
                    pros: parseArray(tool.pros),
                    cons: parseArray(tool.cons),
                    faq: parseFAQ(tool.faq),

                    // Media
                    images: parseArray(tool.images),
                    videos: parseArray(tool.videos),

                    // App Store Links
                    playStoreUrl: tool.playStoreUrl || tool.play_store_url || '',
                    appStoreUrl: tool.appStoreUrl || tool.app_store_url || '',

                    // Social Links - parse from "platform:url,platform:url" format
                    socialLinks: parseSocialLinks(tool.socialLinks || tool.social_links),

                    // Stats
                    rating: tool.rating ? parseFloat(tool.rating) : undefined,

                    // Meta
                    released_on: formatDate(tool.released_on || tool.releasedAt || tool.foundedDate || tool.released_at || tool.founded_date),
                    status: tool.status || 'pending',
                };

                // Validate mandatory fields
                const missingFields: string[] = [];
                if (!toolData.name) missingFields.push('name');
                if (!toolData.summary) missingFields.push('summary');
                if (!toolData.categoryName || toolData.categoryName.length === 0) missingFields.push('categories');
                if (!toolData.taskName || toolData.taskName.length === 0) missingFields.push('tasks');

                if (missingFields.length > 0) {
                    results.errors.push({
                        name: tool.name || 'Unknown',
                        error: `Missing required fields: ${missingFields.join(', ')}`
                    });
                    results.failed++;
                    continue; // Skip this tool
                }

                // Convert to DB format
                const dbTool = adminToolToDbTool(toolData as any);

                const { error: insertError } = await supabaseAdmin
                    .from('tools')
                    .insert(dbTool);

                if (insertError) {
                    if (insertError.code === '23505') {
                        results.errors.push({ name: tool.name, error: 'Duplicate tool (slug exists)' });
                        results.failed++;
                    } else {
                        results.errors.push({ name: tool.name, error: insertError.message });
                        results.failed++;
                    }
                } else {
                    results.success++;
                }
            } catch (err: any) {
                results.errors.push({ name: tool.name || 'Unknown', error: err.message });
                results.failed++;
            }
        }

        // After bulk import, recalculate category and task counts
        if (results.success > 0) {
            try {
                // Get all published tools to count categories and tasks
                const { data: allTools } = await supabaseAdmin
                    .from('tools')
                    .select('category_name, task_name')
                    .eq('status', 'published');

                // Count occurrences of each category
                const categoryCounts = new Map<string, number>();
                const taskCounts = new Map<string, number>();

                (allTools || []).forEach(t => {
                    // Count categories
                    const categories = Array.isArray(t.category_name)
                        ? t.category_name
                        : (t.category_name ? [t.category_name] : []);
                    categories.forEach((cat: string) => {
                        categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
                    });

                    // Count tasks
                    const tasks = Array.isArray(t.task_name)
                        ? t.task_name
                        : (t.task_name ? [t.task_name] : []);
                    tasks.forEach((task: string) => {
                        taskCounts.set(task, (taskCounts.get(task) || 0) + 1);
                    });
                });

                // Update category counts
                for (const [categoryName, count] of categoryCounts) {
                    await supabaseAdmin
                        .from('categories')
                        .update({ count })
                        .eq('category_name', categoryName);
                }

                // Update task counts
                for (const [taskName, count] of taskCounts) {
                    await supabaseAdmin
                        .from('tasks')
                        .update({ count })
                        .eq('task_name', taskName);
                }

                // Reset counts for categories/tasks not in use
                // Using parameterized array instead of string interpolation to prevent SQL injection
                const allCategoryNames = Array.from(categoryCounts.keys());
                const allTaskNames = Array.from(taskCounts.keys());

                // First reset all counts to 0, then we've already updated the ones in use above
                // This is safer than using .not() with user-provided values
                if (allCategoryNames.length > 0) {
                    // Get all category names that are NOT in our list and reset them
                    const { data: categoriesToReset } = await supabaseAdmin
                        .from('categories')
                        .select('id, category_name')
                        .not('category_name', 'in', `(${allCategoryNames.map(() => '?').join(',')})`);

                    // Reset counts for categories not in the active list
                    for (const cat of (categoriesToReset || [])) {
                        if (!allCategoryNames.includes(cat.category_name)) {
                            await supabaseAdmin
                                .from('categories')
                                .update({ count: 0 })
                                .eq('id', cat.id);
                        }
                    }
                }

                if (allTaskNames.length > 0) {
                    // Get all task names that are NOT in our list and reset them
                    const { data: tasksToReset } = await supabaseAdmin
                        .from('tasks')
                        .select('id, task_name')
                        .not('task_name', 'in', `(${allTaskNames.map(() => '?').join(',')})`);

                    // Reset counts for tasks not in the active list
                    for (const task of (tasksToReset || [])) {
                        if (!allTaskNames.includes(task.task_name)) {
                            await supabaseAdmin
                                .from('tasks')
                                .update({ count: 0 })
                                .eq('id', task.id);
                        }
                    }
                }
            } catch (countError) {
                console.error('[Bulk Import] Failed to update counts:', countError);
                // Don't fail the import if count update fails
            }
        }

        return NextResponse.json({
            message: `Imported ${results.success} tools successfully. ${results.failed} failed.`,
            ...results
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Failed to import tools' }, { status: 500 });
    }
}

/**
 * GET /api/tools/bulk/template
 * Returns CSV template with updated headers
 */
export async function GET() {
    const headers = [
        'name', 'summary', 'description', 'websiteUrl', 'logoUrl',
        'pricing', 'pricingLabel', 'categories', 'tasks', 'tags',
        'features', 'coreFeatures', 'useCases', 'pros', 'cons',
        'rating', 'faq', 'released_on', 'status'
    ].join(',');

    const exampleRow = [
        '"Example Tool"',
        '"AI for everything"',
        '"Full description here..."',
        '"https://example.com"',
        '""',
        '"freemium"',
        '"Free to try"',
        '"Productivity|AI"',
        '"Writing"',
        '"ai|productivity"',
        '"Text Gen|Cloud Sync"',
        '"Feature 1|Feature 2"',
        '"Use case 1|Use case 2"',
        '"Pro 1|Pro 2"',
        '"Con 1|Con 2"',
        '"4.8"',
        '"[]"',
        '"2023-01-01"',
        '"pending"'
    ].join(',');

    const csvTemplate = `${headers}\n${exampleRow}`;

    return new NextResponse(csvTemplate, {
        headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': 'attachment; filename="tools-import-template.csv"'
        }
    });
}
