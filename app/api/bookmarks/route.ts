/**
 * app/api/bookmarks/route.ts
 *
 * Handles creating a bookmark for an Artist.
 * (Video bookmarks will be added later)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiErrors, successResponse } from "@/lib/api-response";
import { auth } from "@/auth";

export async function POST(request: NextRequest): Promise<NextResponse<any>> {
  // 1. Validate session
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return ApiErrors.unauthorized();
  }
  const userId = session.user.id;

  // 2. Parse request body
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return ApiErrors.badRequest("Invalid JSON body.");
  }

  const { artistId } = body;

  // 3. Input validation
  if (!artistId) {
    return ApiErrors.badRequest("artistId is required.");
  }

  // 4. Check if artist exists
  const artistExists = await prisma.artist.findUnique({
    where: { id: artistId },
    select: { id: true },
  });

  if (!artistExists) {
    return ApiErrors.notFound("Artist not found.");
  }

  // 5. Check if already bookmarked
  const existingBookmark = await prisma.bookmark.findFirst({
    where: {
      userId,
      artistId,
    },
  });

  if (existingBookmark) {
    return ApiErrors.conflict("Artist already bookmarked.");
  }

  // 6. Create bookmark
  const bookmark = await prisma.bookmark.create({
    data: {
      userId,
      artistId,
    },
    select: {
      id: true,
      artistId: true,
      createdAt: true,
    },
  });

  // 7. Response
  return successResponse(
    { bookmark },
    "Artist successfully bookmarked.",
    201
  );
}
// GET /api/bookmarks
export async function GET(): Promise<NextResponse<any>> {
  const session = await auth();
  if (!session || !session.user?.id) {
    return ApiErrors.unauthorized();
  }

  const userId = session.user.id;

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      createdAt: true,

      // JOIN ARTIST
      artist: {
        select: {
          id: true,
          stageName: true,
          artistType: true,
          subArtistType: true,
          achievements: true,
          yearsOfExperience: true,
          shortBio: true,
          performingLanguage: true,
          performingEventType: true,
          performingStates: true,
          soloChargesFrom: true,
          soloChargesTo: true,

          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              city: true,
              state: true,
              gender: true,
            },
          },
        },
      },
    },
  });

  return successResponse(
    { bookmarks },
    "Bookmarked artists retrieved successfully."
  );
}
