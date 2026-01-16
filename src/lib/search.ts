import { AITool } from '@/types';

interface SearchResult {
    tool: AITool;
    score: number;
    matchType: 'name' | 'category' | 'task' | 'tag' | 'content';
}

/**
 * Calculate similarity between two strings (Levenshtein distance based)
 * Returns a score from 0 to 1 (1 = exact match)
 */
function similarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();

    if (s1 === s2) return 1;
    if (s1.length === 0 || s2.length === 0) return 0;

    // For very short strings, be more strict
    if (s1.length < 3 || s2.length < 3) {
        return s1.includes(s2) || s2.includes(s1) ? 0.8 : 0;
    }

    const len1 = s1.length;
    const len2 = s2.length;
    const maxLen = Math.max(len1, len2);

    // Create distance matrix
    const matrix: number[][] = [];
    for (let i = 0; i <= len1; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
        matrix[0][j] = j;
    }

    // Fill in the rest of the matrix
    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,      // deletion
                matrix[i][j - 1] + 1,      // insertion
                matrix[i - 1][j - 1] + cost // substitution
            );
        }
    }

    const distance = matrix[len1][len2];
    return 1 - (distance / maxLen);
}

/**
 * Check if query matches with typo tolerance
 */
function fuzzyMatch(text: string, query: string, threshold: number = 0.7): boolean {
    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();

    // Direct match
    if (textLower.includes(queryLower)) return true;

    // Check each word in text against query
    const textWords = textLower.split(/\s+/);
    const queryWords = queryLower.split(/\s+/);

    // Check if any query word fuzzy matches any text word
    for (const qWord of queryWords) {
        if (qWord.length < 3) continue; // Skip very short words

        for (const tWord of textWords) {
            if (tWord.length < 3) continue;

            const sim = similarity(qWord, tWord);
            if (sim >= threshold) return true;
        }

        // Also check if query word is similar to the full text
        if (similarity(qWord, textLower) >= threshold) return true;
    }

    return false;
}

/**
 * Priority-based search algorithm for AI tools with fuzzy matching
 * 
 * Priority order:
 * 1. Exact name match (highest score)
 * 2. Name contains query
 * 3. Name fuzzy match (typo tolerance)
 * 4. Category matches
 * 5. Task matches
 * 6. Tag matches
 * 7. Description/content matches (lowest score)
 * 
 * Results are sorted by score (highest first)
 */
export function searchTools(tools: AITool[], query: string): AITool[] {
    if (!query || query.trim().length === 0) {
        return [];
    }

    // Check if searching by hashtag
    const isHashtagSearch = query.trim().startsWith('#');
    const normalizedQuery = query.toLowerCase().trim().replace(/^#/, ''); // Remove leading #
    const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 0);
    const results: SearchResult[] = [];

    for (const tool of tools) {
        let score = 0;
        let matchType: SearchResult['matchType'] = 'content';

        const toolName = (tool.name || '').toLowerCase();
        const categories = (tool.categoryName || []).map(c => c.toLowerCase());
        const tasks = (tool.taskName || []).map(t => t.toLowerCase());
        // Use type assertion for tags since AITool interface may not include it
        const tags = ((tool as AITool & { tags?: string[] }).tags || []).map(t => t.toLowerCase());
        const description = (tool.description || '').toLowerCase();
        const summary = (tool.summary || '').toLowerCase();

        // If hashtag search, prioritize tags
        if (isHashtagSearch) {
            // Priority 1 for hashtag: Exact tag match (score: 1000)
            if (tags.some((tag: string) => tag === normalizedQuery)) {
                score = 1000;
                matchType = 'tag';
            }
            // Priority 2 for hashtag: Tag starts with query (score: 800)
            else if (tags.some((tag: string) => tag.startsWith(normalizedQuery))) {
                score = 800;
                matchType = 'tag';
            }
            // Priority 3 for hashtag: Tag contains query (score: 600)
            else if (tags.some((tag: string) => tag.includes(normalizedQuery))) {
                score = 600;
                matchType = 'tag';
            }
            // Priority 4 for hashtag: Tag fuzzy match (score: 400)
            else if (tags.some((tag: string) => fuzzyMatch(tag, normalizedQuery, 0.7))) {
                score = 400;
                matchType = 'tag';
            }
            // Also check name, category, task for the tag query
            else if (toolName.includes(normalizedQuery)) {
                score = 200;
                matchType = 'name';
            }
            else if (categories.some(cat => cat.includes(normalizedQuery))) {
                score = 150;
                matchType = 'category';
            }
            else if (tasks.some(task => task.includes(normalizedQuery))) {
                score = 100;
                matchType = 'task';
            }
        } else {
            // Normal search (existing logic)
            // Priority 1: Exact name match (score: 1000)
            if (toolName === normalizedQuery) {
                score = 1000;
                matchType = 'name';
            }
            // Priority 2: Name starts with query (score: 800)
            else if (toolName.startsWith(normalizedQuery)) {
                score = 800;
                matchType = 'name';
            }
            // Priority 3: Name contains query (score: 600)
            else if (toolName.includes(normalizedQuery)) {
                score = 600;
                matchType = 'name';
            }
            // Priority 4: Name contains all query words (score: 500)
            else if (queryWords.every(word => toolName.includes(word))) {
                score = 500;
                matchType = 'name';
            }
            // Priority 5: Name fuzzy match - typo tolerance (score: 450)
            else if (fuzzyMatch(toolName, normalizedQuery, 0.75)) {
                score = 450;
                matchType = 'name';
            }
            // Priority 6: Category exact match (score: 400)
            else if (categories.some(cat => cat === normalizedQuery)) {
                score = 400;
                matchType = 'category';
            }
            // Priority 7: Category contains query (score: 350)
            else if (categories.some(cat => cat.includes(normalizedQuery) || normalizedQuery.includes(cat))) {
                score = 350;
                matchType = 'category';
            }
            // Priority 8: Category fuzzy match (score: 320)
            else if (categories.some(cat => fuzzyMatch(cat, normalizedQuery, 0.7))) {
                score = 320;
                matchType = 'category';
            }
            // Priority 9: Task exact match (score: 300)
            else if (tasks.some(task => task === normalizedQuery)) {
                score = 300;
                matchType = 'task';
            }
            // Priority 10: Task contains query (score: 250)
            else if (tasks.some(task => task.includes(normalizedQuery) || normalizedQuery.includes(task))) {
                score = 250;
                matchType = 'task';
            }
            // Priority 11: Task fuzzy match (score: 220)
            else if (tasks.some(task => fuzzyMatch(task, normalizedQuery, 0.7))) {
                score = 220;
                matchType = 'task';
            }
            // Priority 12: Tag match (score: 200)
            else if (tags.some((tag: string) => tag.includes(normalizedQuery) || fuzzyMatch(tag, normalizedQuery, 0.7))) {
                score = 200;
                matchType = 'tag';
            }
            // Priority 13: Summary contains query (score: 150)
            else if (summary.includes(normalizedQuery) || fuzzyMatch(summary, normalizedQuery, 0.8)) {
                score = 150;
                matchType = 'content';
            }
            // Priority 14: Description contains all query words (score: 100)
            else if (queryWords.every(word => description.includes(word) || summary.includes(word))) {
                score = 100;
                matchType = 'content';
            }
            // Priority 15: Description contains any query word (score: 50)
            else if (queryWords.some(word => description.includes(word) || summary.includes(word))) {
                score = 50;
                matchType = 'content';
            }
            // Priority 16: Fuzzy match on description words (score: 25)
            else if (queryWords.some(word => word.length >= 4 && fuzzyMatch(description, word, 0.75))) {
                score = 25;
                matchType = 'content';
            }
        }

        // Boost score based on additional matches
        if (score > 0) {
            // Bonus for category match even if already matched by name
            if (matchType === 'name' && categories.some(cat => cat.includes(normalizedQuery) || fuzzyMatch(cat, normalizedQuery, 0.7))) {
                score += 50;
            }
            // Bonus for task match even if already matched by name
            if (matchType === 'name' && tasks.some(task => task.includes(normalizedQuery) || fuzzyMatch(task, normalizedQuery, 0.7))) {
                score += 50;
            }
            // Bonus for featured tools
            if (tool.isFeatured) {
                score += 25;
            }
            // Bonus for higher save count (popularity)
            score += Math.min(tool.saveCount, 50);

            results.push({ tool, score, matchType });
        }
    }

    // Sort by score (highest first), then by name alphabetically
    results.sort((a, b) => {
        if (b.score !== a.score) {
            return b.score - a.score;
        }
        return (a.tool.name || '').localeCompare(b.tool.name || '');
    });

    return results.map(r => r.tool);
}

/**
 * Quick search for dropdown suggestions (limited results, faster)
 */
export function quickSearchTools(tools: AITool[], query: string, limit: number = 6): AITool[] {
    const results = searchTools(tools, query);
    return results.slice(0, limit);
}

