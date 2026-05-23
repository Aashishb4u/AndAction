/**
 * app/api/artists/search/route.ts
 *
 * Handles the public search functionality for Artist profiles using a dedicated query term.
 * This API is OPEN and does not require authentication.
 *
 * Priority 12: GET /api/artists/search
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiErrors, successResponse } from "@/lib/api-response";
import { Prisma } from "@prisma/client";
import { getArtistTypeMatches } from "@/lib/artist-type-mapping";

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

    const lat = parseFloat(searchParams.get("lat") || "");
    const lng = parseFloat(searchParams.get("lng") || "");
    const hasCoords =
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180;

    // --- 1. Pagination Setup ---
    const page = parseInt(searchParams.get("page") || "1", 10);
    let limit = parseInt(
      searchParams.get("limit") || DEFAULT_PAGE_SIZE.toString(),
      10,
    );

    if (limit > MAX_PAGE_SIZE) {
      limit = MAX_PAGE_SIZE;
    }

    const skip = (page - 1) * limit;

    // --- 2. Filtering and Search Query (q) ---
    const where: Prisma.ArtistWhereInput = {};

    // A. Dedicated Search Term (q)
    const queryTerm = searchParams.get("q")?.trim();

    if (queryTerm) {
      // Try to match as artist type first
      const typeMatches = getArtistTypeMatches(queryTerm);
      
      // Search across stageName, artistType (with mapping), and user fields
      where.OR = [
        { stageName: { contains: queryTerm, mode: "insensitive" } },
        { subArtistType: { contains: queryTerm, mode: "insensitive" } },
        { artistType: { in: typeMatches } },
        { artistType: { contains: queryTerm, mode: "insensitive" } },
        {
          user: {
            is: {
              OR: [
                { firstName: { contains: queryTerm, mode: "insensitive" } },
                { lastName: { contains: queryTerm, mode: "insensitive" } },
              ],
            },
          },
        },
      ];
    } else {
      return ApiErrors.badRequest(
        'A search query parameter "q" is required for this endpoint.',
      );
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

    const artists = hasCoords
      ? await prisma.$queryRaw<
          Array<{
            id: string;
            profileImage: string | null;
            stageName: string | null;
            artistType: string | null;
            subArtistType: string | null;
            avatar: string | null;
            firstName: string | null;
            lastName: string | null;
            image: string | null;
            distance: number | null;
          }>
        >(
          (() => {
            const like = `%${queryTerm}%`;
            const typeMatches = getArtistTypeMatches(queryTerm);
            const indiaBounds = {
              minLat: 6,
              maxLat: 37.5,
              minLng: 68,
              maxLng: 98,
            } as const;

            const effectiveLatSql = Prisma.sql`CASE
              WHEN u.latitude BETWEEN ${indiaBounds.minLat} AND ${indiaBounds.maxLat}
                AND u.longitude BETWEEN ${indiaBounds.minLng} AND ${indiaBounds.maxLng}
                THEN u.latitude
              WHEN u.longitude BETWEEN ${indiaBounds.minLat} AND ${indiaBounds.maxLat}
                AND u.latitude BETWEEN ${indiaBounds.minLng} AND ${indiaBounds.maxLng}
                THEN u.longitude
              ELSE u.latitude
            END`;

            const effectiveLngSql = Prisma.sql`CASE
              WHEN u.latitude BETWEEN ${indiaBounds.minLat} AND ${indiaBounds.maxLat}
                AND u.longitude BETWEEN ${indiaBounds.minLng} AND ${indiaBounds.maxLng}
                THEN u.longitude
              WHEN u.longitude BETWEEN ${indiaBounds.minLat} AND ${indiaBounds.maxLat}
                AND u.latitude BETWEEN ${indiaBounds.minLng} AND ${indiaBounds.maxLng}
                THEN u.latitude
              ELSE u.longitude
            END`;

            const orConditions: Prisma.Sql[] = [
              Prisma.sql`a."stageName" ILIKE ${like}`,
              Prisma.sql`a."subArtistType" ILIKE ${like}`,
              Prisma.sql`a."artistType" ILIKE ${like}`,
              Prisma.sql`u."firstName" ILIKE ${like}`,
              Prisma.sql`u."lastName" ILIKE ${like}`,
            ];

            if (Array.isArray(typeMatches) && typeMatches.length > 0) {
              orConditions.push(
                Prisma.sql`a."artistType" IN (${Prisma.join(typeMatches)})`,
              );
            }

            const whereSql = Prisma.sql`WHERE (${Prisma.join(orConditions, Prisma.sql` OR `)})`;

            return Prisma.sql`
              SELECT
                a.id,
                a."profileImage",
                a."stageName",
                a."artistType",
                a."subArtistType",
                u.avatar,
                u."firstName",
                u."lastName",
                u.image,
                CASE
                  WHEN u.latitude IS NOT NULL AND u.longitude IS NOT NULL THEN
                    (
                      6371 * acos(
                        cos(radians(${lat})) *
                        cos(radians(${effectiveLatSql})) *
                        cos(radians(${effectiveLngSql}) - radians(${lng})) +
                        sin(radians(${lat})) *
                        sin(radians(${effectiveLatSql}))
                      )
                    )
                  ELSE NULL
                END AS distance
              FROM "artists" a
              INNER JOIN "users" u ON a."userId" = u.id
              ${whereSql}
              ORDER BY distance ASC NULLS LAST, a.id ASC
              LIMIT ${limit} OFFSET ${skip}
            `;
          })(),
        )
      : await prisma.artist.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            createdAt: "desc",
          },
          select: {
            id: true,
            profileImage: true,
            stageName: true,
            artistType: true,
            subArtistType: true,
            user: {
              select: {
                avatar: true,
                firstName: true,
                lastName: true,
                image: true,
              },
            },
          },
        });

    // Map to minimal info for suggestions
    const results = (artists as any[]).map((a) => {
      const stageName = a.stageName ?? null;
      const firstName = hasCoords ? a.firstName ?? null : a.user?.firstName ?? null;
      const lastName = hasCoords ? a.lastName ?? null : a.user?.lastName ?? null;

      return {
        id: a.id,
        name: stageName || `${firstName || ""} ${lastName || ""}`.trim(),
        category: a.artistType,
        subArtistTypes: (a.subArtistType || "")
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean),
        image: a.profileImage || null,
      };
    });

    console.log(
      "Artist search query:",
      queryTerm,
      "| Results:",
      artists.length,
    );

    // --- 5. Format Response and Return ---

    const metadata = {
      total: totalArtists,
      page: page,
      limit: limit,
      totalPages: Math.ceil(totalArtists / limit),
    };

    return successResponse(
      { artists: results, metadata },
      "Artist search results retrieved successfully.",
      200,
    );
  } catch (error) {
    console.error("GET Artists Search API Error:", error);
    return ApiErrors.internalError(
      "An unexpected error occurred during artist search.",
    );
  }
}
