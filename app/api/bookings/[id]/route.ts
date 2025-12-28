/**
 * app/api/bookings/[id]/route.ts
 *
 * Handles detail retrieval (GET) and status updates (PUT) for a specific booking.
 * Both methods are PROTECTED and require authorization (Client or Artist ownership).
 *
 * Priority 16: PUT /api/bookings/[id] (Update Booking Status)
 * Priority 18: GET /api/bookings/[id] (Booking Detail)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ApiErrors, successResponse } from '@/lib/api-response';
import { auth } from '@/auth';
import { BookingStatus } from '@prisma/client';

// Define the shape of the PUT request body for status update
interface UpdateBookingRequestBody {
    newStatus: BookingStatus;
}

/**
 * Handles GET requests to retrieve the details of a specific booking (used by both Client and Artist).
 */
export async function GET(
    request: NextRequest, 
    { params }: { params: { id: string } }
): Promise<NextResponse<any>> {
    try {
        const bookingId = params.id;
        
        // --- 1. Authentication ---
        const session = await auth();

        if (!session || !session.user || !session.user.id) {
            return ApiErrors.unauthorized();
        }

        const userId = session.user.id;

        // --- 2. Fetch Booking and Authorization Check ---
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            select: {
                id: true,
                clientId: true,
                artistId: true,
                // Include all necessary detail fields
                eventDate: true,
                eventType: true,
                eventLocation: true,
                eventAddress: true,
                totalPrice: true,
                status: true,
                notes: true,
                createdAt: true,
                updatedAt: true,
                // Include related entities for context
                client: { select: { id: true, firstName: true, lastName: true, email: true, phoneNumber: true } },
                artist: { select: { id: true, stageName: true, contactEmail: true, contactNumber: true } }
            }
        });

        if (!booking) {
            return ApiErrors.notFound(`Booking with ID ${bookingId} not found.`);
        }
        
        // Determine the Artist ID associated with the current user's profile
        const artistProfile = await prisma.artist.findUnique({
            where: { userId: userId },
            select: { id: true }
        });

        // Check if the user is authorized: they must be either the client OR the artist who owns the booking
        const isClient = booking.clientId === userId;
        const isAuthorizedArtist = artistProfile?.id === booking.artistId;

        if (!isClient && !isAuthorizedArtist) {
            return ApiErrors.forbidden();
        }

        // --- 3. Return Success ---
        return successResponse(
            { booking: booking },
            `Booking details for ID ${bookingId} retrieved successfully.`,
            200
        );

    } catch (error) {
        console.error('GET Booking Detail API Error:', error);
        return ApiErrors.internalError('An unexpected error occurred while fetching booking details.');
    }
}


/**
 * Handles PUT requests to update a booking's status (used by the Artist).
 * Priority 16 implementation.
 */
export async function PUT(
    request: NextRequest, 
    { params }: { params: { id: string } }
): Promise<NextResponse<any>> {
    try {
        const bookingId = params.id;
        
        // --- 1. Authentication and Authorization (Artist Role Check) ---
        const session = await auth();

        if (!session || !session.user || !session.user.id) {
            return ApiErrors.unauthorized();
        }

        const userId = session.user.id;
        const body: UpdateBookingRequestBody = await request.json();
        const { newStatus } = body;

        // Check if the user is an artist
        const artistProfile = await prisma.artist.findUnique({
            where: { userId: userId },
            select: { id: true, user: { select: { role: true } } }
        });

        if (artistProfile?.user.role !== 'artist' || !artistProfile.id) {
            return ApiErrors.forbidden();
        }

        // --- 2. Status and Input Validation ---
        const VALID_ARTIST_ACTIONS: BookingStatus[] = [
            BookingStatus.APPROVED, 
            BookingStatus.DECLINED, 
            BookingStatus.CANCELLED // Artists can cancel a booking they previously approved
        ];

        if (!newStatus || !VALID_ARTIST_ACTIONS.includes(newStatus)) {
            const validStatuses = VALID_ARTIST_ACTIONS.join(', ');
            return ApiErrors.badRequest(`Invalid or unsupported status provided. Artist actions must be one of: ${validStatuses}.`);
        }

        // --- 3. Booking Ownership and Status Check ---
        const existingBooking = await prisma.booking.findUnique({
            where: { id: bookingId },
            select: { id: true, artistId: true, status: true }
        });

        if (!existingBooking) {
            return ApiErrors.notFound(`Booking with ID ${bookingId} not found.`);
        }

        // CRITICAL: Ensure the authenticated artist owns this booking
        if (existingBooking.artistId !== artistProfile.id) {
            return ApiErrors.forbidden();
        }

        // Prevent updating a final status (COMPLETED)
        if (existingBooking.status === BookingStatus.COMPLETED) {
             return ApiErrors.badRequest('Cannot change status of a completed booking.');
        }
        
        // --- 4. Database Update ---
        const updatedBooking = await prisma.booking.update({
            where: { id: bookingId },
            data: { status: newStatus },
            select: { id: true, status: true, eventDate: true }
        });

        // --- 5. Return Success ---
        return successResponse(
            { booking: updatedBooking },
            `Booking status successfully updated to ${updatedBooking.status}.`,
            200
        );

    } catch (error) {
        console.error('PUT Update Booking Status API Error:', error);
        return ApiErrors.internalError('An unexpected error occurred while updating the booking status.');
    }
}
