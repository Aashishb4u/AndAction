/**
 * POST /api/videos/[id]/track
 * Track video playback progress (milestones: 25%, 50%, 75%, 100%)
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiErrors, successResponse } from "@/lib/api-response";

interface TrackingData {
  milestone: number; // 25, 50, 75, or 100
  watchTimeSeconds: number;
  totalDuration: number;
}

export async function POST(
  req: NextRequest,
  context: { params: { id: string } },
) {
  const { id: videoId } = context.params;

  if (!videoId) {
    return ApiErrors.badRequest("Video ID is required.");
  }

  try {
    const body: TrackingData = await req.json();
    const { milestone, watchTimeSeconds, totalDuration } = body;

    // Validate milestone
    if (![25, 50, 75, 100].includes(milestone)) {
      return ApiErrors.badRequest("Invalid milestone. Must be 25, 50, 75, or 100.");
    }

    // Verify video exists
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: { id: true, views: true },
    });

    if (!video) {
      return ApiErrors.notFound("Video not found.");
    }

    // Log tracking data (you can save this to a separate analytics table if needed)
    console.log(`[VIDEO TRACKING] Video: ${videoId} | Milestone: ${milestone}% | Watch Time: ${watchTimeSeconds}s / ${totalDuration}s`);

    // Optionally: Create a VideoAnalytics table to store detailed tracking
    // For now, we're just logging. You can extend this later with:
    // await prisma.videoAnalytics.create({
    //   data: {
    //     videoId,
    //     milestone,
    //     watchTimeSeconds,
    //     totalDuration,
    //     timestamp: new Date(),
    //   },
    // });

    return successResponse(
      { 
        tracked: true, 
        milestone,
        videoId 
      }, 
      "Playback tracked successfully.", 
      200
    );
  } catch (error: any) {
    console.error("VIDEO TRACKING ERROR:", error);
    return ApiErrors.internalError("Failed to track video playback.");
  }
}
