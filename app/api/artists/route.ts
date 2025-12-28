/**
 * app/api/artists/route.ts
 *
 * Public artist listing API with search, filtering, verification toggle & pagination.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiErrors, successResponse } from "@/lib/api-response";
import { Prisma } from "@prisma/client";

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

async function getStateFromLatLng(lat: number, lng: number) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Artist-App" },
      cache: "no-store",
    });

    const data = await res.json();
    return data?.address?.state || null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest): Promise<NextResponse<any>> {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    // ---------------------------
    // LOCATION (lat/lng → state)
    // ---------------------------
    const lat = parseFloat(searchParams.get("lat") || "");
    const lng = parseFloat(searchParams.get("lng") || "");

    // ---------------------------
    // PAGINATION
    // ---------------------------
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    let limit = parseInt(searchParams.get("limit") || DEFAULT_PAGE_SIZE.toString());

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

    let state = searchParams.get("state");
    if (!state && lat && lng) state = await getStateFromLatLng(lat, lng);

    // ---------------------------
    // WHERE CLAUSE
    // ---------------------------
    const where: Prisma.ArtistWhereInput = {};

    // 🔍 SEARCH (name or bio)
    if (search) {
      where.OR = [
        { stageName: { contains: search, mode: "insensitive" } },
        { shortBio: { contains: search, mode: "insensitive" } },
      ];
    }

    // ---------------------------
    // REQUIRED FILTER: artistType
    // ---------------------------
    if (type) {
      where.artistType = { contains: type, mode: "insensitive" };
    }

    // ---------------------------
    // OPTIONAL MATCH FILTERS (OR)
    // ---------------------------
    const dynamicOrFilters: Prisma.ArtistWhereInput[] = [];

    if (subType) {
      dynamicOrFilters.push({
        subArtistType: { contains: subType, mode: "insensitive" },
      });
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

    if (state) {
      dynamicOrFilters.push({
        performingStates: { contains: state, mode: "insensitive" },
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
              { OR: [{ soloChargesTo: null }, { soloChargesTo: { lte: max } }] },
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

    where.user = { is: userFilter };

    // ---------------------------
    // QUERY DATABASE
    // ---------------------------
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
      200
    );
  } catch (error) {
    console.error("GET Artists API Error:", error);
    return ApiErrors.internalError("An unexpected error occurred while fetching artists.");
  }
}
