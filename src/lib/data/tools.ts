/**
 * Tool Fetching Functions (SERVER-ONLY)
 *
 * Uses supabaseAdmin to bypass RLS — these functions are only called
 * from Next.js server components (page.tsx) and never from client code.
 */

import 'server-only';

import { supabaseAdmin, dbToolToAdminTool } from '../supabase';
import { AdminTool } from '@/types';

// Card fields for list views (homepage, category, trending, etc.)
// Excludes contact info, internal notes, heavy content
const TOOL_CARD_FIELDS = `
    id, name, app_username, logo_url, summary,
    category_name, task_name, tags,
    pricing, pricing_label, save_count, view_count, rating,
    is_featured, listing_type, status,
    spotlight_enabled, spotlight_position, trending_position,
    created_at, updated_at, launched_on
`;

// Detail fields for single tool page (/app/[slug])
// Includes content fields but excludes contact info and internal notes
const TOOL_DETAIL_FIELDS = `
    id, name, app_username, logo_url, summary, description,
    category_name, task_name, tags,
    pricing, pricing_label, save_count, view_count, upvotes, downvotes, rating,
    is_featured, listing_type, status,
    website_url, affiliate_url, affiliate_enabled,
    images, videos, play_store_url, app_store_url, social_links,
    core_features, use_cases, pros, cons, faq,
    pricing_tiers, has_free_trial, free_trial_days, discount, billing_frequency,
    version_history, alternative_tools, tool_references,
    spotlight_enabled, spotlight_position, trending_position,
    back_links, is_ai_generated, is_reposted,
    created_at, updated_at, launched_on
`;



/**
 * Fetch a page of published tools (for sitemap pagination).
 */
export async function getPublishedToolsRange(offset: number, limit: number): Promise<AdminTool[]> {
    const { data, error } = await supabaseAdmin
        .from('tools')
        .select(TOOL_CARD_FIELDS)
        .in('status', ['published', 'approved'])
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        console.error('Error fetching published tools range:', error);
        return [];
    }
    return (data || []).map(tool => dbToolToAdminTool(tool)) as AdminTool[];
}

/**
 * Fetch spotlight/featured tools for homepage
 */
export async function getSpotlightTools(limit: number = 8): Promise<AdminTool[]> {
    const { data, error } = await supabaseAdmin
        .from('tools')
        .select(TOOL_CARD_FIELDS)
        .in('status', ['published', 'approved'])
        .eq('spotlight_enabled', true)
        .order('spotlight_position', { ascending: true })
        .limit(limit);

    if (error) {
        console.error('Error fetching spotlight tools:', error);
        return [];
    }

    return (data || []).map(tool => dbToolToAdminTool(tool)) as AdminTool[];
}

/**
 * Fetch recently released tools (limited set for homepage)
 */
export async function getRecentlyReleasedTools(limit: number = 20): Promise<AdminTool[]> {
    const { data, error } = await supabaseAdmin
        .from('tools')
        .select(TOOL_CARD_FIELDS)
        .in('status', ['published', 'approved'])
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching recently released tools:', error);
        return [];
    }

    return (data || []).map(tool => dbToolToAdminTool(tool)) as AdminTool[];
}

/**
 * Fetch trending tools (Manual positions)
 */
export async function getTrendingTools(limit: number = 100): Promise<AdminTool[]> {
    const { data, error } = await supabaseAdmin
        .from('tools')
        .select(TOOL_CARD_FIELDS)
        .in('status', ['published', 'approved'])
        .gt('trending_position', 0)
        .order('trending_position', { ascending: true })
        .limit(limit);

    if (error) {
        console.error('Error fetching trending tools:', error);
        return [];
    }

    return (data || []).map(tool => dbToolToAdminTool(tool)) as AdminTool[];
}

/**
 * Fetch tools by category name
 */
export async function getToolsByCategory(categoryName: string, limit: number = 100): Promise<AdminTool[]> {
    const { data, error } = await supabaseAdmin
        .from('tools')
        .select(TOOL_CARD_FIELDS)
        .in('status', ['published', 'approved'])
        .contains('category_name', [categoryName])
        .order('save_count', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching tools by category:', error);
        return [];
    }

    return (data || []).map(tool => dbToolToAdminTool(tool)) as AdminTool[];
}

/**
 * Fetch tools by task name
 */
export async function getToolsByTask(taskName: string, limit: number = 100): Promise<AdminTool[]> {
    const { data, error } = await supabaseAdmin
        .from('tools')
        .select(TOOL_CARD_FIELDS)
        .in('status', ['published', 'approved'])
        .contains('task_name', [taskName])
        .order('save_count', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching tools by task:', error);
        return [];
    }

    return (data || []).map(tool => dbToolToAdminTool(tool)) as AdminTool[];
}

/**
 * Fetch a single published tool by app_username
 */
export async function getToolByAppUsername(appUsername: string): Promise<AdminTool | null> {
    const { data, error } = await supabaseAdmin
        .from('tools')
        .select(TOOL_DETAIL_FIELDS)
        .eq('app_username', appUsername)
        .in('status', ['published', 'approved'])
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            return null;
        }
        console.error('Error fetching tool:', error);
        return null;
    }

    return dbToolToAdminTool(data) as AdminTool;
}

/**
 * Fetch homepage settings
 */
export async function getHomeSettings() {
    const { data, error } = await supabaseAdmin
        .from('settings')
        .select('*')
        .eq('id', 1)
        .single();

    if (error) {
        return {
            spotlightCount: 8,
            showSpotlightOnHome: true,
            showCategoriesOnHome: true,
            showTasksOnHome: true,
            showTop10OnHome: false,
            showFeaturedAlternatives: true,
        };
    }

    return {
        spotlightCount: data.spotlight_count,
        showSpotlightOnHome: data.show_spotlight_on_home,
        showCategoriesOnHome: data.show_categories_on_home,
        showTasksOnHome: data.show_tasks_on_home,
        showTop10OnHome: data.show_top10_on_home,
        showFeaturedAlternatives: data.show_featured_alternatives ?? true,
    };
}

/**
 * Fetch featured tools (sorted by save count)
 */
export async function getFeaturedTools(excludeSlug?: string, limit: number = 6): Promise<AdminTool[]> {
    let query = supabaseAdmin
        .from('tools')
        .select(TOOL_CARD_FIELDS)
        .in('status', ['published', 'approved'])
        .order('save_count', { ascending: false })
        .limit(limit + (excludeSlug ? 1 : 0));

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching featured tools:', error);
        return [];
    }

    let tools = (data || []).map(tool => dbToolToAdminTool(tool)) as AdminTool[];

    if (excludeSlug) {
        tools = tools.filter(t => t.appUsername !== excludeSlug).slice(0, limit);
    }

    return tools;
}

/**
 * Fetch recently added tools
 */
export async function getRecentlyAddedTools(excludeSlug?: string, limit: number = 5): Promise<AdminTool[]> {
    let query = supabaseAdmin
        .from('tools')
        .select(TOOL_CARD_FIELDS)
        .in('status', ['published', 'approved'])
        .order('created_at', { ascending: false })
        .limit(limit + (excludeSlug ? 1 : 0));

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching recently added tools:', error);
        return [];
    }

    let tools = (data || []).map(tool => dbToolToAdminTool(tool)) as AdminTool[];

    if (excludeSlug) {
        tools = tools.filter(t => t.appUsername !== excludeSlug).slice(0, limit);
    }

    return tools;
}

/**
 * Fetch tool names by app_username slugs (for SEO metadata)
 */
export async function getToolNamesBySlugs(slugs: string[], limit: number = 5): Promise<string[]> {
    if (slugs.length === 0) return [];

    const requested = slugs.slice(0, limit);
    const { data, error } = await supabaseAdmin
        .from('tools')
        .select('name, app_username')
        .in('app_username', requested)
        .in('status', ['published', 'approved']);

    if (error) {
        console.error('Error fetching tool names:', error);
        return [];
    }

    // Build a Map and return in the same order as input slugs
    const bySlug = new Map((data || []).map(t => [t.app_username, t.name]));
    return requested.map(slug => bySlug.get(slug)).filter((n): n is string => !!n);
}
