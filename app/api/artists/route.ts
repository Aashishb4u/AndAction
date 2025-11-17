/**
 * app/api/artists/route.ts
 * Public artist listing API with search, filtering & pagination.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ApiErrors, successResponse } from '@/lib/api-response';
import { Prisma } from '@prisma/client';

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

export async function GET(request: NextRequest): Promise<NextResponse<any>> {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    // ----- Pagination -----
    const page = parseInt(searchParams.get('page') || '1', 10);
    let limit = parseInt(searchParams.get('limit') || DEFAULT_PAGE_SIZE.toString(), 10);
    if (limit > MAX_PAGE_SIZE) limit = MAX_PAGE_SIZE;

    const skip = (page - 1) * limit;

    // ----- Filtering -----
    const where: Prisma.ArtistWhereInput = {};

    // Search by stageName or shortBio
    const search = searchParams.get('search')?.trim();
    if (search) {
      where.OR = [
        { stageName: { contains: search, mode: 'insensitive' } },
        { shortBio: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filter by artist type
    const artistType = searchParams.get('type');
    if (artistType) {
      where.artistType = artistType;
    }

    // Filter by performing states
    const stateFilter = searchParams.get('state');
    if (stateFilter) {
      where.performingStates = { contains: stateFilter, mode: 'insensitive' };
    }

    // ----- Verification Logic -----
    const verifiedParam = searchParams.get('verified'); // "true", "false", null

    // Base user filter
    const userFilter: any = { role: 'artist' };

    if (verifiedParam === 'true') {
      // Only fully verified artists
      userFilter.isArtistVerified = true;
      userFilter.isAccountVerified = true;
    } 
    else if (verifiedParam === 'false') {
      // Show ALL artists (no verification filter)
      // Only require role=artist
    } 
    else {
      // Default safe mode → only show verified artists
      userFilter.isArtistVerified = true;
      userFilter.isAccountVerified = true;
    }

    where.user = userFilter;

    // ----- Database Query -----
    const totalArtists = await prisma.artist.count({ where });

    const artists = await prisma.artist.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        stageName: true,
        artistType: true,
        subArtistType: true,
        shortBio: true,
        performingLanguage: true,
        performingEventType: true,
        performingStates: true,
        yearsOfExperience: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            city: true,
            state: true,
          },
        },
      },
    });

    const metadata = {
      total: totalArtists,
      page,
      limit,
      totalPages: Math.ceil(totalArtists / limit),
    };

    return successResponse(
      { artists, metadata },
      'Artist list retrieved successfully.',
      200
    );

  } catch (error) {
    console.error('GET Artists API Error:', error);
    return ApiErrors.internalError(
      'An unexpected error occurred while fetching the artist list.'
    );
  }
}
