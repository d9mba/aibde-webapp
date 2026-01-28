import { NextRequest, NextResponse } from 'next/server';
import { deleteFile } from '@/services/storage.service';
import { requireAdmin, isAuthError } from '@/lib/auth-utils';

// POST /api/upload/cleanup - Delete unused files from R2
export async function POST(request: NextRequest) {
    try {
        // SECURITY: Require admin authentication
        const authResult = await requireAdmin();
        if (isAuthError(authResult)) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { files } = await request.json();

        if (!files || !Array.isArray(files)) {
            return NextResponse.json({ error: 'Invalid request: files array required' }, { status: 400 });
        }

        const results: { path: string; deleted: boolean; error?: string }[] = [];

        for (const filePath of files) {
            try {
                // Remove leading slash if present
                const path = filePath.startsWith('/') ? filePath.slice(1) : filePath;

                if (path) {
                    await deleteFile(path);
                    results.push({ path, deleted: true });
                }
            } catch (err) {
                console.error(`Failed to delete ${filePath}:`, err);
                results.push({
                    path: filePath,
                    deleted: false,
                    error: err instanceof Error ? err.message : 'Unknown error'
                });
            }
        }

        return NextResponse.json({
            success: true,
            deleted: results.filter(r => r.deleted).length,
            failed: results.filter(r => !r.deleted).length,
            results,
        });
    } catch (err) {
        console.error('Cleanup error:', err);
        return NextResponse.json({ error: 'Failed to cleanup files' }, { status: 500 });
    }
}
