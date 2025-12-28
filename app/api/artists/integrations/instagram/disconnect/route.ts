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

    const artist = await prisma.artist.findUnique({
      where: { userId: session.user.id },
    });

    if (!artist) {
      return NextResponse.json(
        { success: false, message: "Artist profile not found" },
        { status: 404 }
      );
    }

    if (!artist.instagramAccessToken) {
      return NextResponse.json(
        { success: false, message: "Instagram is not connected" },
        { status: 400 }
      );
    }

    await prisma.artist.update({
      where: { id: artist.id },
      data: {
        instagramAccessToken: null,
        instagramTokenExpiry: null,
        instagramId: null,
        instagramUsername: null,
        instagramConnectedAt: null,
      },
    });

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
