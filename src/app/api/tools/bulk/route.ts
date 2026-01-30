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

        // Process each tool
        for (const tool of tools) {
            try {
                // Generate slug from name if not provided
                const slug = tool.slug || tool.name
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)/g, '');

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

                // Helper for dates (strip time)
                const formatDate = (d: string) => {
                    if (!d) return '';
                    // Handle "YYYY-MM-DD HH:mm:ss" -> "YYYY-MM-DD"
                    return d.split('T')[0].split(' ')[0];
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
                const parseSocialLinks = (val: any): Record<string, string | null> | undefined => {
                    if (!val) return undefined;
                    if (typeof val === 'object' && !Array.isArray(val)) return val;
                    if (typeof val !== 'string') return undefined;

                    const links: Record<string, string | null> = {};
                    val.split(',').forEach((pair: string) => {
                        const [platform, url] = pair.split(':').map(s => s.trim());
                        if (platform && url) {
                            // Reconstruct URL if it was split (e.g., "https://...")
                            const fullUrl = pair.substring(pair.indexOf(':') + 1).trim();
                            links[platform.toLowerCase()] = fullUrl;
                        }
                    });
                    return Object.keys(links).length > 0 ? links : undefined;
                };

                const toolData = {
                    name: tool.name,
                    app_username: slug,
                    summary: tool.summary || '',
                    description: tool.description || '',
                    websiteUrl: tool.websiteUrl || tool.website_url || tool.website || tool.url || '',
                    logoUrl: tool.logoUrl || tool.logo_url || '',

                    // Classification
                    categoryName: parseArray(tool.categoryName || tool.category || tool.categories),
                    taskName: parseArray(tool.taskName || tool.task || tool.tasks),
                    tags: parseArray(tool.tags),

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
