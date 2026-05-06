import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSyncedVideos } from "@/app/actions/youtube/sync-videos";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get("channelId");
    const limit = parseInt(searchParams.get("limit") || "5");

    if (!channelId) {
      return NextResponse.json({ error: "Channel ID is required" }, { status: 400 });
    }

    // Find the artist with this YouTube channel
    const artist = await prisma.artist.findFirst({
      where: {
        youtubeChannelId: channelId,
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    if (!artist) {
      return NextResponse.json({ error: "Artist not found for this channel" }, { status: 404 });
    }

    // Get synced videos for the specific artist
    const result = await getSyncedVideos("videos", artist.id);

    if (result.success) {
      const videos = result.data || [];
      
      // Return limited number of videos
      const limitedVideos = videos.slice(0, limit);
      
      return NextResponse.json({
        success: true,
        videos: limitedVideos.map(video => ({
          id: video.id,
          youtubeVideoId: video.youtubeVideoId,
          title: video.title,
          description: video.description,
          url: video.url,
          thumbnailUrl: video.thumbnailUrl,
          views: video.views,
          publishedAt: video.publishedAt,
          duration: video.duration,
          durationFormatted: video.durationFormatted,
          isShort: video.isShort,
        })),
      });
    } else {
      return NextResponse.json(
        { error: result.message || "Failed to fetch videos" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("YouTube videos API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
