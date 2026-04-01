import type { ReactNode } from 'react';
import { Metadata } from 'next';
import { getTasks } from '@/lib/data';

const slugify = (str: string) => str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

// Extract task ID from slug (last segment after final dash, exactly 6 hex chars)
function extractTaskIdSuffix(slug: string): string | null {
    const parts = slug.split('-');
    if (parts.length > 1) {
        const lastPart = parts[parts.length - 1];
        // ID suffix is last 6 chars of UUID, so check if it looks like hex
        if (lastPart.length === 6 && /^[a-f0-9]+$/i.test(lastPart)) {
            return lastPart;
        }
    }
    return null;
}

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
            title: 'Add New Task - Dashboard | AIBDE',
        };
    }

    try {
        const tasks = await getTasks();
        // First try matching by the full normalized slug (for backward compatibility)
        let task = tasks.find((t) => slugify(t.taskName) === normalizedSlug);

        // If not found and slug has ID suffix, try finding by slug name prefix + ID verification
        if (!task) {
            const idSuffix = extractTaskIdSuffix(slug);
            if (idSuffix) {
                const slugWithoutId = normalizedSlug.slice(0, -(idSuffix.length + 1)); // Remove '-XXXXXX'
                if (slugWithoutId) {
                    // Find task matching the name prefix AND whose ID ends with the suffix
                    task = tasks.find((t) =>
                        slugify(t.taskName) === slugWithoutId &&
                        t.id?.endsWith(idSuffix)
                    );
                }
            }
        }

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
