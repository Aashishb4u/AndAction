/**
 * app/api/artists/route.ts
 *
 * Public artist listing API with search, filtering, verification toggle & pagination.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiErrors, successResponse } from "@/lib/api-response";
import { Prisma } from "@prisma/client";
import { getArtistTypeMatches } from "@/lib/artist-type-mapping";

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

function calculateDistanceKm(
  userLat: number,
  userLng: number,
  targetLat: number,
  targetLng: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(targetLat - userLat);
  const dLng = toRad(targetLng - userLng);
  const lat1 = toRad(userLat);
  const lat2 = toRad(targetLat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return 6371 * c;
}

export async function GET(request: NextRequest): Promise<NextResponse<any>> {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    console.log(
      "Received GET /api/artists with params:",
      Object.fromEntries(searchParams.entries()),
    );

    // ---------------------------
    // LOCATION (lat/lng → state)
    // ---------------------------
    const lat = parseFloat(searchParams.get("lat") || "");
    const lng = parseFloat(searchParams.get("lng") || "");
    const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

    // ---------------------------
    // COUNT ONLY MODE (for filter preview)
    // ---------------------------
    const countOnly = searchParams.get("countOnly") === "true";

    // ---------------------------
    // PAGINATION
    // ---------------------------
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    let limit = parseInt(
      searchParams.get("limit") || DEFAULT_PAGE_SIZE.toString(),
    );

    if (limit > MAX_PAGE_SIZE) limit = MAX_PAGE_SIZE;
    if (limit < 1) limit = DEFAULT_PAGE_SIZE;

    const skip = (page - 1) * limit;

    // ---------------------------
    // FILTER PARAMETERS
    // ---------------------------
    const search = searchParams.get("search")?.trim();
    const type = searchParams.get("type");
    const subType = searchParams.get("subType");
    const gender = searchParams.get("gender");
    const language = searchParams.get("language");
    const eventType = searchParams.get("eventType");
    const budget = searchParams.get("budget");
    const location = searchParams.get("location");

    const requestedState = searchParams.get("state")?.trim() || "";

    console.log("Filter Params:", {
      search,
      type,
      subType,
    });
    // ---------------------------
    // WHERE CLAUSE
    // ---------------------------
    const where: Prisma.ArtistWhereInput = {};

    // 🔍 SEARCH (name, bio, or user firstName/lastName)
    if (search) {
      where.OR = [
        { stageName: { contains: search, mode: "insensitive" } },
        { shortBio: { contains: search, mode: "insensitive" } },
        {
          user: {
            is: { firstName: { contains: search, mode: "insensitive" } },
          },
        },
        {
          user: { is: { lastName: { contains: search, mode: "insensitive" } } },
        },
      ];
    }

    // ---------------------------
    // REQUIRED FILTER: artistType
    // ---------------------------
    if (type) {
      const typeMatches = getArtistTypeMatches(type);
      where.artistType = { in: typeMatches };
    }

    // ---------------------------
    // OPTIONAL MATCH FILTERS (OR)
    // ---------------------------
    const dynamicOrFilters: Prisma.ArtistWhereInput[] = [];

    if (subType) {
      // Support comma-separated sub-types: match any of the provided values
      const subTypes = subType.split(",").map((s) => s.trim()).filter(Boolean);
      if (subTypes.length === 1) {
        dynamicOrFilters.push({
          subArtistType: { contains: subTypes[0], mode: "insensitive" },
        });
      } else if (subTypes.length > 1) {
        dynamicOrFilters.push({
          OR: subTypes.map((st) => ({
            subArtistType: { contains: st, mode: "insensitive" },
          })),
        });
      }
    }

    if (language) {
      dynamicOrFilters.push({
        performingLanguage: { contains: language, mode: "insensitive" },
      });
    }

    if (eventType) {
      dynamicOrFilters.push({
        performingEventType: { contains: eventType, mode: "insensitive" },
      });
    }

    // Explicit state filter from user selection.
    if (requestedState) {
      dynamicOrFilters.push({
        performingStates: { contains: requestedState, mode: "insensitive" },
      });
    }

    if (dynamicOrFilters.length > 0) {
      where.OR = [...(where.OR ?? []), ...dynamicOrFilters];
    }

    // ---------------------------
    // BUDGET FILTER (supports null ranges)
    // ---------------------------
    if (budget?.includes("-")) {
      const [minStr, maxStr] = budget.split("-");
      const min = Number(minStr);
      const max = Number(maxStr);

      if (!isNaN(min) && !isNaN(max)) {
        where.OR = [
          ...(where.OR ?? []),

          // SOLO charges
          {
            AND: [
              { soloChargesFrom: { gte: min } },
              {
                OR: [{ soloChargesTo: null }, { soloChargesTo: { lte: max } }],
              },
            ],
          },

          // BACKLINE charges
          {
            AND: [
              { chargesWithBacklineFrom: { gte: min } },
              {
                OR: [
                  { chargesWithBacklineTo: null },
                  { chargesWithBacklineTo: { lte: max } },
                ],
              },
            ],
          },
        ];
      }
    }

    // ---------------------------
    // USER VERIFICATION LOGIC — FIXED
    // ---------------------------
    const verifiedParam = searchParams.get("verified");

    const userFilter: Prisma.UserWhereInput = {
      role: "artist",
    };

    // ⭐ Now public gets ALL artists unless ?verified=true explicitly
    if (verifiedParam === "true") {
      userFilter.isAccountVerified = true;
      userFilter.isArtistVerified = true;
    }

    if (gender) {
      userFilter.gender = { equals: gender, mode: "insensitive" };
    }

    if (location) {
      userFilter.city = { contains: location, mode: "insensitive" };
    }

    where.user = { is: userFilter };

    // ---------------------------
    // QUERY DATABASE
    // ---------------------------
    const totalArtists = await prisma.artist.count({ where });

    // If countOnly mode, return just the count
    if (countOnly) {
      return successResponse(
        {
          count: totalArtists,
          metadata: {
            total: totalArtists,
            page,
            limit,
            totalPages: Math.ceil(totalArtists / limit),
          },
        },
        "Artist count retrieved successfully.",
        200,
      );
    }

    const baseSelect = {
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
          latitude: true,
          longitude: true,
        },
      },
    } as const;

    let artists: any[] = [];

    if (hasCoords && !requestedState) {
      const allArtists = await prisma.artist.findMany({
        where,
        orderBy: { createdAt: "desc" },
        select: baseSelect,
      });

      const withDistance = allArtists.map((artist) => {
        const artistLat = artist.user.latitude;
        const artistLng = artist.user.longitude;

        if (
          typeof artistLat === "number" &&
          Number.isFinite(artistLat) &&
          typeof artistLng === "number" &&
          Number.isFinite(artistLng)
        ) {
          return {
            ...artist,
            distance: calculateDistanceKm(lat, lng, artistLat, artistLng),
          };
        }

        return {
          ...artist,
          distance: null,
        };
      });

      withDistance.sort((a, b) => {
        if (a.distance === null && b.distance === null) return 0;
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });

      artists = withDistance.slice(skip, skip + limit);
    } else {
      artists = await prisma.artist.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: baseSelect,
      });
    }

    console.log(
      `Fetched ${artists.length} artists (Page: ${page}, Limit: ${limit})`,
    );

    return successResponse(
      {
        artists,
        metadata: {
          total: totalArtists,
          page,
          limit,
          totalPages: Math.ceil(totalArtists / limit),
        },
      },
      "Artist list retrieved successfully.",
      200,
    );
  } catch (error) {
    console.error("GET Artists API Error:", error);
    return ApiErrors.internalError(
      "An unexpected error occurred while fetching artists.",
    );
  }
}
