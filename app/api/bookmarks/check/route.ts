// app/api/bookmarks/check/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiErrors, successResponse } from "@/lib/api-response";
import { auth } from "@/auth";

export async function GET(request: NextRequest): Promise<NextResponse<any>> {
  try {
    const session = await auth();
    if (!session || !session.user?.id) return ApiErrors.unauthorized();

    const url = new URL(request.url);
    const artistId = url.searchParams.get("artistId");

    if (!artistId) return ApiErrors.badRequest("artistId is required.");

    const bookmark = await prisma.bookmark.findFirst({
      where: {
        userId: session.user.id,
        artistId,
      },
      select: {
        id: true,
        createdAt: true,
      },
    });

    return successResponse({ bookmark: bookmark || null }, "Checked bookmark.", 200);
  } catch (err) {
    console.error("GET /api/bookmarks/check error:", err);
    return ApiErrors.internalError("Failed to check bookmark.");
  }
}
