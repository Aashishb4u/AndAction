/**
 * app/api/videos/[id]/route.ts
 *
 * Handles the retrieval of a single, approved video by its ID.
 * CRITICAL: This route uses a Prisma transaction to atomically increment the view count.
 *
 * Priority: GET /api/videos/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ApiErrors, successResponse } from '@/lib/api-response';

// Define the required structure for dynamic routing parameters
interface RouteParams {
    params: {
        id: string; // The video ID passed in the URL segment
    }
}

export async function GET(request: NextRequest, { params }: RouteParams): Promise<NextResponse<any>> {
    const videoId = params.id;

    if (!videoId) {
        return ApiErrors.badRequest('Video ID is required.');
    }

    try {
        // Use a Prisma transaction to ensure atomicity:
        // 1. Increment the view count.
        // 2. Retrieve the video details.
        const [updatedVideo, video] = await prisma.$transaction([
            // 1. Atomically increment the 'views' counter
            prisma.video.update({
                where: { id: videoId },
                data: { views: { increment: 1 } },
                select: { id: true } // Only select ID to minimize overhead for this step
            }),

            // 2. Fetch the detailed video data
            prisma.video.findUnique({
                where: { 
                    id: videoId,
                    isApproved: true, // Only allow access to approved videos
                },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    url: true, 
                    thumbnailUrl: true,
                    duration: true,
                    views: true,
                    createdAt: true,
                    // Include related User/Artist data
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            avatar: true, 
                            isArtistVerified: true, 
                            // Include artist-specific details if available
                            artist: {
                                select: {
                                    stageName: true,
                                    artistType: true,
                                    shortBio: true,
                                }
                            }
                        }
                    },
                }
            })
        ]);

        // If the video does not exist or is not approved, return 404.
        if (!video) {
            return ApiErrors.notFound('The requested video was not found or is not approved.');
        }

        // 3. Success Response
        return successResponse(
            { video },
            'Video retrieved successfully and view count incremented.',
            200
        );

    } catch (error) {
        // Handle case where update fails (e.g., video ID doesn't exist)
        if (error instanceof Error && error.message.includes('Record to update not found')) {
            return ApiErrors.notFound('The requested video was not found.');
        }
        
        console.error(`GET /api/videos/${videoId} API Error:`, error);
        return ApiErrors.internalError('An unexpected error occurred while fetching the video detail.');
    }
}
