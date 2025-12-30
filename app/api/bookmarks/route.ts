/**
 * app/api/bookmarks/route.ts
 *
 * Unified bookmarking for:
 * - Artist
 * - Video / Short (same model field: videoId)
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiErrors, successResponse } from "@/lib/api-response";
import { auth } from "@/auth";

// --------------------------------------------------
// POST /api/bookmarks  (artist OR video/short)
// --------------------------------------------------
export async function POST(request: NextRequest): Promise<NextResponse<any>> {
  const session = await auth();
  if (!session?.user?.id) return ApiErrors.unauthorized();

  const userId = session.user.id;

  let body;
  try {
    body = await request.json();
  } catch {
    return ApiErrors.badRequest("Invalid JSON body.");
  }

  const { artistId, videoId } = body;

  // Require one of them
  if (!artistId && !videoId) {
    return ApiErrors.badRequest("artistId or videoId is required.");
  }

  // --------------------------------------------------
  // Artist bookmark
  // --------------------------------------------------
  if (artistId) {
    const exists = await prisma.artist.findUnique({
      where: { id: artistId },
      select: { id: true },
    });

    if (!exists) return ApiErrors.notFound("Artist not found.");

    const already = await prisma.bookmark.findFirst({
      where: { userId, artistId },
    });

    if (already) return ApiErrors.conflict("Already bookmarked.");

    const bookmark = await prisma.bookmark.create({
      data: { userId, artistId },
      select: { id: true, artistId: true, createdAt: true },
    });

    return successResponse({ bookmark }, "Artist bookmarked.", 201);
  }

  // --------------------------------------------------
  // Video bookmark (includes shorts → isShort=true)
  // --------------------------------------------------
  if (videoId) {
    const exists = await prisma.video.findUnique({
      where: { id: videoId },
      select: { id: true },
    });

    if (!exists) return ApiErrors.notFound("Video not found.");

    const already = await prisma.bookmark.findFirst({
      where: { userId, videoId },
    });

    if (already) return ApiErrors.conflict("Already bookmarked.");

    const bookmark = await prisma.bookmark.create({
      data: { userId, videoId },
      select: { id: true, videoId: true, createdAt: true },
    });

    return successResponse({ bookmark }, "Video bookmarked.", 201);
  }

  return ApiErrors.badRequest("Invalid request.");
}

// --------------------------------------------------
// GET /api/bookmarks  (all bookmarks for logged user)
// --------------------------------------------------
export async function GET(): Promise<NextResponse<any>> {
  const session = await auth();
  if (!session?.user?.id) return ApiErrors.unauthorized();

  const userId = session.user.id;

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      artistId: true,
      videoId: true,
      createdAt: true,

      // artist bookmark detail
      artist: {
        select: {
          id: true,
          stageName: true,
          artistType: true,
          subArtistType: true,
          achievements: true,
          yearsOfExperience: true,
          shortBio: true,
          soloChargesFrom: true,
          soloChargesTo: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              avatar: true,
              city: true,
              state: true,
            },
          },
        },
      },

      // video + shorts bookmark detail
      video: {
        select: {
          id: true,
          title: true,
          url: true,
          thumbnailUrl: true,
          isShort: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      },
    },
  });

  return successResponse({ bookmarks }, "Bookmarks fetched.");
}
