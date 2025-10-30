/**
 * app/api/bookings/route.ts
 *
 * Handles the creation of new booking requests from authenticated clients to artists.
 * This API is PROTECTED and requires the user to be logged in.
 *
 * Priority 15: POST /api/bookings
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ApiErrors, successResponse } from '@/lib/api-response';
import { auth } from '@/auth';
import { Prisma, BookingStatus } from '@prisma/client';

const VALID_STATUSES = ['PENDING', 'APPROVED', 'DECLINED', 'CANCELLED', 'COMPLETED'];

// Define pagination defaults
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

/**
 * Defines the expected shape of the booking data from the client request body.
 * NOTE: totalPrice should be validated against the artist's quoted ranges on the frontend.
 */
interface BookingRequestBody {
    artistId: string;
    eventDate: string; // ISO string format
    eventType: string;
    eventLocation: string;
    eventAddress?: string;
    totalPrice: number;
    notes?: string;
}

/**
 * Handles POST requests to create a new booking request.
 */
export async function POST(request: NextRequest): Promise<NextResponse<any>> {
    try {
        // --- 1. Authentication and Authorization ---
        const session = await auth();

        if (!session || !session.user || !session.user.id) {
            return ApiErrors.unauthorized();
        }

        const clientId = session.user.id;
        const body: BookingRequestBody = await request.json();

        // --- 2. Input Validation ---
        const {
            artistId,
            eventDate,
            eventType,
            eventLocation,
            eventAddress,
            totalPrice,
            notes
        } = body;

        if (!artistId || !eventDate || !eventType || !eventLocation || totalPrice == null) {
            return ApiErrors.badRequest('Missing required fields: artistId, eventDate, eventType, eventLocation, totalPrice.');
        }

        const parsedEventDate = new Date(eventDate);
        if (isNaN(parsedEventDate.getTime())) {
            return ApiErrors.badRequest('Invalid eventDate format. Must be a valid date string.');
        }

        if (totalPrice <= 0) {
            return ApiErrors.badRequest('totalPrice must be greater than zero.');
        }
        
        // --- 3. Business Logic Checks ---

        // Check if the target is a valid, existing artist
        const targetArtist = await prisma.artist.findUnique({
            where: { id: artistId },
            select: { id: true, user: { select: { isArtistVerified: true } } }
        });

        if (!targetArtist) {
            return ApiErrors.notFound('Target artist not found.');
        }
        
        // Optionally, ensure the user is not booking themselves (if the User is also an Artist)
        const clientArtistCheck = await prisma.artist.findUnique({
            where: { userId: clientId },
            select: { id: true }
        });

        if (clientArtistCheck?.id === artistId) {
            return ApiErrors.forbidden();
        }

        // --- 4. Database Creation ---

        const newBooking = await prisma.booking.create({
            data: {
                clientId: clientId,
                artistId: artistId,
                eventDate: parsedEventDate,
                eventType: eventType,
                eventLocation: eventLocation,
                eventAddress: eventAddress,
                totalPrice: new Prisma.Decimal(totalPrice), // Ensure Decimal type for Prisma
                notes: notes,
                status: BookingStatus.PENDING, // Default status for a new request
            },
            select: {
                id: true,
                eventDate: true,
                status: true,
                artist: { select: { stageName: true } }
            }
        });

        // --- 5. Return Success ---

        return successResponse(
            { booking: newBooking },
            `Booking request successfully created for artist ${newBooking.artist.stageName}. Awaiting artist approval.`,
            201 // Created
        );

    } catch (error) {
        console.error('POST Create Booking API Error:', error);
        return ApiErrors.internalError('An unexpected error occurred while processing the booking request.');
    }
}

// --- GET /api/bookings (List Bookings for Authenticated User) ---

/**
 * Handles GET requests to list all bookings associated with the authenticated user (as client or artist).
 * Supports filtering by status and pagination.
 */
export async function GET(request: NextRequest): Promise<NextResponse<any>> {
    try {
        // 1. Authentication
        const session = await auth();

        if (!session || !session.user || !session.user.id) {
            return ApiErrors.unauthorized();
        }

        const userId = session.user.id;
        const url = new URL(request.url);
        const searchParams = url.searchParams;
        
        // 2. Determine User Role and Artist ID (if applicable)
        const artistProfile = await prisma.artist.findUnique({
            where: { userId: userId },
            select: { id: true }
        });

        const isArtist = !!artistProfile;
        const artistId = artistProfile?.id;

        // 3. Dynamic Filtering Setup
        const where: Prisma.BookingWhereInput = {};

        if (isArtist) {
            // If the user is an artist, list bookings they made (clientId) OR bookings they received (artistId)
            where.OR = [
                { clientId: userId },
                { artistId: artistId }
            ];
        } else {
            // If the user is only a client, only list bookings they made
            where.clientId = userId;
        }

        // Filter by status (optional query param)
        const statusFilter = searchParams.get('status')?.toUpperCase();
        if (statusFilter && VALID_STATUSES.includes(statusFilter)) {
            where.status = statusFilter as BookingStatus;
        } else if (statusFilter) {
            return ApiErrors.badRequest(`Invalid status filter provided. Must be one of: ${VALID_STATUSES.join(', ')}`);
        }

        // 4. Pagination Setup
        const page = parseInt(searchParams.get('page') || '1', 10);
        let limit = parseInt(searchParams.get('limit') || DEFAULT_PAGE_SIZE.toString(), 10);
        
        if (limit > MAX_PAGE_SIZE) {
            limit = MAX_PAGE_SIZE;
        }
        
        const skip = (page - 1) * limit;

        // 5. Database Query
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
                totalPrice: true,
                status: true,
                createdAt: true,
                // Include details of the other party for context
                client: { select: { firstName: true, lastName: true, email: true } },
                artist: { select: { stageName: true } },
            },
        });

        // 6. Format Response and Return
        const metadata = {
            total: totalBookings,
            page: page,
            limit: limit,
            totalPages: Math.ceil(totalBookings / limit),
        };

        return successResponse(
            { bookings, metadata },
            'User bookings retrieved successfully.',
            200
        );

    } catch (error) {
        console.error('GET List Bookings API Error:', error);
        return ApiErrors.internalError('An unexpected error occurred while fetching user bookings.');
    }
}
