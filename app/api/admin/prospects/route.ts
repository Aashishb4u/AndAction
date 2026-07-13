import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ApiErrors, successResponse } from "@/lib/api-response";

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return ApiErrors.unauthorized();
    }

    if (session.user.role !== "admin") {
      return ApiErrors.forbidden();
    }

    const page = Math.max(
      Number.parseInt(request.nextUrl.searchParams.get("page") || "1", 10) || 1,
      1,
    );
    const limit = Math.min(
      Math.max(
        Number.parseInt(
          request.nextUrl.searchParams.get("limit") ||
            DEFAULT_PAGE_SIZE.toString(),
          10,
        ) || DEFAULT_PAGE_SIZE,
        1,
      ),
      MAX_PAGE_SIZE,
    );
    const status = request.nextUrl.searchParams.get("status") || "pending";
    const skip = (page - 1) * limit;

    const where: Prisma.ProspectWhereInput = {};
    if (status !== "all") {
      where.status = status;
    }

    const [total, prospects] = await Promise.all([
      prisma.prospect.count({ where }),
      prisma.prospect.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ status: "asc" }, { discoveredAt: "desc" }],
        select: {
          id: true,
          stageName: true,
          firstName: true,
          lastName: true,
          artistType: true,
          shortBio: true,
          address: true,
          city: true,
          state: true,
          country: true,
          zip: true,
          gender: true,
          dob: true,
          contactNumber: true,
          whatsappNumber: true,
          contactEmail: true,
          countryCode: true,
          youtubeChannelId: true,
          youtubeChannelName: true,
          youtubeConnectedAt: true,
          instagramId: true,
          instagramUsername: true,
          profileImage: true,
          website: true,
          followersCount: true,
          followsCount: true,
          mediaCount: true,
          source: true,
          sourceQuery: true,
          sourceTitle: true,
          sourceSnippet: true,
          sourceLink: true,
          status: true,
          discoveredAt: true,
          lastEnrichedAt: true,
          acceptedAt: true,
          convertedUserId: true,
          convertedArtistId: true,
        },
      }),
    ]);

    return successResponse(
      {
        prospects,
        metadata: {
          total,
          page,
          limit,
          status,
          totalPages: Math.ceil(total / limit),
        },
      },
      "Prospects fetched successfully.",
      200,
    );
  } catch (error) {
    console.error("GET /api/admin/prospects API Error:", error);
    return ApiErrors.internalError(
      "An unexpected error occurred while fetching prospects.",
    );
  }
}
