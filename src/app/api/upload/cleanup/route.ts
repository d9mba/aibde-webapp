import { NextRequest, NextResponse } from 'next/server';
import { deleteFile } from '@/services/storage.service';
import { requireAdmin, isAuthError } from '@/lib/auth-utils';

function isSafeStoragePath(p: string): boolean {
    const path = p.startsWith('/') ? p.slice(1) : p;
    if (!path) return false;
    if (path.includes('..') || path.includes('//') || /[<>"|?*]/.test(path)) return false;
    return true;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const authResult = await requireAdmin();
        if (isAuthError(authResult)) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { files } = await request.json();

        if (!files || !Array.isArray(files)) {
            return NextResponse.json({ error: 'Invalid request: files array required' }, { status: 400 });
        }

        const MAX_FILES_CLEANUP = 100;
        const toProcess = files.slice(0, MAX_FILES_CLEANUP);

        const results: { path: string; deleted: boolean; error?: string }[] = [];

        for (const filePath of toProcess) {
            try {
                const path = String(filePath).startsWith('/') ? String(filePath).slice(1) : String(filePath);

                if (path && isSafeStoragePath(path)) {
                    await deleteFile(path);
                    results.push({ path, deleted: true });
                } else {
                    results.push({ path: String(filePath), deleted: false, error: 'Invalid path' });
                }
            } catch (err) {
                console.error(`Failed to delete ${filePath}:`, err);
                results.push({
                    path: String(filePath),
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
