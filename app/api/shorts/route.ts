/**
 * app/api/shorts/route.ts
 *
 * Handles the retrieval of the short-form video feed (shorts).
 * This endpoint relies on the stored `isShort` classification instead of duration
 * so YouTube Shorts remain shorts even when their runtime changes.
 *
 * Priority: GET /api/shorts
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiErrors, successResponse } from "@/lib/api-response";

// --- Configuration ---
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;
export async function GET(request: NextRequest): Promise<NextResponse<any>> {
  try {
    const url = new URL(request.url);

    // 1. Get and Validate Pagination Parameters
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    let limit = parseInt(
      url.searchParams.get("limit") || DEFAULT_LIMIT.toString(),
      10,
    );

    // Enforce limits
    limit = Math.min(limit, MAX_LIMIT);
    limit = Math.max(1, limit);

    const offset = (page - 1) * limit;

    // Base filtering condition: approved content explicitly classified as a short
    const whereClause = {
      isApproved: true,
      isShort: true,
    };

    // 2. Fetch Short Videos
    const shorts = await prisma.video.findMany({
      where: whereClause,
      skip: offset,
      take: limit,
      orderBy: {
        createdAt: "desc", // Sorted by newest first
      },
      select: {
        id: true,
        title: true,
        url: true,
        thumbnailUrl: true,
        duration: true,
        views: true,
        createdAt: true,
        // Include related User/Artist data
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            isArtistVerified: true,
            artists: {
              take: 1,
              orderBy: { profileOrder: "asc" },
              select: { id: true },
            },
          },
        },
      },
    });
    console.log("Fetched shorts:", shorts);

    // 3. Get Total Count for Pagination Metadata
    const totalCount = await prisma.video.count({ where: whereClause });

    // 4. Construct Metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // 5. Success Response
    return successResponse(
      {
        shorts, // Renamed to 'shorts' for the API response consistency
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage,
          hasPrevPage,
        },
      },
      `Successfully retrieved ${shorts.length} short videos for page ${page}.`,
      200,
    );
  } catch (error) {
    console.error("GET /api/shorts API Error:", error);
    return ApiErrors.internalError(
      "An unexpected error occurred while fetching short videos.",
    );
  }
}
