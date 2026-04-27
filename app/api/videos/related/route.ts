/**
 * GET /api/videos/related?videoId=<id>&videosPage=1&shortsPage=1&videosLimit=12&shortsLimit=12
 * Returns:
 *  - main video (only on first page)
 *  - related (full videos) with pagination
 *  - shorts (videos where isShort = true) with pagination
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiErrors, successResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const videoId = req.nextUrl.searchParams.get("videoId");

    if (!videoId) {
      return ApiErrors.badRequest("videoId query parameter is required.");
    }

    const videosPage = parseInt(req.nextUrl.searchParams.get("videosPage") || "1", 10);
    const shortsPage = parseInt(req.nextUrl.searchParams.get("shortsPage") || "1", 10);
    const videosLimit = Math.min(parseInt(req.nextUrl.searchParams.get("videosLimit") || "12", 10), 50);
    const shortsLimit = Math.min(parseInt(req.nextUrl.searchParams.get("shortsLimit") || "12", 10), 50);

    // 1️⃣ Fetch main video
    const mainVideo = await prisma.video.findUnique({
      where: { id: videoId },
      select: {
        id: true,
        title: true,
        description: true,
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
              select: { id: true, profileImage: true, artistType: true, stageName: true },
            },
          },
        },
      },
    });

    if (!mainVideo) {
      return ApiErrors.notFound("Video not found.");
    }

    const artistId = mainVideo.user.id;

    const baseWhere = {
      userId: artistId,
      id: { not: videoId },
      isApproved: true,
    };

    const userSelect = {
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
        select: { id: true, profileImage: true, artistType: true, stageName: true },
      },
    };

    // 2️⃣ Fetch videos and shorts separately with pagination
    const [relatedVideos, relatedVideosCount, shortsVideos, shortsCount] = await Promise.all([
      prisma.video.findMany({
        where: { ...baseWhere, isShort: false },
        orderBy: { createdAt: "desc" },
        skip: (videosPage - 1) * videosLimit,
        take: videosLimit,
        select: {
          id: true, title: true, url: true, thumbnailUrl: true,
          duration: true, views: true, createdAt: true, isShort: true,
          user: { select: userSelect },
        },
      }),
      prisma.video.count({ where: { ...baseWhere, isShort: false } }),
      prisma.video.findMany({
        where: { ...baseWhere, isShort: true },
        orderBy: { createdAt: "desc" },
        skip: (shortsPage - 1) * shortsLimit,
        take: shortsLimit,
        select: {
          id: true, title: true, url: true, thumbnailUrl: true,
          duration: true, views: true, createdAt: true, isShort: true,
          user: { select: userSelect },
        },
      }),
      prisma.video.count({ where: { ...baseWhere, isShort: true } }),
    ]);

    return successResponse(
      {
        video: mainVideo,
        related: relatedVideos,
        shorts: shortsVideos,
        videosPagination: {
          page: videosPage,
          limit: videosLimit,
          totalCount: relatedVideosCount,
          hasNextPage: videosPage * videosLimit < relatedVideosCount,
        },
        shortsPagination: {
          page: shortsPage,
          limit: shortsLimit,
          totalCount: shortsCount,
          hasNextPage: shortsPage * shortsLimit < shortsCount,
        },
      },
      "Fetched related videos successfully.",
    );
  } catch (err) {
    console.error("RELATED VIDEO API ERROR:", err);
    return ApiErrors.internalError("Could not fetch related videos.");
  }
}
