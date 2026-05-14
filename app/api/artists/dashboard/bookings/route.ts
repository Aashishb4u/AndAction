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

function isMissingColumnClientPhoneNumberError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    const anyError = error as any;
    const message = String(anyError?.message || '');
    return (
        (anyError?.code === 'P2022' || anyError?.code === 'P2010') &&
        (message.includes('clientPhoneNumber') || message.includes('clientPhoneNumber'.toLowerCase()))
    );
}

async function hydrateClientPhoneNumbers<T extends { id: string }>(
    bookings: T[]
): Promise<Array<T & { clientPhoneNumber: string | null }>> {
    const ids = bookings.map((b) => b.id).filter(Boolean);
    const base = bookings.map((b) => ({ ...b, clientPhoneNumber: null }));
    if (ids.length === 0) return base;

    try {
        const rows = await prisma.$queryRaw<
            Array<{ id: string; clientPhoneNumber: string | null }>
        >`SELECT "id", "clientPhoneNumber" FROM "bookings" WHERE "id" IN (${Prisma.join(ids)})`;
        const map = new Map(rows.map((r) => [r.id, r.clientPhoneNumber] as const));
        return bookings.map((b) => ({
            ...b,
            clientPhoneNumber: map.get(b.id) ?? null,
        }));
    } catch (error) {
        if (isMissingColumnClientPhoneNumberError(error)) {
            return base;
        }
        throw error;
    }
}

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
        
        const artistProfiles = await prisma.artist.findMany({
            where: { userId: userId },
            select: { id: true, user: { select: { role: true } } }
        });

        if (artistProfiles.length === 0 || artistProfiles[0]?.user.role !== 'artist') {
            return ApiErrors.forbidden();
        }
        const artistIds = artistProfiles.map((a) => a.id);

        // --- 2. Pagination Setup ---
        const page = parseInt(searchParams.get('page') || '1', 10);
        let limit = parseInt(searchParams.get('limit') || DEFAULT_PAGE_SIZE.toString(), 10);
        
        if (limit > MAX_PAGE_SIZE) {
            limit = MAX_PAGE_SIZE;
        }
        
        const skip = (page - 1) * limit;

        // --- 3. Filtering Setup ---
        const where: Prisma.BookingWhereInput = {
            artistId: { in: artistIds }
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

        const bookingsBase = await prisma.booking.findMany({
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
        const bookings = await hydrateClientPhoneNumbers(bookingsBase);

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
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (isMissingColumnClientPhoneNumberError(error)) {
                return ApiErrors.internalError('Database schema is out of date. Please run Prisma migrations and try again.');
            }
        }
        console.error('GET Artist Bookings API Error:', error);
        return ApiErrors.internalError('An unexpected error occurred while fetching artist bookings.');
    }
}
