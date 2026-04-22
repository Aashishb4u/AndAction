import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const artistProfileId = body?.artistProfileId as string | null | undefined;
    const artist = artistProfileId
      ? await prisma.artist.findFirst({
          where: { id: artistProfileId, userId: session.user.id },
        })
      : await prisma.artist.findFirst({
          where: { userId: session.user.id },
          orderBy: { profileOrder: "asc" },
        });

    if (!artist) {
      return NextResponse.json(
        { success: false, message: "Artist profile not found" },
        { status: 404 }
      );
    }

    await prisma.$transaction([
      prisma.video.deleteMany({
        where: {
          artistId: artist.id,
          source: "youtube",
        },
      }),
      prisma.video.deleteMany({
        where: {
          artistId: artist.id,
          isShort: true,
          OR: [
            { youtubeVideoId: { not: null } },
            { url: { contains: "youtube.com", mode: "insensitive" } },
            { url: { contains: "youtu.be", mode: "insensitive" } },
          ],
        },
      }),
      prisma.artist.update({
        where: { id: artist.id },
        data: {
          youtubeAccessToken: null,
          youtubeRefreshToken: null,
          youtubeTokenExpiry: null,
          youtubeChannelId: null,
          youtubeChannelName: null,
          youtubeConnectedAt: null,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "YouTube account disconnected successfully",
    });
  } catch (error) {
    console.error("Error disconnecting YouTube:", error);
    return NextResponse.json(
      { success: false, message: "Failed to disconnect YouTube" },
      { status: 500 }
    );
  }
}
