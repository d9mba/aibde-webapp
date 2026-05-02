/**
 * Auto-link tool mentions in blog content.
 *
 * Scans text for known tool names and wraps them in internal links
 * pointing to /app/[slug]. Only links the first occurrence of each tool.
 */

export interface ToolRef {
    name: string;
    slug: string;
}

/** Replace tool names with internal links in HTML content */
export function linkToolMentions(html: string, tools: ToolRef[]): string {
    if (!tools.length || !html) return html;

    // Sort by name length descending to match longer names first
    const sorted = [...tools].sort((a, b) => b.name.length - a.name.length);
    let result = html;
    const linked = new Set<string>();

    for (const tool of sorted) {
        if (linked.has(tool.slug)) continue;

        // Match tool name not already inside an <a> tag or href attribute
        // Uses word boundaries and case-insensitive matching
        const escaped = tool.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(
            `(?<!<a[^>]*>.*?)(?<!href=["'][^"']*?)\\b(${escaped})\\b(?![^<]*<\\/a>)`,
            'i'
        );

        const match = result.match(regex);
        if (match && match.index !== undefined) {
            const before = result.slice(0, match.index);
            const after = result.slice(match.index + match[0].length);
            result = `${before}<a href="/app/${tool.slug}" class="blog-tool-link">${match[0]}</a>${after}`;
            linked.add(tool.slug);
        }
    }

    return result;
}

/** Extract plain text tool names from content for auto-detection */
export function detectToolMentions(content: string, tools: ToolRef[]): string[] {
    const mentioned: string[] = [];
    const lower = content.toLowerCase();

    for (const tool of tools) {
        if (lower.includes(tool.name.toLowerCase())) {
            mentioned.push(tool.slug);
        }
    }

    return mentioned;
}
