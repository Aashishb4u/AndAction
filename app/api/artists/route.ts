/**
 * app/api/artists/route.ts
 *
 * Handles the public listing and searching of Artist profiles.
 * This API is OPEN and does not require authentication.
 *
 * Priority 10: GET /api/artists
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiErrors, successResponse } from "@/lib/api-response";
import { Prisma } from "@prisma/client";

// Define pagination defaults
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

/**
 * Handles GET requests to retrieve a list of public artist profiles.
 * Supports filtering, searching, and pagination via URL query parameters.
 */
export async function GET(request: NextRequest): Promise<NextResponse<any>> {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    // --- 1. Pagination Setup ---
    const page = parseInt(searchParams.get("page") || "1", 10);
    let limit = parseInt(
      searchParams.get("limit") || DEFAULT_PAGE_SIZE.toString(),
      10
    );
    // Clamp limit to maximum allowed size
    if (limit > MAX_PAGE_SIZE) {
      limit = MAX_PAGE_SIZE;
    }
    const skip = (page - 1) * limit;
    // --- 2. Filtering and Search Setup ---
    // Start building the WHERE clause for Prisma
    const where: Prisma.ArtistWhereInput = {};
    // A. Search by stageName or shortBio
    const search = searchParams.get("search")?.trim();
    if (search) {
      // Use OR logic for searching multiple fields (requires case-insensitive match for PostgreSQL)
      where.OR = [
        { stageName: { contains: search, mode: "insensitive" as "default" } },
        { shortBio: { contains: search, mode: "insensitive" as "default" } },
      ];
    }
    const type = searchParams.get("type");
    const subType = searchParams.get("subType");
    const gender = searchParams.get("gender");
    const language = searchParams.get("language");
    const eventType = searchParams.get("eventType");
    const state = searchParams.get("state");
    const budget = searchParams.get("budget");
    if (type) where.artistType = { equals: type, mode: "insensitive" };
    if (subType) where.subArtistType = { equals: subType, mode: "insensitive" };
    if (language)
      where.performingLanguage = { contains: language, mode: "insensitive" };
    if (eventType)
      where.performingEventType = { contains: eventType, mode: "insensitive" };
    if (state)
      where.performingStates = { contains: state, mode: "insensitive" };
    if (budget && budget.includes("-")) {
      const [min, max] = budget.split("-").map(Number);
      if (!isNaN(min) && !isNaN(max)) {
        where.AND = [
          ...(Array.isArray(where.AND)
            ? where.AND
            : where.AND
            ? [where.AND]
            : []),
          {
            OR: [
              { soloChargesFrom: { gte: min, lte: max } },
              { chargesWithBacklineFrom: { gte: min, lte: max } },
            ],
          },
        ];
      }
    }
    // --- 3. Only show fully created, verified Artists (Security/Quality Filter) ---
    // Join with the User model and ensure role is 'artist' and isAccountVerified is true
    // Merge with any existing user conditions (e.g., gender filter)
    where.user = {
      is: {
        role: "artist",
        isAccountVerified: true, // Only show verified emails
        isArtistVerified: true, // Only show profiles approved by admin (or marked as verified by self)
        ...(gender && { gender: { equals: gender, mode: "insensitive" } }),
      },
    };
    // --- 4. Database Query ---
    // Count total results for pagination metadata
    const totalArtists = await prisma.artist.count({ where });

    const artists = await prisma.artist.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        // Default sorting by creation date (newest first)
        createdAt: "desc",
      },
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
        soloChargesFrom: true,
        soloChargesTo: true,
        performingDurationFrom: true,
        performingDurationTo: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
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
      hasMore: page * limit < totalArtists,
    };
    return successResponse(
      { artists, metadata },
      "Artist list retrieved successfully.",
      200
    );
  } catch (error) {
    console.error("GET Artists API Error:", error);
    return ApiErrors.internalError(
      "An unexpected error occurred while fetching the artist list."
    );
  }
}
