/**
 * GET /api/videos/related?videoId=<id>
 * Returns:
 *  - main video
 *  - related (full videos)
 *  - shorts (videos where isShort = true)
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
            firstName: true,
            lastName: true,
            avatar: true,
            isArtistVerified: true,
          },
        },
      },
    });

    if (!mainVideo) {
      return ApiErrors.notFound("Video not found.");
    }

    const artistId = mainVideo.user.id;

    // 2️⃣ Fetch all videos from this artist (excluding this video)
    const artistVideos = await prisma.video.findMany({
      where: {
        userId: artistId,
        id: { not: videoId },
      },
      orderBy: { createdAt: "desc" },
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
      },
    });

    // Split into shorts & videos
    const relatedVideos = artistVideos.filter((v) => !v.isShort);
    const shorts = artistVideos.filter((v) => v.isShort);

    return successResponse(
      {
        video: mainVideo,
        related: relatedVideos,
        shorts: shorts,
      },
      "Fetched related videos successfully."
    );
  } catch (err) {
    console.error("RELATED VIDEO API ERROR:", err);
    return ApiErrors.internalError("Could not fetch related videos.");
  }
}
