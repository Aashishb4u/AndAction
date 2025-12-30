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

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ApiErrors, successResponse } from '@/lib/api-response';
import { auth } from '@/auth';

// --- Configuration ---
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

export async function GET(request: NextRequest): Promise<NextResponse<any>> {
  try {
    const url = new URL(request.url);

    const page = parseInt(url.searchParams.get("page") || "1", 10);
    let limit = parseInt(url.searchParams.get("limit") || DEFAULT_LIMIT.toString(), 10);
    const type = url.searchParams.get("type"); // "shorts" | "videos" | null
    const artistId = url.searchParams.get("artistId"); // filter by artist
    const withBookmarks = url.searchParams.get("withBookmarks") === "true"; // NEW 🔥

    // Check logged in user if bookmark details requested
    let userId: string | null = null;

    if (withBookmarks) {
      const session = await auth();
      userId = session?.user?.id || null;
    }

    // Build filters
    const where: any = { isApproved: true };

    // Type filter
    if (type === "shorts") where.isShort = true;
    if (type === "videos") where.isShort = false;

    // Artist filter (NEW)
    if (artistId) where.userId = artistId;

    // Ensure limit is reasonable
    limit = Math.min(limit, MAX_LIMIT);
    limit = Math.max(1, limit);

    const offset = (page - 1) * limit;

    // 1. Fetch videos (with optional bookmark join)
    const videos = await prisma.video.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      select: {
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
            firstName: true,
            lastName: true,
            avatar: true,
            isArtistVerified: true,
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
      },
    });

    // 2. Count total videos for pagination
    const totalCount = await prisma.video.count({ where });

    const totalPages = Math.ceil(totalCount / limit);

    // 3. Inject bookmark state (only when withBookmarks=true)
    let processedVideos = videos;

    if (withBookmarks) {
      processedVideos = videos.map((v: any) => ({
        ...v,
        isBookmarked: v.bookmarks?.length > 0,
        bookmarkId: v.bookmarks?.[0]?.id || null,
        bookmarks: undefined, // remove raw join key
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
      200
    );

  } catch (error) {
    console.error("GET /api/videos API Error:", error);
    return ApiErrors.internalError(
      "An unexpected error occurred while fetching videos."
    );
  }
}
