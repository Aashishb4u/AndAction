/**
 * app/api/artists/search/route.ts
 *
 * Handles the public search functionality for Artist profiles using a dedicated query term.
 * This API is OPEN and does not require authentication.
 *
 * Priority 12: GET /api/artists/search
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ApiErrors, successResponse } from '@/lib/api-response';
import { Prisma } from '@prisma/client';

// Define pagination defaults
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

/**
 * Handles GET requests to search artist profiles based on a dedicated query term (q).
 * Supports optional filtering and pagination.
 */
export async function GET(request: NextRequest): Promise<NextResponse<any>> {
    try {
        const url = new URL(request.url);
        const searchParams = url.searchParams;

        // --- 1. Pagination Setup ---
        const page = parseInt(searchParams.get('page') || '1', 10);
        let limit = parseInt(searchParams.get('limit') || DEFAULT_PAGE_SIZE.toString(), 10);
        
        if (limit > MAX_PAGE_SIZE) {
            limit = MAX_PAGE_SIZE;
        }
        
        const skip = (page - 1) * limit;

        // --- 2. Filtering and Search Query (q) ---
        const where: Prisma.ArtistWhereInput = {};
        
        // A. Dedicated Search Term (q)
        const queryTerm = searchParams.get('q')?.trim();

        if (queryTerm) {
            // Search across stageName, shortBio, and potentially artistType
            where.OR = [
                { stageName: { contains: queryTerm, mode: 'insensitive' as 'default' } },
                { shortBio: { contains: queryTerm, mode: 'insensitive' as 'default' } },
                // Allow searching within performing languages/events as well
                { performingLanguage: { contains: queryTerm, mode: 'insensitive' as 'default' } },
                { performingEventType: { contains: queryTerm, mode: 'insensitive' as 'default' } },
            ];
        } else {
            // If no search term, return a 400 Bad Request, as this is a dedicated search API
            // Alternatively, you could default to the main /api/artists logic, but for diligence,
            // we'll require the 'q' parameter for the search endpoint.
            return ApiErrors.badRequest('A search query parameter "q" is required for this endpoint.');
        }

        // B. Optional Filters (e.g., location or type filters can still be applied alongside the search)
        const artistType = searchParams.get('type');
        if (artistType) {
            // Use AND logic if artistType filter is present
            where.artistType = artistType;
        }
        
        const stateFilter = searchParams.get('state');
        if (stateFilter) {
            // Use AND logic for state filter
            where.performingStates = { contains: stateFilter, mode: 'insensitive' as 'default' };
        }
        
        // --- 3. Only show fully public, verified Artists (Security/Quality Filter) ---
        where.user = {
            role: 'artist',
            isAccountVerified: true,  // Must have verified email
            isArtistVerified: true,   // Must be approved/verified to be public
        };


        // --- 4. Database Query ---

        // Count total results for pagination metadata
        const totalArtists = await prisma.artist.count({ where });

        const artists = await prisma.artist.findMany({
            where,
            skip,
            take: limit,
            // Prioritize relevance or newest first if relevance is complex (default to newest)
            orderBy: {
                createdAt: 'desc', 
            },
            select: {
                id: true,
                stageName: true,
                artistType: true,
                subArtistType: true,
                shortBio: true,
                performingLanguage: true,
                performingEventType: true,
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        avatar: true,
                        city: true,
                    },
                },
            },
        });

        // --- 5. Format Response and Return ---
        
        const metadata = {
            total: totalArtists,
            page: page,
            limit: limit,
            totalPages: Math.ceil(totalArtists / limit),
        };

        return successResponse(
            { artists, metadata },
            'Artist search results retrieved successfully.',
            200
        );

    } catch (error) {
        console.error('GET Artists Search API Error:', error);
        return ApiErrors.internalError('An unexpected error occurred during artist search.');
    }
}
