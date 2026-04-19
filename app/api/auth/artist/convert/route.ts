import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ApiErrors, successResponse } from "@/lib/api-response";

export async function POST(_request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return ApiErrors.unauthorized();
    }

    const result = await prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: { id: session.user.id },
        include: { artist: true },
      });

      if (!existingUser) {
        return null;
      }

      const fullName = `${existingUser.firstName || ""} ${existingUser.lastName || ""}`.trim();

      const artistProfile = existingUser.artist
        ? existingUser.artist
        : await tx.artist.create({
            data: {
              userId: existingUser.id,
              stageName: fullName || null,
              contactEmail: existingUser.email || null,
              contactNumber: existingUser.phoneNumber || null,
              whatsappNumber: existingUser.phoneNumber || null,
            },
          });

      const updatedUser =
        existingUser.role === "artist"
          ? existingUser
          : await tx.user.update({
              where: { id: existingUser.id },
              data: { role: "artist" },
            });

      return {
        user: updatedUser,
        artistProfile,
        alreadyArtist: existingUser.role === "artist",
      };
    });

    if (!result) {
      return ApiErrors.notFound("User not found.");
    }

    return successResponse(
      {
        user: {
          id: result.user.id,
          role: result.user.role,
        },
        artistProfile: {
          id: result.artistProfile.id,
        },
      },
      result.alreadyArtist
        ? "Account is already an artist account."
        : "Account converted to artist successfully.",
      200
    );
  } catch (error) {
    console.error("Artist convert error:", error);
    return ApiErrors.internalError("Failed to convert account to artist.");
  }
}
