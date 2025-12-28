/**
 * app/api/media/route.ts
 *
 * Handles:
 * 1. GET /api/media: Lists all video/media content uploaded by the authenticated user (artist).
 *
 * This route is protected and only accessible to authenticated users/artists.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ApiErrors, successResponse } from '@/lib/api-response';
import { auth } from '@/auth';
import { Prisma } from '@prisma/client';

// Define pagination defaults
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

/**
 * Handles GET request to list all media content uploaded by the authenticated user.
 */
export async function GET(request: NextRequest): Promise<NextResponse<any>> {
    try {
        // 1. Session Validation
        const session = await auth();
        if (!session || !session.user || !session.user.id) {
            return ApiErrors.unauthorized();
        }
        const userId = session.user.id;
        
        // 2. Pagination Setup
        const url = new URL(request.url);
        const searchParams = url.searchParams;

        const page = parseInt(searchParams.get('page') || '1', 10);
        let limit = parseInt(searchParams.get('limit') || DEFAULT_PAGE_SIZE.toString(), 10);
        
        // Clamp limit to maximum allowed size
        if (limit > MAX_PAGE_SIZE) {
            limit = MAX_PAGE_SIZE;
        }
        
        const skip = (page - 1) * limit;

        // 3. Filtering (Optional)
        // We can add filtering here, e.g., by 'isShort' or 'isApproved' status
        const where: Prisma.VideoWhereInput = {
            userId: userId, // CRITICAL: Filter media only by the authenticated user's ID
        };
        
        const statusFilter = searchParams.get('status');
        if (statusFilter === 'approved') {
            where.isApproved = true;
        } else if (statusFilter === 'pending') {
            where.isApproved = false;
        }


        // 4. Database Query
        
        // Count total results for pagination metadata
        const totalMedia = await prisma.video.count({ where });

        const media = await prisma.video.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
                // List newest media first
                createdAt: 'desc',
            },
            select: {
                id: true,
                title: true,
                description: true,
                url: true, // The media file URL
                thumbnailUrl: true, // The generated thumbnail URL
                duration: true,
                // isShort: true, // This field was removed to resolve the TypeScript error.
                isApproved: true, // Crucial for artist dashboard view
                createdAt: true,
            },
        });

        // 5. Format Response and Return
        
        const metadata = {
            total: totalMedia,
            page: page,
            limit: limit,
            totalPages: Math.ceil(totalMedia / limit),
        };

        return successResponse(
            { media, metadata },
            'User media list retrieved successfully.',
            200
        );

    } catch (error) {
        console.error('GET /api/media API Error:', error);
        return ApiErrors.internalError('An unexpected error occurred while fetching user media.');
    }
}
