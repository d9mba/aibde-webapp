'use client';

import { useParams, notFound } from 'next/navigation';
import ToolForm from '@/components/features/admin/ToolForm';

export default function EditToolPage() {
    const params = useParams();
    const rawId = params.id;
    const id = typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : undefined;

    if (!id) return notFound();

    // ToolForm handles its own data fetching via API
    return <ToolForm toolId={id} />;
}
