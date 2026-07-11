import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { ApiErrors, successResponse } from "@/lib/api-response";
import { acceptProspectAndConvertToArtist } from "@/lib/prospects";

interface Params {
  id: string;
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<Params> },
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return ApiErrors.unauthorized();
    }

    if (session.user.role !== "admin") {
      return ApiErrors.forbidden();
    }

    const { id } = await params;

    if (!id) {
      return ApiErrors.badRequest("Prospect ID is required.");
    }

    const result = await acceptProspectAndConvertToArtist({
      prospectId: id,
      acceptedByUserId: session.user.id,
    });

    return successResponse(
      {
        prospect: result.prospect,
        user: result.user,
        artist: result.artist,
      },
      "Prospect accepted and converted to artist successfully.",
      201,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message === "PROSPECT_NOT_FOUND") {
      return ApiErrors.notFound("Prospect not found.");
    }

    if (message === "PROSPECT_ALREADY_ACCEPTED") {
      return ApiErrors.conflict("Prospect has already been accepted.");
    }

    if (message === "ARTIST_ALREADY_EXISTS") {
      return ApiErrors.conflict(
        "An artist with this Instagram account already exists.",
      );
    }

    if (message === "USER_EMAIL_ALREADY_EXISTS") {
      return ApiErrors.conflict(
        "A user with this prospect email already exists.",
      );
    }

    if (message === "USER_PHONE_ALREADY_EXISTS") {
      return ApiErrors.conflict(
        "A user with this prospect phone number already exists.",
      );
    }

    console.error("POST /api/admin/prospects/[id]/accept API Error:", error);
    return ApiErrors.internalError(
      "An unexpected error occurred while accepting the prospect.",
    );
  }
}
