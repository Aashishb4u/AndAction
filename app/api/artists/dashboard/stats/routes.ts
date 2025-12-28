/**
 * app/api/artists/dashboard/stats/route.ts
 *
 * Handles the retrieval of key performance indicators (KPIs) for the authenticated artist's dashboard.
 * This API is PROTECTED and requires the user to be logged in and have the 'artist' role.
 *
 * Priority 13: GET /api/artists/dashboard/stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ApiErrors, successResponse } from '@/lib/api-response';
import { auth } from '@/auth';

/**
 * Handles GET requests to retrieve dashboard statistics for the authenticated artist.
 */
export async function GET(request: NextRequest): Promise<NextResponse<any>> {
    try {
        // --- 1. Authentication and Authorization ---
        const session = await auth();

        if (!session || !session.user || !session.user.id) {
            return ApiErrors.unauthorized();
        }

        const userId = session.user.id;
        
        // Fetch the user and their associated Artist profile in one query
        const userWithArtist = await prisma.user.findUnique({
            where: { id: userId },
            select: { 
                role: true,
                artist: { select: { id: true, stageName: true } }
            }
        });

        if (userWithArtist?.role !== 'artist' || !userWithArtist.artist?.id) {
            return ApiErrors.forbidden();
        }

        const artistId = userWithArtist.artist.id;

        // --- 2. Data Aggregation (Booking Model assumed to exist) ---
        // NOTE: This section assumes the existence of a 'Booking' model with 'artistId', 'status', and 'totalPrice' fields.

        // Get total count of all bookings
        const totalBookings = await prisma.booking.count({
            where: { artistId },
        });

        // Get counts for specific statuses
        const pendingBookings = await prisma.booking.count({
            where: { artistId, status: 'PENDING' },
        });

        const confirmedBookings = await prisma.booking.count({
            where: { artistId, status: 'APPROVED' },
        });

        // Calculate total earnings from completed bookings
        const totalEarningsResult = await prisma.booking.aggregate({
            _sum: { totalPrice: true },
            where: { artistId, status: 'COMPLETED' },
        });

        const totalEarnings = totalEarningsResult._sum.totalPrice?.toNumber() || 0;

        // Placeholder for future metrics (e.g., Profile Views)
        const profileViews = 1200; // Placeholder

        // --- 3. Format Response and Return ---
        
        const dashboardStats = {
            stageName: userWithArtist.artist.stageName,
            bookings: {
                total: totalBookings,
                pending: pendingBookings,
                confirmed: confirmedBookings,
            },
            earnings: {
                total: totalEarnings,
                currency: 'USD', // Placeholder currency
            },
            profile: {
                views: profileViews,
            }
        };

        return successResponse(
            { stats: dashboardStats },
            `Dashboard statistics for artist ${userWithArtist.artist.stageName} retrieved successfully.`,
            200
        );

    } catch (error) {
        console.error('GET Artist Dashboard Stats API Error:', error);
        // Check if the error is related to missing Booking model or field
        if (error instanceof Error && (error.message.includes('Booking') || error.message.includes('booking'))) {
             console.warn("Prisma error likely due to missing 'Booking' model. Ensure it is defined in schema.prisma.");
        }
        return ApiErrors.internalError('An unexpected error occurred while fetching dashboard statistics.');
    }
}
