/**
 * app/api/videos/route.ts
 *
 * Handles the retrieval of the main video feed (list of approved videos).
 * Implements pagination, type filtering, and artist filtering.
 *
 * Optional: add &withBookmarks=true to include bookmark info for logged-in user
 *
 * GET /api/videos
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiErrors, successResponse } from "@/lib/api-response";
import { auth } from "@/auth";
import { Prisma } from "@prisma/client";

// --- Configuration ---
const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;

export async function GET(request: NextRequest): Promise<NextResponse<any>> {
  try {
    const url = new URL(request.url);

    const page = parseInt(url.searchParams.get("page") || "1", 10);
    let limit = parseInt(
      url.searchParams.get("limit") || DEFAULT_LIMIT.toString(),
      10,
    );
    const type = url.searchParams.get("type"); // "shorts" | "videos" | null
    const artistId = url.searchParams.get("artistId"); // filter by artist
    const withBookmarks = url.searchParams.get("withBookmarks") === "true"; // NEW 🔥
    const random = url.searchParams.get("random") === "true";
    const artistCategory = url.searchParams.get("category") || "all";

    // Check logged in user if bookmark details requested
    let userId: string | null = null;

    if (withBookmarks) {
      const session = await auth();
      userId = session?.user?.id || null;
    }

    // Build filters
    const where: Prisma.VideoWhereInput = { isApproved: true };

    if (artistCategory && artistCategory !== "all") {
      where.user = {
        artist: {
          artistType: {
            contains: artistCategory,
            mode: "insensitive",
          },
        },
      };
    }
    // Type filter
    if (type === "shorts") where.isShort = true;
    if (type === "videos") where.isShort = false;

    // Artist filter (NEW)
    if (artistId) where.userId = artistId;

    // Ensure limit is reasonable
    limit = Math.min(limit, MAX_LIMIT);
    limit = Math.max(1, limit);

    const offset = (page - 1) * limit;

    const videoSelect = {
      id: true,
      title: true,
      url: true,
      thumbnailUrl: true,
      duration: true,
      views: true,
      createdAt: true,
      isShort: true,
      user: {
        select: {
          id: true,
          name: true,
          firstName: true,
          lastName: true,
          avatar: true,
          image: true,
          isArtistVerified: true,
          artist: {
            select: {
              id: true,
              artistType: true,
            },
          },
        },
      },
      ...(withBookmarks && userId
        ? {
            bookmarkedByUsers: {
              where: { userId },
              select: { id: true },
            },
          }
        : {}),
    };

    let videos: any[];
    let totalCount: number;

    if (random) {
      // Build SQL fragments for ORDER BY RANDOM() via raw query
      const typeCondition =
        type === "shorts"
          ? Prisma.sql`AND v."isShort" = true`
          : type === "videos"
          ? Prisma.sql`AND v."isShort" = false`
          : Prisma.empty;

      const artistCondition = artistId
        ? Prisma.sql`AND v."userId" = ${artistId}`
        : Prisma.empty;

      const categoryJoin =
        artistCategory && artistCategory !== "all"
          ? Prisma.sql`JOIN "users" cu ON v."userId" = cu.id JOIN "artists" ca ON cu.id = ca."userId"`
          : Prisma.empty;

      const categoryCondition =
        artistCategory && artistCategory !== "all"
          ? Prisma.sql`AND ca."artistType" ILIKE ${`%${artistCategory}%`}`
          : Prisma.empty;

      const [idRows, count] = await Promise.all([
        prisma.$queryRaw<{ id: string }[]>`
          SELECT v.id
          FROM "videos" v
          ${categoryJoin}
          WHERE v."isApproved" = true
          ${typeCondition}
          ${artistCondition}
          ${categoryCondition}
          ORDER BY RANDOM()
          LIMIT ${limit} OFFSET ${offset}
        `,
        prisma.video.count({ where }),
      ]);

      totalCount = count;
      const randomIds = idRows.map((r) => r.id);

      if (randomIds.length > 0) {
        const fetched = await prisma.video.findMany({
          where: { id: { in: randomIds } },
          select: videoSelect as any,
        });
        const videoMap = new Map(fetched.map((v: any) => [v.id, v]));
        videos = randomIds.map((id) => videoMap.get(id)).filter(Boolean) as any[];
      } else {
        videos = [];
      }
    } else {
      // Default: newest-first ordering
      const [fetched, count] = await Promise.all([
        prisma.video.findMany({
          where,
          skip: offset,
          take: limit,
          orderBy: { createdAt: "desc" },
          select: videoSelect as any,
        }),
        prisma.video.count({ where }),
      ]);
      videos = fetched;
      totalCount = count;
    }

    const totalPages = Math.ceil(totalCount / limit);

    // 3. Inject bookmark state (only when withBookmarks=true)
    let processedVideos = videos;

    if (withBookmarks) {
      processedVideos = videos.map((v: any) => ({
        ...v,
        isBookmarked: (v.bookmarkedByUsers?.length ?? 0) > 0,
        bookmarkId: v.bookmarkedByUsers?.[0]?.id || null,
        bookmarkedByUsers: undefined, // remove raw join key
      }));
    }

    return successResponse(
      {
        videos: processedVideos,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
      `Successfully retrieved ${processedVideos.length} videos for page ${page}.`,
      200,
    );
  } catch (error) {
    console.error("GET /api/videos API Error:", error);
    return ApiErrors.internalError(
      "An unexpected error occurred while fetching videos.",
    );
  }
}
