/**
 * app/api/artists/route.ts
 *
 * Public artist listing API with search, filtering, verification toggle & pagination.
 * This endpoint is OPEN – no authentication required.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiErrors, successResponse } from "@/lib/api-response";
import { Prisma } from "@prisma/client";

// Pagination defaults
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

export async function GET(request: NextRequest): Promise<NextResponse<any>> {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    // ----- Pagination -----
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    let limit = parseInt(
      searchParams.get("limit") || DEFAULT_PAGE_SIZE.toString(),
      10
    );
    if (limit > MAX_PAGE_SIZE) limit = MAX_PAGE_SIZE;
    if (limit < 1) limit = DEFAULT_PAGE_SIZE;

    const skip = (page - 1) * limit;

    // ----- Base WHERE clause -----
    const where: Prisma.ArtistWhereInput = {};

    // 1. Full-text search (stageName OR shortBio)
    const search = searchParams.get("search")?.trim();
    if (search) {
      where.OR = [
        { stageName: { contains: search, mode: "insensitive" } },
        { shortBio: { contains: search, mode: "insensitive" } },
      ];
    }

    // 2. Simple filters
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

    // Budget range filter (e.g. "50000-150000")
    if (budget && budget.includes("-")) {
      const [minStr, maxStr] = budget.split("-");
      const min = Number(minStr);
      const max = Number(maxStr);

      if (!isNaN(min) && !isNaN(max)) {
        where.AND = [
          ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
          {
            OR: [
              {
                AND: [
                  { soloChargesFrom: { gte: min } },
                  { soloChargesTo: { lte: max } },
                ],
              },
              {
                AND: [
                  { chargesWithBacklineFrom: { gte: min } },
                  { chargesWithBacklineTo: { lte: max } },
                ],
              },
            ],
          },
        ];
      }
    }

    // 3. Verification & Role filter (with optional ?verified=false to bypass)
    const verifiedParam = searchParams.get("verified"); // "true" | "false" | null

    const userFilter: Prisma.UserWhereInput = {
      role: "artist",
    };

    // Default (no param or "true") → only fully verified artists
    // Only when explicitly ?verified=false we show unverified ones
    if (verifiedParam !== "false") {
      userFilter.isAccountVerified = true;
      userFilter.isArtistVerified = true;
    }

    // Gender filter (if provided) goes inside the same user.is object
    if (gender) {
      userFilter.gender = { equals: gender, mode: "insensitive" };
    }

    where.user = { is: userFilter };

    // ----- Queries -----
    const totalArtists = await prisma.artist.count({ where });

    const artists = await prisma.artist.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
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
        chargesWithBacklineFrom: true,
        chargesWithBacklineTo: true,
        performingDurationFrom: true,
        performingDurationTo: true,
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

    // ----- Response -----
    const metadata = {
      total: totalArtists,
      page,
      limit,
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
