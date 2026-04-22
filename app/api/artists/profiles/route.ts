import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiErrors, successResponse } from "@/lib/api-response";
import { auth } from "@/auth";

export async function GET(_request: NextRequest): Promise<NextResponse<any>> {
  try {
    const session = await auth();
    if (!session?.user?.id) return ApiErrors.unauthorized();

    const profiles = await prisma.artist.findMany({
      where: { userId: session.user.id },
      orderBy: { profileOrder: "asc" },
      select: {
        id: true,
        profileImage: true,
        stageName: true,
        artistType: true,
        subArtistType: true,
        createdAt: true,
        profileOrder: true,
      },
    });

    return successResponse({ profiles }, "Artist profiles fetched.", 200);
  } catch (error) {
    console.error("GET /api/artists/profiles error:", error);
    return ApiErrors.internalError("Failed to fetch artist profiles.");
  }
}
