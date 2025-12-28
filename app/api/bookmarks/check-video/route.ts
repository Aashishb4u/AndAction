import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ApiErrors, successResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return ApiErrors.unauthorized();

  const userId = session.user.id;

  const videoId = req.nextUrl.searchParams.get("videoId");
  if (!videoId) return ApiErrors.badRequest("videoId is required.");

  const bookmark = await prisma.bookmark.findFirst({
    where: { userId, videoId },
    select: { id: true, videoId: true, createdAt: true },
  });

  return successResponse(
    { isBookmarked: !!bookmark, bookmarkId: bookmark?.id || null },
    "Video bookmark status returned"
  );
}
