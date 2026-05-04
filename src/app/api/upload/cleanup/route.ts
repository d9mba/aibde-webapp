import { NextRequest, NextResponse } from 'next/server';
import { deleteFile } from '@/services/storage.service';

// POST /api/upload/cleanup?path=... — Called via sendBeacon on page close
// Deletes orphaned images uploaded during an abandoned editing session
export async function POST(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const path = searchParams.get('path');

        if (!path) {
            return NextResponse.json({ error: 'No path' }, { status: 400 });
        }

        const cleanPath = path.startsWith('/') ? path.slice(1) : path;
        if (cleanPath.includes('..') || cleanPath.includes('//')) {
            return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
        }

        await deleteFile(cleanPath);
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('[Cleanup] Error:', err);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
