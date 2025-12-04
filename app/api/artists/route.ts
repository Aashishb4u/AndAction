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

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

export async function GET(request: NextRequest): Promise<NextResponse<any>> {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    // ----- NEW: Optional location params -----
    const lat = parseFloat(searchParams.get("lat") || "");
    const lng = parseFloat(searchParams.get("lng") || "");

    // Helper: Reverse geocode lat/lng → state
    async function getStateFromLatLng(lat: number, lng: number) {
      if (!lat || !lng) return null;

      try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
        const res = await fetch(url, {
          headers: { "User-Agent": "Artist-App" },
          cache: "no-store",
        });

        const data = await res.json();
        return data?.address?.state || null;
      } catch (err) {
        console.error("Reverse geocode failed:", err);
        return null;
      }
    }

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

    // state from query (user may override location)
    let state = searchParams.get("state");

    const budget = searchParams.get("budget");

    if (type) where.artistType = { equals: type, mode: "insensitive" };
    if (subType) where.subArtistType = { equals: subType, mode: "insensitive" };
    if (language)
      where.performingLanguage = { contains: language, mode: "insensitive" };
    if (eventType)
      where.performingEventType = { contains: eventType, mode: "insensitive" };

    // ----- NEW: Auto-detect state from lat/lng if state filter NOT provided -----
    if (!state && lat && lng) {
      state = await getStateFromLatLng(lat, lng);
      console.log("Auto-detected state from location:", state);
    }

    // Apply state filter ONLY if we have a state
    if (state) {
      where.performingStates = { contains: state, mode: "insensitive" };
    }

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

    // 3. Verification & Role filter
    const verifiedParam = searchParams.get("verified");

    const userFilter: Prisma.UserWhereInput = {
      role: "artist",
    };

    // Default: Only verified artists
    if (verifiedParam !== "false") {
      userFilter.isAccountVerified = true;
      userFilter.isArtistVerified = true;
    }

    if (gender) {
      userFilter.gender = { equals: gender, mode: "insensitive" };
    }

    where.user = { is: userFilter };

    // ----- Database Query -----
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

    const metadata = {
      total: totalArtists,
      page,
      limit,
      totalPages: Math.ceil(totalArtists / limit),
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
