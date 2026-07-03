import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const artistProfileId = request.nextUrl.searchParams.get("artistProfileId");
    const artist = artistProfileId
      ? await prisma.artist.findFirst({
          where: { id: artistProfileId, userId: session.user.id },
          select: {
            id: true,
            youtubeChannelId: true,
            youtubeChannelName: true,
            youtubeConnectedAt: true,
            youtubeAccessToken: true,
            instagramId: true,
            instagramUsername: true,
            instagramConnectedAt: true,
          },
        })
      : await prisma.artist.findFirst({
          where: { userId: session.user.id },
          orderBy: { profileOrder: "asc" },
          select: {
            id: true,
            youtubeChannelId: true,
            youtubeChannelName: true,
            youtubeConnectedAt: true,
            youtubeAccessToken: true,
            instagramId: true,
            instagramUsername: true,
            instagramConnectedAt: true,
          },
        });

    if (!artist) {
      return NextResponse.json(
        { success: false, message: "Artist profile not found" },
        { status: 404 }
      );
    }

    // Backfill a missing YouTube channel name (older connections may have saved
    // only the channel ID). Fetch it once from the public API and persist it.
    if (
      artist.youtubeChannelId &&
      !artist.youtubeChannelName &&
      process.env.YOUTUBE_API_KEY
    ) {
      try {
        const ytRes = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${artist.youtubeChannelId}&key=${process.env.YOUTUBE_API_KEY}`
        );
        const ytData = await ytRes.json();
        const channelName = ytData?.items?.[0]?.snippet?.title;
        if (channelName) {
          await prisma.artist.update({
            where: { id: artist.id },
            data: { youtubeChannelName: channelName },
          });
          artist.youtubeChannelName = channelName;
        }
      } catch (e) {
        console.error("Failed to backfill YouTube channel name:", e);
      }
    }

    // Return integration status (without exposing tokens)
    const integrationStatus = {
      youtube: {
        // Connected if channel ID exists (either via OAuth or manual connection)
        connected: !!artist.youtubeChannelId,
        channelName: artist.youtubeChannelName || null,
        channelId: artist.youtubeChannelId || null,
        connectedAt: artist.youtubeConnectedAt?.toISOString() || null,
      },
      instagram: {
        connected: !!artist.instagramUsername,
        username: artist.instagramUsername || null,
        connectedAt: artist.instagramConnectedAt?.toISOString() || null,
      },
    };

    return NextResponse.json({
      success: true,
      data: integrationStatus,
    });
  } catch (error) {
    console.error("Error fetching integration status:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch integration status" },
      { status: 500 }
    );
  }
}
