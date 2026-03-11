import type { ReactNode } from 'react';
import { Metadata } from 'next';
import { getTasks } from '@/lib/data';

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
            title: 'Add New Task - Dashboard | AIBDE',
        };
    }

    try {
        const tasks = await getTasks();
        const task = tasks.find((t) => slugify(t.taskName) === slugify(slug));

        if (task?.taskName) {
            return {
                title: `${task.taskName} - Edit Task | AIBDE`,
            };
        }
    } catch (e) {
        console.error('Failed to fetch task name for metadata', e);
    }

    return {
        title: 'Edit Task - Dashboard | AIBDE',
    };
}

export default function EditTaskLayout({
    children,
}: {
    children: ReactNode;
}) {
    return children;
}
