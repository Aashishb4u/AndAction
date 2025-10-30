/**
 * app/api/admin/media/route.ts
 *
 * Handles:
 * 1. GET /api/admin/media: Lists ALL video/media content for moderation purposes.
 *
 * This route is strictly protected and only accessible to users with the 'admin' role.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ApiErrors, successResponse } from '@/lib/api-response';
import { auth } from '@/auth';
import { Prisma } from '@prisma/client';
import { UserRole } from '@/lib/types/database';

// Define pagination defaults
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

/**
 * Handles GET request to list all media content across all users for admin review.
 */
export async function GET(request: NextRequest): Promise<NextResponse<any>> {
    try {
        // 1. Session Validation
        const session = await auth();
        if (!session || !session.user || !session.user.id) {
            return ApiErrors.unauthorized();
        }

        // 2. Authorization Check (CRITICAL: Only 'admin' users allowed)
        if (session.user.role !== ('admin' as UserRole)) {
             return ApiErrors.forbidden();
        }
        
        // 3. Pagination Setup
        const url = new URL(request.url);
        const searchParams = url.searchParams;

        const page = parseInt(searchParams.get('page') || '1', 10);
        let limit = parseInt(searchParams.get('limit') || DEFAULT_PAGE_SIZE.toString(), 10);
        
        // Clamp limit to maximum allowed size
        if (limit > MAX_PAGE_SIZE) {
            limit = MAX_PAGE_SIZE;
        }
        
        const skip = (page - 1) * limit;

        // 4. Filtering (By status)
        const where: Prisma.VideoWhereInput = {};
        
        const statusFilter = searchParams.get('status');
        if (statusFilter === 'approved') {
            where.isApproved = true;
        } else if (statusFilter === 'pending') {
            where.isApproved = false;
        }

        // 5. Database Query
        
        // Count total results for pagination metadata
        const totalMedia = await prisma.video.count({ where });

        const media = await prisma.video.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
                // List newest media first (often most relevant for moderation)
                createdAt: 'desc',
            },
            select: {
                id: true,
                title: true,
                description: true,
                url: true, 
                thumbnailUrl: true, 
                duration: true,
                isApproved: true, 
                createdAt: true,
                // Include the uploader's basic info for context
                user: { 
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    }
                }
            },
        });

        // 6. Format Response and Return
        
        const metadata = {
            total: totalMedia,
            page: page,
            limit: limit,
            totalPages: Math.ceil(totalMedia / limit),
        };

        return successResponse(
            { media, metadata },
            'All media list for admin review retrieved successfully.',
            200
        );

    } catch (error) {
        console.error('GET /api/admin/media API Error:', error);
        return ApiErrors.internalError('An unexpected error occurred while fetching all media for admin review.');
    }
}
