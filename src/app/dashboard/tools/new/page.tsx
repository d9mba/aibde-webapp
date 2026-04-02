'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ToolForm from '@/components/features/admin/ToolForm';

function NewToolContent() {
    const searchParams = useSearchParams();
    const submissionId = searchParams.get('submissionId') || undefined;
    return <ToolForm submissionId={submissionId} />;
}

export default function NewToolPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-text-secondary">Loading...</div>}>
            <NewToolContent />
        </Suspense>
    );
}
