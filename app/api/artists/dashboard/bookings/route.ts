/**
 * app/api/artists/dashboard/bookings/route.ts
 *
 * Handles the retrieval of a list of bookings received by the authenticated artist.
 * This API is PROTECTED and requires the user to be logged in and have the 'artist' role.
 *
 * Priority 14: GET /api/artists/dashboard/bookings
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ApiErrors, successResponse } from '@/lib/api-response';
import { auth } from '@/auth'; 
import { Prisma, BookingStatus } from '@prisma/client';

// Hardcoded array of valid statuses for runtime validation.
// This is necessary because Prisma enums aren't easily accessible as runtime objects.
const VALID_STATUSES = ['PENDING', 'APPROVED', 'DECLINED', 'CANCELLED', 'COMPLETED'];

// Define pagination defaults
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

/**
 * Handles GET requests to retrieve the artist's list of received bookings.
 * Supports filtering by status and pagination via URL query parameters.
 */
export async function GET(request: NextRequest): Promise<NextResponse<any>> {
    try {
        // --- 1. Authentication and Authorization ---
        const session = await auth();

        if (!session || !session.user || !session.user.id) {
            return ApiErrors.unauthorized();
        }

        const userId = session.user.id;
        const url = new URL(request.url);
        const searchParams = url.searchParams;
        
        // Fetch the associated Artist ID and verify role
        const artistProfile = await prisma.artist.findUnique({
            where: { userId: userId },
            select: { id: true, user: { select: { role: true } } }
        });

        if (artistProfile?.user.role !== 'artist' || !artistProfile.id) {
            return ApiErrors.forbidden();
        }

        const artistId = artistProfile.id;

        // --- 2. Pagination Setup ---
        const page = parseInt(searchParams.get('page') || '1', 10);
        let limit = parseInt(searchParams.get('limit') || DEFAULT_PAGE_SIZE.toString(), 10);
        
        if (limit > MAX_PAGE_SIZE) {
            limit = MAX_PAGE_SIZE;
        }
        
        const skip = (page - 1) * limit;

        // --- 3. Filtering Setup ---
        const where: Prisma.BookingWhereInput = {
            artistId: artistId // CRITICAL: Filter only bookings for this artist
        };

        // Filter by status (PENDING, APPROVED, COMPLETED, etc.)
        const statusFilter = searchParams.get('status')?.toUpperCase();
        if (statusFilter && VALID_STATUSES.includes(statusFilter)) {
            // Use the status filter, correctly cast as Prisma.BookingStatus enum
            where.status = statusFilter as BookingStatus;
        } else if (statusFilter) {
            // Return an error for an invalid status filter provided
            return ApiErrors.badRequest(`Invalid status filter provided. Must be one of: ${VALID_STATUSES.join(', ')}`);
        }

        // --- 4. Database Query ---

        // Count total results for pagination metadata
        const totalBookings = await prisma.booking.count({ where });

        const bookings = await prisma.booking.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
                createdAt: 'desc', // Show newest bookings first
            },
            select: {
                id: true,
                eventDate: true,
                eventType: true,
                eventLocation: true,
                totalPrice: true,
                status: true,
                createdAt: true,
                // Include client (User) details for context
                client: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phoneNumber: true,
                    },
                },
            },
        });

        // --- 5. Format Response and Return ---
        
        const metadata = {
            total: totalBookings,
            page: page,
            limit: limit,
            totalPages: Math.ceil(totalBookings / limit),
        };

        return successResponse(
            { bookings, metadata },
            'Artist bookings retrieved successfully.',
            200
        );

    } catch (error) {
        console.error('GET Artist Bookings API Error:', error);
        return ApiErrors.internalError('An unexpected error occurred while fetching artist bookings.');
    }
}
