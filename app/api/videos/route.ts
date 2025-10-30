/**
 * app/api/videos/route.ts
 *
 * Handles the retrieval of the main video feed (list of approved videos).
 * Implements pagination and filtering to ensure performant content delivery.
 *
 * Priority: GET /api/videos
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ApiErrors, successResponse } from '@/lib/api-response';

// --- Configuration ---
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

export async function GET(request: NextRequest): Promise<NextResponse<any>> {
    try {
        const url = new URL(request.url);
        
        // 1. Get and Validate Pagination Parameters
        const page = parseInt(url.searchParams.get('page') || '1', 10);
        let limit = parseInt(url.searchParams.get('limit') || DEFAULT_LIMIT.toString(), 10);
        
        // Ensure limit is reasonable
        limit = Math.min(limit, MAX_LIMIT);
        limit = Math.max(1, limit); // Minimum limit of 1
        
        const offset = (page - 1) * limit;

        // 2. Fetch Videos
        // We only fetch videos that are marked as approved and the associated artist/user data.
        const videos = await prisma.video.findMany({
            where: {
                isApproved: true, // Crucial filter: only show approved content
            },
            skip: offset,
            take: limit,
            orderBy: {
                // Example sorting: newest first. Could be dynamically changed by query params.
                createdAt: 'desc', 
            },
            select: {
                id: true,
                title: true,
                url: true, // URL to the video file/stream
                thumbnailUrl: true,
                duration: true,
                views: true,
                createdAt: true,
                // Include related User/Artist data for display cards
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        // Assumes profile picture is stored on the user model
                        avatar: true, 
                        // Crucial for the "Verified Artist" badge
                        isArtistVerified: true, 
                    }
                },
            }
        });
        
        // 3. Get Total Count for Pagination Metadata
        const totalCount = await prisma.video.count({
            where: { isApproved: true },
        });

        // 4. Construct Metadata
        const totalPages = Math.ceil(totalCount / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        // 5. Success Response
        return successResponse(
            {
                videos,
                pagination: {
                    page,
                    limit,
                    totalCount,
                    totalPages,
                    hasNextPage,
                    hasPrevPage,
                }
            },
            `Successfully retrieved ${videos.length} videos for page ${page}.`,
            200
        );

    } catch (error) {
        console.error('GET /api/videos API Error:', error);
        return ApiErrors.internalError('An unexpected error occurred while fetching videos.');
    }
}
