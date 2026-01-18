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
            // Search across stageName, artistType, and user fields
            where.OR = [
                { stageName: { contains: queryTerm, mode: 'insensitive' } },
                { artistType: { contains: queryTerm, mode: 'insensitive' } },
                {
                  user: {
                    OR: [
                      { firstName: { contains: queryTerm, mode: 'insensitive' } },
                      { lastName: { contains: queryTerm, mode: 'insensitive' } },
                    ],
                  },
                },
            ];
        } else {
            return ApiErrors.badRequest('A search query parameter "q" is required for this endpoint.');
        }

        // --- 3. Only show fully public, verified Artists (Security/Quality Filter) ---
        // Commenting out strict verification for debugging
        // where.user = {
        //     role: 'artist',
        //     isAccountVerified: true,
        //     isArtistVerified: true,
        // };


        // --- 4. Database Query ---

        // Count total results for pagination metadata
        const totalArtists = await prisma.artist.count({ where });

        const artists = await prisma.artist.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
                createdAt: 'desc',
            },
            select: {
                id: true,
                stageName: true,
                artistType: true,
                user: {
                    select: {
                        avatar: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });

        // Map to minimal info for suggestions
        const results = artists.map((a) => ({
            id: a.id,
            name: a.stageName || `${a.user?.firstName || ''} ${a.user?.lastName || ''}`.trim(),
            category: a.artistType,
            image: a.user?.avatar && a.user?.avatar.startsWith('/') ? a.user.avatar : '/icons/images.jpeg',
        }));

        console.log('Artist search query:', queryTerm, '| Results:', artists.length);

        // --- 5. Format Response and Return ---
        
        const metadata = {
            total: totalArtists,
            page: page,
            limit: limit,
            totalPages: Math.ceil(totalArtists / limit),
        };

        return successResponse(
            { artists: results, metadata },
            'Artist search results retrieved successfully.',
            200
        );

    } catch (error) {
        console.error('GET Artists Search API Error:', error);
        return ApiErrors.internalError('An unexpected error occurred during artist search.');
    }
}
