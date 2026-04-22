import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiErrors, successResponse } from "@/lib/api-response";
import { auth } from "@/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<any>> {
  try {
    const session = await auth();
    if (!session?.user?.id) return ApiErrors.unauthorized();

    const { id } = await params;
    if (!id) return ApiErrors.badRequest("Profile ID is required.");

    const profile = await prisma.artist.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!profile) return ApiErrors.notFound("Artist profile not found.");

    return successResponse({ profile }, "Artist profile fetched.", 200);
  } catch (error) {
    console.error("GET /api/artists/profiles/[id] error:", error);
    return ApiErrors.internalError("Failed to fetch artist profile.");
  }
}

