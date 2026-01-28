/**
 * Related and Suggested Tools
 * Find similar tools based on categories, tasks, and tags
 */

import { supabase, dbToolToAdminTool } from '../supabase';
import { AdminTool } from '@/types';

/**
 * Fetch related/alternative tools for a specific tool
 * Based on shared categories and tasks
 */
export async function getRelatedTools(tool: AdminTool, limit: number = 6): Promise<AdminTool[]> {
    const categories = tool.categoryName || [];
    const tasks = tool.taskName || [];
    const manualSlugs = tool.alternativeTools || [];

    if (categories.length === 0 && tasks.length === 0 && manualSlugs.length === 0) {
        return [];
    }

    let query = supabase
        .from('tools')
        .select('*')
        .in('status', ['published', 'approved'])
        .neq('app_username', tool.slug)
        .limit(limit * 3);

    if (categories.length > 0 || tasks.length > 0) {
        query = query.or(
            categories.length > 0 && tasks.length > 0
                ? `category_name.ov.{${categories.join(',')}},task_name.ov.{${tasks.join(',')}}`
                : categories.length > 0
                    ? `category_name.ov.{${categories.join(',')}}`
                    : `task_name.ov.{${tasks.join(',')}}`
        );
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching related tools:', error);
        return [];
    }

    const tools = (data || []).map(t => dbToolToAdminTool(t)) as AdminTool[];
    const manual = tools.filter(t => manualSlugs.includes(t.slug));
    const auto = tools
        .filter(t => !manualSlugs.includes(t.slug))
        .slice(0, limit - manual.length);

    return [...manual, ...auto].slice(0, limit);
}

/**
 * Fetch suggested tools based on tags, categories, tasks
 */
export async function getSuggestedTools(tool: AdminTool, limit: number = 6): Promise<AdminTool[]> {
    const categories = tool.categoryName || [];
    const tasks = tool.taskName || [];
    const tags = tool.tags || [];
    const alternativeSlugs = tool.alternativeTools || [];

    const queries: Promise<any[]>[] = [];

    if (categories.length > 0) {
        queries.push(
            Promise.resolve(
                supabase
                    .from('tools')
                    .select('*')
                    .in('status', ['published', 'approved'])
                    .neq('app_username', tool.slug)
                    .overlaps('category_name', categories)
                    .limit(limit * 5)
                    .then(r => (r.data || []).map(t => ({ ...t, _matchType: 'category' })))
            )
        );
    }

    if (tasks.length > 0) {
        queries.push(
            Promise.resolve(
                supabase
                    .from('tools')
                    .select('*')
                    .in('status', ['published', 'approved'])
                    .neq('app_username', tool.slug)
                    .overlaps('task_name', tasks)
                    .limit(limit * 5)
                    .then(r => (r.data || []).map(t => ({ ...t, _matchType: 'task' })))
            )
        );
    }

    if (tags.length > 0) {
        queries.push(
            Promise.resolve(
                supabase
                    .from('tools')
                    .select('*')
                    .in('status', ['published', 'approved'])
                    .neq('app_username', tool.slug)
                    .overlaps('tags', tags)
                    .limit(limit * 5)
                    .then(r => (r.data || []).map(t => ({ ...t, _matchType: 'tag' })))
            )
        );
    }

    if (queries.length === 0) {
        return [];
    }

    const results = await Promise.all(queries);
    const allMatches = results.flat();

    const toolMap = new Map<string, { tool: any, score: number }>();

    function getMatchScore(matchType: string): number {
        switch (matchType) {
            case 'category': return 5;
            case 'task': return 4;
            case 'tag': return 3;
            default: return 1;
        }
    }

    allMatches.forEach(t => {
        const existing = toolMap.get(t.app_username);
        const matchScore = getMatchScore(t._matchType);

        if (existing) {
            existing.score += matchScore;
        } else {
            toolMap.set(t.app_username, { tool: t, score: matchScore });
        }
    });

    const scored = Array.from(toolMap.values())
        .filter(s => !alternativeSlugs.includes(s.tool.app_username))
        .map(s => ({ ...s, random: Math.random() }))
        .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return a.random - b.random;
        });

    return scored.slice(0, limit).map(s => dbToolToAdminTool(s.tool));
}
