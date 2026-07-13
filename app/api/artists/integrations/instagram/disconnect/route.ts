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

    // Connected via Business Discovery (username only) or legacy OAuth (token).
    if (!artist.instagramId) {
      return NextResponse.json(
        { success: false, message: "Instagram is not connected" },
        { status: 400 }
      );
    }

    await prisma.$transaction([
      // Remove synced Instagram content from the profile (reels + posts),
      // mirroring how connect refreshes and how YouTube disconnect cleans up.
      prisma.video.deleteMany({
        where: {
          artistId: artist.id,
          source: "instagram",
        },
      }),
      prisma.artist.update({
        where: { id: artist.id },
        data: {
          instagramAccessToken: null,
          instagramTokenExpiry: null,
          instagramId: null,
          instagramUsername: null,
          instagramConnectedAt: null,
          instagramRefreshNextRunAt: null,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Instagram disconnected successfully",
    });
  } catch (error) {
    console.error("Error disconnecting Instagram:", error);
    return NextResponse.json(
      { success: false, message: "Failed to disconnect Instagram" },
      { status: 500 }
    );
  }
}
