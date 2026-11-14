import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ApiErrors, successResponse } from "@/lib/api-response";

const INSTAGRAM_ID_BODY_KEYS = [
  "instagramId",
  "instagram_id",
  "igId",
  "ig_id",
  "id",
] as const;

const ARTIST_SELECT = {
  id: true,
  userId: true,
  profileOrder: true,
  stageName: true,
  artistType: true,
  subArtistType: true,
  profileImage: true,
  shortBio: true,
  achievements: true,
  yearsOfExperience: true,
  contactNumber: true,
  whatsappNumber: true,
  contactEmail: true,
  performingLanguage: true,
  performingEventType: true,
  performingStates: true,
  soloChargesFrom: true,
  soloChargesTo: true,
  chargesWithBacklineFrom: true,
  chargesWithBacklineTo: true,
  instagramId: true,
  instagramUsername: true,
  instagramConnectedAt: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      email: true,
      countryCode: true,
      phoneNumber: true,
      city: true,
      state: true,
      address: true,
      zip: true,
      role: true,
      isAccountVerified: true,
      isArtistVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  },
} satisfies Prisma.ArtistSelect;

function getProvidedSecret(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  const bearerMatch = authHeader?.match(/^Bearer\s+(.+)$/i);

  return bearerMatch?.[1] ?? request.headers.get("x-cron-secret");
}

function readBodyValue(
  body: Record<string, unknown>,
  keys: readonly string[],
): string | null {
  for (const key of keys) {
    const value = body[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }

  return null;
}

function toNumber(value: Prisma.Decimal | number | null): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const isOpenAccess = process.env.NODE_ENV !== "production";
    const cronSecret = process.env.CRON_SECRET;
    const providedSecret = getProvidedSecret(request);
    const hasValidSecret = Boolean(
      cronSecret && providedSecret && providedSecret === cronSecret,
    );

    if (!isOpenAccess && !hasValidSecret) {
      const session = await auth();

      if (!session?.user?.id) {
        return ApiErrors.unauthorized();
      }

      if (session.user.role !== "admin") {
        return ApiErrors.forbidden();
      }
    }

    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return ApiErrors.badRequest(
        "Request body must be an object containing an instagramId.",
      );
    }

    const instagramId = readBodyValue(
      body as Record<string, unknown>,
      INSTAGRAM_ID_BODY_KEYS,
    );

    if (!instagramId) {
      return ApiErrors.badRequest("instagramId is required.");
    }

    const artist = await prisma.artist.findFirst({
      where: { instagramId },
      select: ARTIST_SELECT,
      orderBy: [{ profileOrder: "asc" }, { createdAt: "asc" }],
    });

    if (!artist) {
      return ApiErrors.notFound("User not found for this Instagram ID.");
    }

    return successResponse(
      {
        found: true,
        instagramId,
        artist: {
          ...artist,
          soloChargesFrom: toNumber(artist.soloChargesFrom),
          soloChargesTo: toNumber(artist.soloChargesTo),
          chargesWithBacklineFrom: toNumber(artist.chargesWithBacklineFrom),
          chargesWithBacklineTo: toNumber(artist.chargesWithBacklineTo),
        },
        user: artist.user,
      },
      "User found for this Instagram ID.",
    );
  } catch (error) {
    console.error("POST /api/leads/getLeadByInstagramId API Error:", error);
    return ApiErrors.internalError(
      "An unexpected error occurred while looking up the Instagram user.",
    );
  }
}
