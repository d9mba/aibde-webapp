import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Generate dynamic metadata for SEO/Browser Tab
export async function generateMetadata({
    params,
}: {
    params: Promise<{ id: string }>;
}): Promise<Metadata> {
    const p = await params;
    const id = p.id;

    // Handle 'new' route
    if (id === 'new') {
        return {
            title: 'Add New Tool - Dashboard | BrowseForAI',
        };
    }

    // Skip DB query for malformed IDs
    if (!UUID_RE.test(id)) {
        return { title: 'Edit Tool - Dashboard | BrowseForAI' };
    }

    try {
        const { data: tool, error } = await supabaseAdmin
            .from('tools')
            .select('name')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Failed to fetch tool name for metadata:', error, { id });
        } else if (tool?.name) {
            return {
                title: `${tool.name} - Edit Tool | BrowseForAI`,
            };
        }
    } catch (e) {
        // Fallback on error
        console.error('Failed to fetch tool name for metadata', e);
    }

    return {
        title: 'Edit Tool - Dashboard | BrowseForAI',
    };
}

export default function EditToolLayout({
    children,
}: {
    children: ReactNode;
}) {
    return <>{children}</>;
}
