/**
 * app/api/bookmarks/[id]/route.ts
 *
 * Handles:
 * 1. DELETE /api/bookmarks/[id]: Deletes a specific bookmark by its ID.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ApiErrors, successResponse } from '@/lib/api-response';
import { auth } from '@/auth';

// Define the structure for the URL parameters
interface BookmarkRouteContext {
    params: {
        id: string; // The ID of the bookmark to be deleted
    };
}

export async function DELETE(
    request: NextRequest,
    context: BookmarkRouteContext
): Promise<NextResponse<any>> {
    // 1. Session Validation
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return ApiErrors.unauthorized();
    }
    const userId = session.user.id;
    const bookmarkId = context.params.id;

    if (!bookmarkId) {
        return ApiErrors.badRequest('Bookmark ID is required.');
    }

    try {
        // 2. Authorization and Deletion
        // CRITICAL SECURITY STEP: We ensure the bookmark exists AND belongs to the authenticated user.
        const deletedBookmark = await prisma.bookmark.delete({
            where: {
                id: bookmarkId,
                userId: userId, // Enforces ownership
            },
            select: { id: true, videoId: true, artistId: true },
        });

        // 3. Success Response
        return successResponse(
            { id: deletedBookmark.id },
            'Bookmark successfully deleted.',
            200
        );

    } catch (error) {
        // Prisma throws a P2025 error code for record not found in a delete operation.
        // This handles cases where the bookmark ID is invalid OR the user does not own it.
        if (error instanceof Error && 'code' in error && error.code === 'P2025') {
            return ApiErrors.notFound('Bookmark not found or access denied.');
        }

        console.error('DELETE /api/bookmarks/[id] API Error:', error);
        return ApiErrors.internalError('An unexpected error occurred while deleting the bookmark.');
    }
}
