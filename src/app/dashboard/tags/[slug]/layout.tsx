import type { ReactNode } from 'react';
import { Metadata } from 'next';
import { getTags } from '@/lib/data';

const slugify = (str: string) => str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const p = await params;
    const slug = p.slug;

    if (slug.toLowerCase() === 'new') {
        return {
            title: 'Add New Tag - Dashboard | AIBDE',
        };
    }

    try {
        const tags = await getTags();
        const tag = tags.find((t) => t.tagName != null && slugify(t.tagName) === slug);

        if (tag?.tagName) {
            return {
                title: `${tag.tagName} - Edit Tag | AIBDE`,
            };
        }
    } catch (e) {
        console.error('Failed to fetch tag name for metadata', e);
    }

    return {
        title: 'Edit Tag - Dashboard | AIBDE',
    };
}

export default function EditTagLayout({
    children,
}: {
    children: ReactNode;
}) {
    return children;
}
