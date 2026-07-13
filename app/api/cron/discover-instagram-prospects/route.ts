import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { fetchInstagramAccountByUsername } from "@/lib/instagram-discovery";
import { discoverInstagramProspectsFromSerpApi } from "@/lib/prospect-discovery";
import {
  advanceInstagramProspectDiscoveryCursor,
  buildProspectDiscoveryQueryFromCategoryTitle,
  getInstagramProspectDiscoveryConfig,
} from "@/lib/instagram-discovery-config";
import { upsertProspectFromInstagramDiscovery } from "@/lib/prospects";

export async function GET(request: NextRequest) {
  const cronJobId = await createCronJobRecord("discover-instagram-prospects");

  try {
    const cronSecret = process.env.CRON_SECRET;
    const providedSecret = getProvidedSecret(request);

    if (cronSecret && providedSecret !== cronSecret) {
      await updateCronJobRecord(cronJobId, "failed", "Unauthorized");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = process.env.SERPAPI_KEY;
    if (!apiKey) {
      throw new Error("SERPAPI_KEY is missing");
    }

    const discoveryConfig = await getInstagramProspectDiscoveryConfig();
    const hasManualQueryOverride = request.nextUrl.searchParams.has("q");
    const hasManualCategoryOverride = request.nextUrl.searchParams.has("category");
    const hasManualStartOverride = request.nextUrl.searchParams.has("start");
    const hasManualLocationOverride = request.nextUrl.searchParams.has("location");
    const shouldAdvanceCursor =
      !hasManualQueryOverride &&
      !hasManualCategoryOverride &&
      !hasManualStartOverride &&
      !hasManualLocationOverride;

    const manualCategoryTitle =
      request.nextUrl.searchParams.get("category")?.trim() || null;
    const categoryTitle =
      manualCategoryTitle ||
      (!hasManualQueryOverride ? discoveryConfig.activeCategoryTitle : null);

    const query =
      request.nextUrl.searchParams.get("q") ||
      (categoryTitle
        ? buildProspectDiscoveryQueryFromCategoryTitle(categoryTitle)
        : null) ||
      discoveryConfig.activeQuery;
    const defaultStart =
      hasManualQueryOverride || hasManualCategoryOverride
        ? 0
        : discoveryConfig.currentStart;
    const start = parseNonNegativeNumber(
      request.nextUrl.searchParams.get("start"),
      defaultStart,
    );
    const location =
      request.nextUrl.searchParams.get("location") ||
      discoveryConfig.location;
    const googleDomain =
      request.nextUrl.searchParams.get("google_domain") ||
      discoveryConfig.googleDomain;
    const hl =
      request.nextUrl.searchParams.get("hl") ||
      discoveryConfig.hl;
    const gl =
      request.nextUrl.searchParams.get("gl") ||
      discoveryConfig.gl;
    const maxResults = parsePositiveNumber(
      request.nextUrl.searchParams.get("maxResults"),
      discoveryConfig.maxResults,
    );
    const mediaLimit = parsePositiveNumber(
      request.nextUrl.searchParams.get("mediaLimit"),
      discoveryConfig.mediaLimit,
    );
    const requestDelayMs = parsePositiveNumber(
      request.nextUrl.searchParams.get("delayMs"),
      discoveryConfig.requestDelayMs,
    );
    const debug =
      request.nextUrl.searchParams.get("debug") === "true" ||
      process.env.PROSPECT_DISCOVERY_DEBUG === "true";

    console.log("[CRON] Starting Instagram prospect discovery...");

    const searchResult = await discoverInstagramProspectsFromSerpApi({
      apiKey,
      query,
      start,
      location,
      googleDomain,
      hl,
      gl,
      maxResults,
      debug,
    });

    const enrichedProspectIds: string[] = [];
    const skippedExistingArtists: string[] = [];
    const skippedExistingProspects: string[] = [];
    const notDiscoverable: string[] = [];
    const errors: string[] = [];

    for (const [index, candidate] of searchResult.candidates.entries()) {
      try {
        const account = await fetchInstagramAccountByUsername(
          candidate.username,
          mediaLimit,
        );

        if (!account) {
          notDiscoverable.push(candidate.username);
          continue;
        }

        const result = await upsertProspectFromInstagramDiscovery({
          username: candidate.username,
          account,
          sourceQuery: query,
          sourceTitle: candidate.title,
          sourceSnippet: candidate.snippet,
          sourceLink: candidate.link,
          city: discoveryConfig.locationCity,
          state: discoveryConfig.locationState,
          country: discoveryConfig.locationCountry,
        });

        if (result.skippedBecauseArtistExists) {
          skippedExistingArtists.push(candidate.username);
          continue;
        }

        if (result.skippedBecauseProspectExists) {
          skippedExistingProspects.push(candidate.username);
          continue;
        }

        if (result.prospect) {
          enrichedProspectIds.push(result.prospect.id);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        errors.push(`${candidate.username}: ${message}`);
        console.error(
          `[CRON] Prospect enrichment failed for ${candidate.username}:`,
          error,
        );
      } finally {
        if (index < searchResult.candidates.length - 1 && requestDelayMs > 0) {
          await delay(requestDelayMs);
        }
      }
    }

    const nextCursor = shouldAdvanceCursor
      ? await advanceInstagramProspectDiscoveryCursor({
          ...discoveryConfig,
          activeCategoryTitle: categoryTitle || discoveryConfig.activeCategoryTitle,
          activeQuery: categoryTitle
            ? buildProspectDiscoveryQueryFromCategoryTitle(categoryTitle)
            : query,
          currentStart: start,
          location,
          googleDomain,
          hl,
          gl,
          maxResults,
          mediaLimit,
          requestDelayMs,
        })
      : null;

    const metadata: any = {
      locationCity: discoveryConfig.locationCity,
      locationState: discoveryConfig.locationState,
      locationCountry: discoveryConfig.locationCountry,
      locationIndex: hasManualLocationOverride
        ? null
        : discoveryConfig.currentLocationIndex,
      totalLocations: discoveryConfig.locations.length,
      categoryTitle,
      categoryIndex:
        hasManualQueryOverride || hasManualCategoryOverride
          ? null
          : discoveryConfig.currentCategoryIndex,
      totalCategories: discoveryConfig.categoryTitles.length,
      query,
      queryIndex: discoveryConfig.currentQueryIndex,
      totalQueries: discoveryConfig.queries.length,
      start,
      startIncrement: discoveryConfig.startIncrement,
      pagesPerQuery: discoveryConfig.pagesPerQuery,
      cursorAdvanced: shouldAdvanceCursor,
      nextLocationIndex: nextCursor?.nextLocationIndex ?? null,
      nextQueryIndex: nextCursor?.nextQueryIndex ?? null,
      nextStart: nextCursor?.nextStart ?? null,
      location,
      googleDomain,
      hl,
      gl,
      maxResults,
      mediaLimit,
      requestDelayMs,
      debug,
      searchMetadata: searchResult.metadata,
      candidatesFound: searchResult.candidates.length,
      rawOrganicResultsCount: searchResult.debug?.rawOrganicResultsCount ?? null,
      inspectedResultsCount: searchResult.debug?.inspectedResultsCount ?? null,
      prospectsEnriched: enrichedProspectIds.length,
      prospectIds: enrichedProspectIds,
      skippedExistingArtists: skippedExistingArtists.length,
      skippedExistingArtistUsernames: skippedExistingArtists,
      skippedExistingProspects: skippedExistingProspects.length,
      skippedExistingProspectUsernames: skippedExistingProspects,
      notDiscoverableCount: notDiscoverable.length,
      notDiscoverableUsernames: notDiscoverable,
      errors: errors.length,
      errorMessages: errors,
      debugDecisions: searchResult.debug?.decisions ?? [],
    };

    await updateCronJobRecord(cronJobId, "completed", null, metadata);

    return NextResponse.json({
      success: true,
      message: "Instagram prospect discovery completed",
      ...metadata,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    await updateCronJobRecord(cronJobId, "failed", errorMessage);

    console.error("[CRON] Instagram prospect discovery failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 },
    );
  }
}

async function delay(ms: number): Promise<void> {
  if (ms <= 0) {
    return;
  }

  await new Promise((resolve) => setTimeout(resolve, ms));
}

function getProvidedSecret(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  const bearerMatch = authHeader?.match(/^Bearer\s+(.+)$/i);
  const headerToken = bearerMatch?.[1] ?? null;
  const queryToken =
    request.nextUrl.searchParams.get("token") ||
    request.nextUrl.searchParams.get("secret");

  return headerToken || request.headers.get("x-cron-secret") || queryToken;
}

function parsePositiveNumber(value: string | null, fallback: number): number {
  if (!value) {
    return Math.max(fallback, 1);
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return Math.max(fallback, 1);
  }

  return Math.floor(parsed);
}

function parseNonNegativeNumber(value: string | null, fallback: number): number {
  if (!value) {
    return Math.max(Math.floor(fallback), 0);
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return Math.max(Math.floor(fallback), 0);
  }

  return Math.floor(parsed);
}

async function createCronJobRecord(jobName: string): Promise<string> {
  const cronJob = await prisma.cronJob.create({
    data: {
      jobName,
      status: "started",
    },
  });

  return cronJob.id;
}

async function updateCronJobRecord(
  id: string,
  status: "completed" | "failed",
  error: string | null = null,
  metadata:
    | Prisma.InputJsonValue
    | Prisma.NullableJsonNullValueInput
    | undefined = undefined,
): Promise<void> {
  await prisma.cronJob.update({
    where: { id },
    data: {
      status,
      completedAt: new Date(),
      error,
      metadata,
    },
  });
}
