import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin, adminToolToDbTool } from '@/lib/supabase';
import { requireAdmin, isAuthError } from '@/lib/auth-utils';

// Helper to convert value to array
function toArray<T>(value: T | T[] | null | undefined): T[] {
    if (Array.isArray(value)) return value;
    if (value != null) return [value];
    return [];
}

/**
 * PUT /api/tools/bulk-update
 * Bulk upsert tools from CSV data
 * - Updates existing tools (matched by 'id' or 'app_username')
 * - Creates new tools if not found
 */
export async function PUT(request: NextRequest) {
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

        if (tools.length > 200) {
            return NextResponse.json({ error: 'Maximum 200 tools per operation' }, { status: 400 });
        }

        const results = {
            updated: 0,
            created: 0,
            failed: 0,
            skipped: 0,
            errors: [] as { name: string; error: string }[]
        };

        // Fetch existing categories, tasks, tags for matching
        const [categoriesResult, tasksResult, tagsResult] = await Promise.all([
            supabaseAdmin.from('categories').select('id, category_name'),
            supabaseAdmin.from('tasks').select('id, task_name'),
            supabaseAdmin.from('tags').select('id, tag_name')
        ]);

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

        // Helper functions
        const matchCategory = async (name: string): Promise<string> => {
            const lowerName = name.toLowerCase().trim();
            if (categoryMap.has(lowerName)) return categoryMap.get(lowerName)!;
            const { data, error } = await supabaseAdmin
                .from('categories')
                .insert({ category_name: name.trim(), count: 0 })
                .select('category_name')
                .single();
            if (!error && data) {
                categoryMap.set(lowerName, data.category_name);
                return data.category_name;
            }
            return name.trim();
        };

        const matchTask = async (name: string): Promise<string> => {
            const lowerName = name.toLowerCase().trim();
            if (taskMap.has(lowerName)) return taskMap.get(lowerName)!;
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

        const matchTag = async (name: string): Promise<string> => {
            const lowerName = name.toLowerCase().trim();
            if (tagMap.has(lowerName)) return tagMap.get(lowerName)!;
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

        const parseArray = (val: any): string[] | undefined => {
            if (Array.isArray(val)) return val;
            if (typeof val === 'string' && val.trim()) return val.split(',').map(s => s.trim()).filter(Boolean);
            return undefined;
        };

        const formatDate = (d: string): string => {
            if (!d) return '';
            let dateStr = d.split('T')[0].split(' ')[0];
            const ddmmyyyyMatch = dateStr.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
            if (ddmmyyyyMatch) {
                const [, day, month, year] = ddmmyyyyMatch;
                return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
            if (/^\d{4}$/.test(dateStr)) return `${dateStr}-01-01`;
            return dateStr;
        };

        const parseFAQ = (val: any): { question: string; answer: string }[] | undefined => {
            if (!val) return undefined;
            if (Array.isArray(val)) return val;
            if (typeof val !== 'string') return undefined;
            try {
                const parsed = JSON.parse(val);
                if (Array.isArray(parsed)) return parsed;
            } catch { /* not JSON */ }
            if (val.includes('::') && val.includes(';;')) {
                return val.split(';;').map((pair: string) => {
                    const [question, answer] = pair.split('::');
                    return { question: question?.trim() || '', answer: answer?.trim() || '' };
                }).filter((faq: { question: string; answer: string }) => faq.question && faq.answer);
            }
            if (val.includes('::')) {
                const [question, answer] = val.split('::');
                if (question && answer) return [{ question: question.trim(), answer: answer.trim() }];
            }
            return undefined;
        };

        const parseSocialLinks = (val: any): Record<string, string | null> | undefined => {
            if (!val) return undefined;
            if (typeof val === 'object' && !Array.isArray(val)) return val;
            if (typeof val !== 'string') return undefined;
            const links: Record<string, string | null> = {};
            val.split(',').forEach((pair: string) => {
                const colonIdx = pair.indexOf(':');
                if (colonIdx > 0) {
                    const platform = pair.substring(0, colonIdx).trim().toLowerCase();
                    const url = pair.substring(colonIdx + 1).trim();
                    if (platform && url) links[platform] = url;
                }
            });
            return Object.keys(links).length > 0 ? links : undefined;
        };

        // Process each tool
        for (const tool of tools) {
            try {
                const toolId = tool.id;
                const appUsername = tool.app_username || tool.slug;

                // Try to find existing tool
                let existingTool = null;
                if (toolId) {
                    const { data } = await supabaseAdmin
                        .from('tools')
                        .select('id')
                        .eq('id', toolId)
                        .single();
                    existingTool = data;
                }
                if (!existingTool && appUsername) {
                    const { data } = await supabaseAdmin
                        .from('tools')
                        .select('id')
                        .eq('app_username', appUsername)
                        .single();
                    existingTool = data;
                }
                // Also try matching by exact name if no id/slug match
                if (!existingTool && tool.name) {
                    const { data } = await supabaseAdmin
                        .from('tools')
                        .select('id')
                        .eq('name', tool.name)
                        .single();
                    existingTool = data;
                }

                // Parse and match categories, tasks, tags
                const rawCategories = parseArray(tool.categoryName || tool.category_name || tool.categories);
                const rawTasks = parseArray(tool.taskName || tool.task_name || tool.tasks);
                const rawTags = parseArray(tool.tags);

                const matchedCategories = rawCategories ? await Promise.all(rawCategories.map(matchCategory)) : undefined;
                const matchedTasks = rawTasks ? await Promise.all(rawTasks.map(matchTask)) : undefined;
                const matchedTags = rawTags ? await Promise.all(rawTags.map(matchTag)) : undefined;

                if (existingTool) {
                    // UPDATE existing tool
                    const updateData: Record<string, any> = {};

                    if (tool.name) updateData.name = tool.name;
                    if (tool.summary !== undefined) updateData.summary = tool.summary;
                    if (tool.description !== undefined) updateData.description = tool.description;
                    if (tool.websiteUrl || tool.website_url || tool.website) {
                        updateData.websiteUrl = tool.websiteUrl || tool.website_url || tool.website;
                    }
                    if (tool.logoUrl || tool.logo_url) {
                        updateData.logoUrl = tool.logoUrl || tool.logo_url;
                    }
                    if (matchedCategories) updateData.categoryName = matchedCategories;
                    if (matchedTasks) updateData.taskName = matchedTasks;
                    if (matchedTags) updateData.tags = matchedTags;
                    if (tool.pricing) updateData.pricing = tool.pricing;
                    if (tool.pricingLabel || tool.pricing_label) {
                        updateData.pricingLabel = tool.pricingLabel || tool.pricing_label;
                    }

                    const coreFeatures = parseArray(tool.coreFeatures || tool.core_features || tool.features);
                    if (coreFeatures) updateData.coreFeatures = coreFeatures;
                    const useCases = parseArray(tool.useCases || tool.use_cases);
                    if (useCases) updateData.useCases = useCases;
                    const pros = parseArray(tool.pros);
                    if (pros) updateData.pros = pros;
                    const cons = parseArray(tool.cons);
                    if (cons) updateData.cons = cons;
                    const faq = parseFAQ(tool.faq);
                    if (faq) updateData.faq = faq;
                    const images = parseArray(tool.images);
                    if (images) updateData.images = images;
                    const videos = parseArray(tool.videos);
                    if (videos) updateData.videos = videos;
                    if (tool.playStoreUrl || tool.play_store_url) {
                        updateData.playStoreUrl = tool.playStoreUrl || tool.play_store_url;
                    }
                    if (tool.appStoreUrl || tool.app_store_url) {
                        updateData.appStoreUrl = tool.appStoreUrl || tool.app_store_url;
                    }
                    const socialLinks = parseSocialLinks(tool.socialLinks || tool.social_links);
                    if (socialLinks) updateData.socialLinks = socialLinks;
                    if (tool.rating) updateData.rating = parseFloat(tool.rating);
                    const launchedOn = tool.launched_on || tool.released_on || tool.releasedAt;
                    if (launchedOn) updateData.launched_on = formatDate(launchedOn);
                    if (tool.status) updateData.status = tool.status;

                    if (Object.keys(updateData).length === 0) {
                        results.skipped++;
                        continue;
                    }

                    const dbUpdate = adminToolToDbTool({ id: existingTool.id, ...updateData } as any);
                    delete dbUpdate.id;

                    const { error: updateError } = await supabaseAdmin
                        .from('tools')
                        .update(dbUpdate)
                        .eq('id', existingTool.id);

                    if (updateError) {
                        results.errors.push({ name: tool.name || appUsername, error: updateError.message });
                        results.failed++;
                    } else {
                        results.updated++;
                    }
                } else {
                    // CREATE new tool
                    if (!tool.name) {
                        results.errors.push({ name: 'Unknown', error: 'Missing name for new tool' });
                        results.failed++;
                        continue;
                    }

                    const slug = appUsername || tool.name
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/(^-|-$)/g, '');

                    // Validate required fields for new tools
                    const missingFields: string[] = [];
                    if (!tool.summary) missingFields.push('summary');
                    if (!matchedCategories || matchedCategories.length === 0) missingFields.push('categories');
                    if (!matchedTasks || matchedTasks.length === 0) missingFields.push('tasks');

                    if (missingFields.length > 0) {
                        results.errors.push({
                            name: tool.name,
                            error: `Missing required fields for new tool: ${missingFields.join(', ')}`
                        });
                        results.failed++;
                        continue;
                    }

                    const toolData = {
                        name: tool.name,
                        app_username: slug,
                        summary: tool.summary || '',
                        description: tool.description || '',
                        websiteUrl: tool.websiteUrl || tool.website_url || tool.website || '',
                        logoUrl: tool.logoUrl || tool.logo_url || '',
                        categoryName: matchedCategories,
                        taskName: matchedTasks,
                        tags: matchedTags || [],
                        pricing: tool.pricing || 'freemium',
                        pricingLabel: tool.pricingLabel || tool.pricing_label || '',
                        coreFeatures: parseArray(tool.coreFeatures || tool.core_features || tool.features) || [],
                        useCases: parseArray(tool.useCases || tool.use_cases) || [],
                        pros: parseArray(tool.pros) || [],
                        cons: parseArray(tool.cons) || [],
                        faq: parseFAQ(tool.faq) || [],
                        images: parseArray(tool.images) || [],
                        videos: parseArray(tool.videos) || [],
                        playStoreUrl: tool.playStoreUrl || tool.play_store_url || '',
                        appStoreUrl: tool.appStoreUrl || tool.app_store_url || '',
                        socialLinks: parseSocialLinks(tool.socialLinks || tool.social_links),
                        rating: tool.rating ? parseFloat(tool.rating) : undefined,
                        launched_on: formatDate(tool.launched_on || tool.released_on || tool.releasedAt || ''),
                        status: tool.status || 'pending',
                    };

                    const dbTool = adminToolToDbTool(toolData as any);

                    const { error: insertError } = await supabaseAdmin
                        .from('tools')
                        .insert(dbTool);

                    if (insertError) {
                        if (insertError.code === '23505') {
                            results.errors.push({ name: tool.name, error: 'Duplicate tool (slug exists)' });
                        } else {
                            results.errors.push({ name: tool.name, error: insertError.message });
                        }
                        results.failed++;
                    } else {
                        results.created++;
                    }
                }
            } catch (err: any) {
                results.errors.push({ name: tool.name || 'Unknown', error: err.message });
                results.failed++;
            }
        }

        // Recalculate counts
        if (results.updated > 0 || results.created > 0) {
            try {
                const { data: allTools } = await supabaseAdmin
                    .from('tools')
                    .select('category_name, task_name')
                    .eq('status', 'published');

                const categoryCounts = new Map<string, number>();
                const taskCounts = new Map<string, number>();

                (allTools || []).forEach(t => {
                    const categories = toArray(t.category_name);
                    categories.forEach((cat: string) => categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1));
                    const tasks = toArray(t.task_name);
                    tasks.forEach((task: string) => taskCounts.set(task, (taskCounts.get(task) || 0) + 1));
                });

                for (const [categoryName, count] of categoryCounts) {
                    await supabaseAdmin.from('categories').update({ count }).eq('category_name', categoryName);
                }
                for (const [taskName, count] of taskCounts) {
                    await supabaseAdmin.from('tasks').update({ count }).eq('task_name', taskName);
                }
            } catch (countError) {
                console.error('[Bulk Upsert] Failed to update counts:', countError);
            }
        }

        // Bust ISR cache so changes appear instantly
        if (results.updated > 0 || results.created > 0) {
            revalidatePath('/');
            revalidatePath('/new');
            revalidatePath('/trending');
        }

        return NextResponse.json({
            message: `Updated ${results.updated}, created ${results.created} tools. ${results.failed} failed. ${results.skipped} skipped.`,
            success: results.updated + results.created,
            ...results
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Failed to process tools' }, { status: 500 });
    }
}
