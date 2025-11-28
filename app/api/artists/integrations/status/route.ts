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

    // Get the artist profile for this user
    const artist = await prisma.artist.findUnique({
      where: { userId: session.user.id },
      select: {
        youtubeChannelId: true,
        youtubeChannelName: true,
        youtubeConnectedAt: true,
        youtubeAccessToken: true,
        instagramId: true,
        instagramUsername: true,
        instagramConnectedAt: true,
        instagramAccessToken: true,
      },
    });

    if (!artist) {
      return NextResponse.json(
        { success: false, message: "Artist profile not found" },
        { status: 404 }
      );
    }

    // Return integration status (without exposing tokens)
    const integrationStatus = {
      youtube: {
        connected: !!(artist.youtubeAccessToken && artist.youtubeChannelId),
        channelName: artist.youtubeChannelName || null,
        channelId: artist.youtubeChannelId || null,
        connectedAt: artist.youtubeConnectedAt?.toISOString() || null,
      },
      instagram: {
        connected: !!(artist.instagramAccessToken && artist.instagramId),
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
