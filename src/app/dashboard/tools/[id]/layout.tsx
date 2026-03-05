import { Metadata } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

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
            title: 'Add New Tool - Dashboard | AIBDE',
        };
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
                title: `${tool.name} - Edit Tool | AIBDE`,
            };
        }
    } catch (e) {
        // Fallback on error
        console.error('Failed to fetch tool name for metadata', e);
    }

    return {
        title: 'Edit Tool - Dashboard | AIBDE',
    };
}

export default function EditToolLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
