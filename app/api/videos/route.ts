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
import { getArtistTypeMatches } from "@/lib/artist-type-mapping";

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
    // Seed for consistent random ordering across paginated pages
    const seedParam = url.searchParams.get("seed");
    const seed = seedParam ? parseFloat(seedParam) : null;

    // Check logged in user if bookmark details requested
    let userId: string | null = null;

    if (withBookmarks) {
      const session = await auth();
      userId = session?.user?.id || null;
    }

    // Build filters
    const where: Prisma.VideoWhereInput = { isApproved: true };

    if (artistCategory && artistCategory !== "all") {
      const matchValues = getArtistTypeMatches(artistCategory);
      where.user = {
        artists: {
          some: {
            OR: matchValues.map((val) => ({
              artistType: { contains: val, mode: "insensitive" as const },
            })),
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
          artists: {
            take: 1,
            orderBy: { profileOrder: "asc" },
            select: { id: true, artistType: true, stageName: true, profileImage: true },
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

      let categoryCondition = Prisma.empty;
      if (artistCategory && artistCategory !== "all") {
        const matchValues = getArtistTypeMatches(artistCategory);
        const conditions = matchValues.map(
          (val) => Prisma.sql`LOWER(TRIM(ca."artistType")) = LOWER(${val})`
        );
        categoryCondition = Prisma.sql`AND (${Prisma.join(conditions, " OR ")})`;
      }

      // Round-robin by artist: rank each artist's videos using MD5(id||seed),
      // then interleave one video per artist per round so every artist appears
      // on page 1 regardless of how many videos they have.
      // Artist order within each round is also randomised by MD5(userId||seed).
      const hasSeed = seed !== null && !isNaN(seed) && seed >= -1 && seed <= 1;
      // Fall back to a server-side random seed so requests without a seed still
      // get consistent intra-request pagination (same query, same OFFSET).
      const effectiveSeedStr = String(hasSeed ? seed : Math.random() * 2 - 1);

      const [idRows, countRows] = await Promise.all([
        prisma.$queryRaw<{ id: string }[]>`
          WITH artist_ranked AS (
            SELECT
              v.id,
              ROW_NUMBER() OVER (
                PARTITION BY v."userId"
                ORDER BY MD5(v.id || ${effectiveSeedStr})
              ) AS video_rank,
              MD5(v."userId" || ${effectiveSeedStr}) AS artist_sort_key
            FROM "videos" v
            ${categoryJoin}
            WHERE v."isApproved" = true
            ${typeCondition}
            ${artistCondition}
            ${categoryCondition}
          )
          SELECT id
          FROM artist_ranked
          ORDER BY video_rank, artist_sort_key
          LIMIT ${limit} OFFSET ${offset}
        `,
        prisma.$queryRaw<{ count: bigint }[]>`
          SELECT COUNT(v.id) AS count
          FROM "videos" v
          ${categoryJoin}
          WHERE v."isApproved" = true
          ${typeCondition}
          ${artistCondition}
          ${categoryCondition}
        `,
      ]);

      totalCount = Number(countRows[0]?.count ?? 0);
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
