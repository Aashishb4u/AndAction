/**
 * GET /api/videos/[id]
 * Returns single video + increments views (Neon-safe version)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiErrors, successResponse } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const { id: videoId } = context.params;

  if (!videoId) {
    return ApiErrors.badRequest("Video ID is required.");
  }

  try {
    // Neon-compatible transaction (batch style)
    const [updated, video] = await prisma.$transaction([
      prisma.video.update({
        where: { id: videoId },
        data: { views: { increment: 1 } }
      }),

      prisma.video.findFirst({
        where: { id: videoId },
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
            }
          }
        }
      })
    ]);

    if (!video) {
      return ApiErrors.notFound("Video not found.");
    }

    return successResponse(
      { video },
      "Video retrieved successfully.",
      200
    );

  } catch (error: any) {

    // Prisma: Record not found during update
    if (error.code === "P2025") {
      return ApiErrors.notFound("Video not found.");
    }

    console.error("VIDEO API ERROR:", error);
    return ApiErrors.internalError("Unexpected error.");
  }
}
