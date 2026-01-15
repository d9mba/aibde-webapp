'use client';

import { useParams } from 'next/navigation';
import { useAdmin } from '@/context/AdminContext';
import ToolForm from '@/components/features/admin/ToolForm';

export default function EditToolPage() {
    const params = useParams();
    const { tools, isLoaded } = useAdmin();
    const id = params.id as string;

    const tool = tools.find(t => t.id === id);

    if (!isLoaded) {
        return (
            <div className="min-h-screen p-8 bg-bg-primary flex items-center justify-center">
                <div className="text-text-secondary">Loading...</div>
            </div>
        );
    }

    if (!tool) {
        return (
            <div className="min-h-screen p-8 bg-bg-primary flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-bold text-text-primary mb-2">Tool not found</h2>
                    <a href="/dashboard/tools" className="text-accent-primary hover:underline">← Back to Tools</a>
                </div>
            </div>
        );
    }

    return <ToolForm toolId={id} />;
}
