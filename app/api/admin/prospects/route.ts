import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ApiErrors, successResponse } from "@/lib/api-response";
import type { InstagramDiscoveryAccount } from "@/lib/instagram-discovery";
import { upsertProspectFromInstagramDiscovery } from "@/lib/prospects";
import {
  extractInstagramUsernameFromUrl,
  sanitizeText,
} from "@/lib/prospect-discovery";

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;
const MAX_IMPORT_ITEMS = 50;
const IMPORT_SOURCE = "admin_payload_import";

interface ProspectImportSearchMetadata {
  title?: string;
  snippet?: string;
  link?: string;
  instagram_id?: string;
}

interface ProspectImportBusinessData {
  title?: string;
  address?: string;
  phone?: string;
  website?: string;
  country?: string;
  instagram_search_query?: string;
}

interface ProspectImportEnrichedInstagram {
  id?: string;
  username?: string;
  name?: string;
  biography?: string;
  profile_picture_url?: string;
  website?: string;
  followers_count?: number;
  follows_count?: number;
  media_count?: number;
}

interface ProspectImportItem {
  search_metadata?: ProspectImportSearchMetadata;
  business_data?: ProspectImportBusinessData;
  enriched_instagram?: ProspectImportEnrichedInstagram;
}

interface ProspectImportResult {
  username: string | null;
  status:
    | "created"
    | "skipped_artist_exists"
    | "skipped_prospect_exists"
    | "failed";
  prospectId: string | null;
  error: string | null;
}

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

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Auth is skipped outside production, and in production only when
    // ALLOW_PUBLIC_PROSPECT_IMPORT is explicitly enabled. Otherwise this
    // accepts an admin session or the shared cron secret.
    const isOpenAccess =
      process.env.NODE_ENV !== "production" ||
      process.env.ALLOW_PUBLIC_PROSPECT_IMPORT === "true";

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

    const body = (await request.json().catch(() => null)) as
      | ProspectImportItem
      | ProspectImportItem[]
      | null;

    if (!body || (typeof body !== "object" && !Array.isArray(body))) {
      return ApiErrors.badRequest(
        "Request body must be a prospect payload object or an array of payload objects.",
      );
    }

    const items = Array.isArray(body) ? body : [body];

    if (items.length === 0) {
      return ApiErrors.badRequest("Payload array is empty.");
    }

    if (items.length > MAX_IMPORT_ITEMS) {
      return ApiErrors.badRequest(
        `A maximum of ${MAX_IMPORT_ITEMS} prospects can be imported per request.`,
      );
    }

    const results: ProspectImportResult[] = [];

    for (const item of items) {
      const enriched = item?.enriched_instagram;
      const searchMetadata = item?.search_metadata;
      const businessData = item?.business_data;

      const username =
        sanitizeText(enriched?.username) ||
        sanitizeText(searchMetadata?.instagram_id) ||
        extractInstagramUsernameFromUrl(searchMetadata?.link);

      if (!enriched || !sanitizeText(enriched.id) || !username) {
        results.push({
          username,
          status: "failed",
          prospectId: null,
          error:
            "enriched_instagram.id and an Instagram username (enriched_instagram.username, search_metadata.instagram_id, or a valid instagram.com search_metadata.link) are required.",
        });
        continue;
      }

      const account: InstagramDiscoveryAccount = {
        id: enriched.id!.trim(),
        username,
        name: sanitizeText(enriched.name) || undefined,
        biography: sanitizeText(enriched.biography) || undefined,
        profile_picture_url:
          sanitizeText(enriched.profile_picture_url) || undefined,
        website: sanitizeText(enriched.website) || undefined,
        followers_count:
          typeof enriched.followers_count === "number"
            ? enriched.followers_count
            : undefined,
        follows_count:
          typeof enriched.follows_count === "number"
            ? enriched.follows_count
            : undefined,
        media_count:
          typeof enriched.media_count === "number"
            ? enriched.media_count
            : undefined,
      };

      try {
        const result = await upsertProspectFromInstagramDiscovery({
          username,
          account,
          source: IMPORT_SOURCE,
          sourceQuery: sanitizeText(businessData?.instagram_search_query),
          sourceTitle:
            sanitizeText(searchMetadata?.title) ||
            sanitizeText(businessData?.title),
          sourceSnippet: sanitizeText(searchMetadata?.snippet),
          sourceLink: sanitizeText(searchMetadata?.link),
          address: sanitizeText(businessData?.address),
          country: sanitizeText(businessData?.country),
          contactNumber: sanitizeText(businessData?.phone),
          website: sanitizeText(businessData?.website),
        });

        if (result.skippedBecauseArtistExists) {
          results.push({
            username,
            status: "skipped_artist_exists",
            prospectId: null,
            error: null,
          });
          continue;
        }

        if (result.skippedBecauseProspectExists) {
          results.push({
            username,
            status: "skipped_prospect_exists",
            prospectId: null,
            error: null,
          });
          continue;
        }

        results.push({
          username,
          status: "created",
          prospectId: result.prospect?.id || null,
          error: null,
        });
      } catch (error) {
        console.error(
          `POST /api/admin/prospects import failed for ${username}:`,
          error,
        );
        results.push({
          username,
          status: "failed",
          prospectId: null,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const summary = {
      total: results.length,
      created: results.filter((result) => result.status === "created").length,
      skippedExistingArtists: results.filter(
        (result) => result.status === "skipped_artist_exists",
      ).length,
      skippedExistingProspects: results.filter(
        (result) => result.status === "skipped_prospect_exists",
      ).length,
      failed: results.filter((result) => result.status === "failed").length,
    };

    return successResponse(
      { summary, results },
      summary.created > 0
        ? "Prospects imported successfully."
        : "No new prospects were created.",
      summary.created > 0 ? 201 : 200,
    );
  } catch (error) {
    console.error("POST /api/admin/prospects API Error:", error);
    return ApiErrors.internalError(
      "An unexpected error occurred while importing prospects.",
    );
  }
}

function getProvidedSecret(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  const bearerMatch = authHeader?.match(/^Bearer\s+(.+)$/i);

  return bearerMatch?.[1] ?? request.headers.get("x-cron-secret");
}
