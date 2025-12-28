/**
 * app/api/media/[id]/route.ts
 *
 * Handles:
 * 1. DELETE /api/media/[id]: Deletes a specific video/media item by ID.
 *
 * This route is protected and ensures only the original uploader (artist)
 * can delete their own content.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ApiErrors, successResponse } from '@/lib/api-response';
import { auth } from '@/auth';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

// Define the expected structure for URL parameters
interface Params {
    id: string; // The media ID to be deleted
}

/**
 * Handles DELETE request to remove a specific media item.
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Params }
): Promise<NextResponse<any>> {
    try {
        const mediaId = params.id;

        // 1. Session Validation and Authorization
        const session = await auth();
        if (!session || !session.user || !session.user.id) {
            return ApiErrors.unauthorized();
        }
        const userId = session.user.id;
        
        if (!mediaId) {
            return ApiErrors.badRequest('Media ID is required for deletion.');
        }
        
        // 2. Authorization Check and Deletion
        // CRITICAL: We use a combined WHERE clause to ensure the mediaId exists
        // AND that it belongs to the authenticated userId. This prevents
        // one user from deleting another's content.
        const deletedMedia = await prisma.video.delete({
            where: {
                id: mediaId,
                userId: userId, // Enforce ownership
            },
            select: {
                id: true,
                title: true,
            }
        });

        // NOTE: In a production app, you would also add logic here to
        // delete the actual file (video and thumbnail) from cloud storage
        // (e.g., S3, GCS) using the URLs stored in the database.
        
        // 3. Success Response
        return successResponse(
            { id: deletedMedia.id },
            `Media item "${deletedMedia.title}" deleted successfully.`,
            200
        );

    } catch (error) {
        if (error instanceof PrismaClientKnownRequestError) {
            // P2025: Record to delete does not exist (e.g., ID not found or ownership mismatch)
            if (error.code === 'P2025') {
                // Return 404 to hide whether the ID exists but belongs to another user
                return ApiErrors.notFound('Media item not found or you do not have permission to delete it.');
            }
        }
        
        console.error('DELETE /api/media/[id] API Error:', error);
        return ApiErrors.internalError('An unexpected error occurred during media deletion.');
    }
}
