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
    const normalizedSlug = slugify(slug);

    if (normalizedSlug === 'new') {
        return {
            title: 'Add New Tag - Dashboard | BrowseForAI',
        };
    }

    try {
        const tags = await getTags();
        const tag = tags.find((t) => t.tagName != null && slugify(t.tagName) === normalizedSlug);

        if (tag?.tagName) {
            return {
                title: `${tag.tagName} - Edit Tag | BrowseForAI`,
            };
        }
    } catch (e) {
        console.error('Failed to fetch tag name for metadata', e);
    }

    return {
        title: 'Edit Tag - Dashboard | BrowseForAI',
    };
}

export default function EditTagLayout({
    children,
}: {
    children: ReactNode;
}) {
    return children;
}
