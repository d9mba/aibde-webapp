import { NextResponse } from 'next/server';

/**
 * Catch-All API Route
 * 
 * Returns 403 Forbidden for any unknown /api/* path.
 */
function unauthorizedResponse(): NextResponse {
    return NextResponse.json(
        { error: 'Access denied', message: 'You don\'t have authorization to access this endpoint.' },
        { status: 403 }
    );
}

export function GET(): NextResponse { return unauthorizedResponse(); }
export function POST(): NextResponse { return unauthorizedResponse(); }
export function PUT(): NextResponse { return unauthorizedResponse(); }
export function DELETE(): NextResponse { return unauthorizedResponse(); }
export function PATCH(): NextResponse { return unauthorizedResponse(); }
