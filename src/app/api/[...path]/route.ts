import { NextResponse } from 'next/server';

/**
 * Catch-All API Route
 * 
 * Returns 404 Not Found for any unknown /api/* path.
 * Using 404 instead of 403 to avoid revealing endpoint existence.
 */
function notFoundResponse(): NextResponse {
    return NextResponse.json(
        { error: 'Not found', message: 'The requested endpoint does not exist.' },
        { status: 404 }
    );
}

export function GET(): NextResponse { return notFoundResponse(); }
export function POST(): NextResponse { return notFoundResponse(); }
export function PUT(): NextResponse { return notFoundResponse(); }
export function DELETE(): NextResponse { return notFoundResponse(); }
export function PATCH(): NextResponse { return notFoundResponse(); }
export function OPTIONS(): NextResponse { return notFoundResponse(); }
