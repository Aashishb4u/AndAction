/**
 * app/api/admin/media/[id]/route.ts
 *
 * Handles:
 * 1. PATCH /api/admin/media/[id]: Updates the 'isApproved' status of a specific video by ID.
 *
 * This route is strictly protected and only accessible to users with the 'admin' role.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ApiErrors, successResponse } from '@/lib/api-response';
import { auth } from '@/auth';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { UserRole } from '@/lib/types/database';

// Define the expected structure for URL parameters
interface Params {
    id: string; // The media ID to be updated
}

// Define the expected structure for the request body
interface UpdateBody {
    isApproved: boolean; // The new approval status
}

/**
 * Handles PATCH request to update the approval status of a media item.
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Params }
): Promise<NextResponse<any>> {
    const mediaId = params.id;
    let body: UpdateBody;
    
    try {
        // 1. Session Validation and Authorization
        const session = await auth();
        if (!session || !session.user || !session.user.id) {
            return ApiErrors.unauthorized();
        }

        // CRITICAL: Only 'admin' users allowed
        if (session.user.role !== ('admin' as UserRole)) {
             return ApiErrors.forbidden();
        }
        
        if (!mediaId) {
            return ApiErrors.badRequest('Media ID is required for status update.');
        }

        // 2. Body Parsing and Validation
        body = await request.json();
        const { isApproved } = body;

        if (typeof isApproved !== 'boolean') {
            return ApiErrors.badRequest('The request body must contain a boolean "isApproved" field.');
        }
        
        // 3. Database Update
        const updatedMedia = await prisma.video.update({
            where: {
                id: mediaId,
            },
            data: {
                isApproved: isApproved,
            },
            select: {
                id: true,
                title: true,
                isApproved: true,
            }
        });

        // 4. Success Response
        const statusText = updatedMedia.isApproved ? 'approved' : 'rejected';
        return successResponse(
            updatedMedia,
            `Media item "${updatedMedia.title}" successfully ${statusText}.`,
            200
        );

    } catch (error) {
        if (error instanceof PrismaClientKnownRequestError) {
            // P2025: Record to update does not exist
            if (error.code === 'P2025') {
                return ApiErrors.notFound(`Media item with ID ${mediaId} not found.`);
            }
        }
        
        console.error('PATCH /api/admin/media/[id] API Error:', error);
        return ApiErrors.internalError('An unexpected error occurred during media status update.');
    }
}
