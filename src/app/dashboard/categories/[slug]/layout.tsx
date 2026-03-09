import type { ReactNode } from 'react';
import { Metadata } from 'next';
import { getCategories } from '@/lib/data';

const slugify = (str: string) => str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const p = await params;
    const slug = p.slug;

    if (slug.toLowerCase() === 'new') {
        return {
            title: 'Add New Category - Dashboard | AIBDE',
        };
    }

    try {
        const categories = await getCategories();
        const category = categories.find((c) => slugify(c.categoryName) === slug);

        if (category?.categoryName) {
            return {
                title: `${category.categoryName} - Edit Category | AIBDE`,
            };
        }
    } catch (e) {
        console.error('Failed to fetch category name for metadata', e);
    }

    return {
        title: 'Edit Category - Dashboard | AIBDE',
    };
}

export default function EditCategoryLayout({
    children,
}: {
    children: ReactNode;
}) {
    return children;
}
