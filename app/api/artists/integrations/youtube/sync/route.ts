import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { syncYouTubeVideosInternal } from "@/app/actions/youtube/sync-videos";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { channelId } = body;

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
        userId: true,
        youtubeChannelId: true,
        youtubeAccessToken: true,
      },
    });

    if (!artist) {
      return NextResponse.json({ error: "Artist not found for this channel" }, { status: 404 });
    }

    // Sync videos for the specific artist
    const result = await syncYouTubeVideosInternal(
      artist.id,
      artist.userId,
      artist.youtubeChannelId,
      artist.youtubeAccessToken
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        synced: result.synced,
        skipped: result.skipped,
        total: result.total,
      });
    } else {
      return NextResponse.json(
        { error: result.message || "Failed to sync videos" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("YouTube sync API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
