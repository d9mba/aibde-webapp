'use client';

import { useParams } from 'next/navigation';
import ToolForm from '@/components/features/admin/ToolForm';

export default function EditToolPage() {
    const params = useParams();
    const id = params.id as string;

    // ToolForm handles its own data fetching via API
    return <ToolForm toolId={id} />;
}
