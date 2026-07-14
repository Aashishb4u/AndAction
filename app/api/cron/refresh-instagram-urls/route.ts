import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchInstagramAccountByUsername } from "@/lib/instagram-discovery";
import {
  getInstagramRefreshIntervalHours,
  scheduleNextInstagramRefresh,
} from "@/lib/instagram-refresh-schedule";
import type { Prisma } from "@prisma/client";

const MIN_INSTAGRAM_DISCOVERY_DELAY_MS = 2000;
const INSTAGRAM_MEDIA_REFRESH_INTERVAL_HOURS =
  getInstagramRefreshIntervalHours();

const INSTAGRAM_REFRESH_BATCH_SIZE = Math.max(
  Number(process.env.INSTAGRAM_REFRESH_BATCH_SIZE || 10),
  1,
);
const INSTAGRAM_REFRESH_MAX_ARTISTS_PER_RUN = Math.max(
  Number(process.env.INSTAGRAM_REFRESH_MAX_ARTISTS_PER_RUN || 95),
  1,
);
const INSTAGRAM_REFRESH_ARTIST_DELAY_MS = Math.max(
  Number(process.env.INSTAGRAM_REFRESH_ARTIST_DELAY_MS || 10000),
  MIN_INSTAGRAM_DISCOVERY_DELAY_MS,
);
const INSTAGRAM_REFRESH_BATCH_DELAY_MS = Number(
  process.env.INSTAGRAM_REFRESH_BATCH_DELAY_MS || 0,
);
const INSTAGRAM_REFRESH_RETRY_DELAY_MS = Number(
  process.env.INSTAGRAM_REFRESH_RETRY_DELAY_MS || 20 * 60 * 1000,
);
const INSTAGRAM_REFRESH_MAX_RETRY_ROUNDS = Math.max(
  Number(process.env.INSTAGRAM_REFRESH_MAX_RETRY_ROUNDS || 0),
  0,
);
const INSTAGRAM_REFRESH_MAX_API_CALLS_PER_HOUR = Math.max(
  Number(process.env.INSTAGRAM_REFRESH_MAX_API_CALLS_PER_HOUR || 180),
  1,
);

interface InstagramMediaResponse {
  data?: Array<{
    id: string;
    caption?: string;
    media_type: string;
    media_url?: string;
    thumbnail_url?: string;
    permalink: string;
    timestamp: string;
  }>;
}

interface InstagramRefreshArtist {
  id: string;
  userId: string;
  instagramUsername: string | null;
  latestInstagramVideoUpdatedAt: Date | null;
  instagramRefreshNextRunAt: Date | null;
}

interface ArtistBatchProcessingResult {
  artistsProcessed: number;
  artistAttempts: number;
  videosUpdated: number;
  errors: number;
  errorMessages: string[];
  retryRoundsExecuted: number;
  batchesProcessed: number;
  failedArtists: InstagramRefreshArtist[];
  deferredArtists: InstagramRefreshArtist[];
  stoppedDueToRateLimit: boolean;
  rateLimitBlockedUntil: Date | null;
  apiUsageSnapshot: InstagramRefreshApiUsageSnapshot | null;
}

interface InstagramRefreshApiUsageSnapshot {
  windowStartedAt: Date;
  windowEndsAt: Date;
  apiCallsCount: number;
  rateLimitHits: number;
  blockedUntil: Date | null;
  lastRateLimitedAt: Date | null;
}

class InstagramRefreshRateLimitError extends Error {
  blockedUntil: Date;
  usageSnapshot: InstagramRefreshApiUsageSnapshot;

  constructor(message: string, usageSnapshot: InstagramRefreshApiUsageSnapshot) {
    super(message);
    this.name = "InstagramRefreshRateLimitError";
    this.blockedUntil = usageSnapshot.blockedUntil || usageSnapshot.windowEndsAt;
    this.usageSnapshot = usageSnapshot;
  }
}

export async function GET(request: NextRequest) {
  let cronJobId: string | null = null;

  try {
    // Security check - validate cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    const bearerMatch = authHeader?.match(/^Bearer\s+(.+)$/i);
    const headerToken = bearerMatch?.[1] ?? null;
    const queryToken =
      request.nextUrl.searchParams.get("token") ||
      request.nextUrl.searchParams.get("secret");
    const providedSecret =
      headerToken || request.headers.get("x-cron-secret") || queryToken;

    if (cronSecret && providedSecret !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const artistId = request.nextUrl.searchParams.get("artistId");
    const force =
      request.nextUrl.searchParams.get("force")?.toLowerCase() === "true";

    const isManualForceRun = force && Boolean(artistId);

    if (force && !artistId) {
      return NextResponse.json(
        {
          success: false,
          error: "artistId is required when force=true",
        },
        { status: 400 },
      );
    }

    console.log("[INSTAGRAM REFRESH] Request mode:", {
      artistId,
      force,
      isManualForceRun,
    });

    const activeCronJob = await prisma.cronJob.findFirst({
      where: {
        jobName: "refresh-instagram-urls",
        status: "started",
        completedAt: null,
      },
      orderBy: {
        startedAt: "desc",
      },
    });

    // if (activeCronJob) {
    //   console.log(
    //     `[CRON] Skipping Instagram URL refresh because run ${activeCronJob.id} is still active`,
    //   );

    //   return NextResponse.json({
    //     success: true,
    //     skipped: true,
    //     message: "Instagram URL refresh is already running",
    //     activeCronJobId: activeCronJob.id,
    //     activeCronJobStartedAt: activeCronJob.startedAt.toISOString(),
    //   });
    // }

    if (activeCronJob && !isManualForceRun) {
      console.log(
        `[CRON] Skipping Instagram URL refresh because run ${activeCronJob.id} is still active`,
      );

      return NextResponse.json({
        success: true,
        skipped: true,
        message: "Instagram URL refresh is already running",
        activeCronJobId: activeCronJob.id,
        activeCronJobStartedAt: activeCronJob.startedAt.toISOString(),
      });
    }

    if (activeCronJob && isManualForceRun) {
      console.log(
        `[FORCE] Bypassing active cron job ${activeCronJob.id} for targeted artist refresh`,
      );
    }

    // cronJobId = await createCronJobRecord("refresh-instagram-urls");

    const jobName = isManualForceRun
      ? "force-refresh-instagram-artist"
      : "refresh-instagram-urls";

    cronJobId = await createCronJobRecord(jobName);
    console.log("[CRON] Starting Instagram URL refresh job...");

    // Get all artists connected through username-based Business Discovery.
    const allArtists = await prisma.artist.findMany({
      where: {
        instagramId: { not: null },
        instagramUsername: { not: null },

        ...(artistId
          ? {
              id: artistId,
            }
          : {}),
      },
      select: {
        id: true,
        userId: true,
        instagramUsername: true,
        instagramRefreshNextRunAt: true,
        videos: {
          where: {
            source: "instagram",
          },
          orderBy: {
            updatedAt: "desc",
          },
          take: 1,
          select: {
            updatedAt: true,
          },
        },
      },
    });

    console.log(`[CRON] Found ${allArtists.length} total artists with Instagram connected`);

    if (isManualForceRun && allArtists.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: artistId
            ? `No Instagram-connected artist found with id ${artistId}`
            : `No Instagram-connected artist found`,
        },
        {
          status: 404,
        },
      );
    }

    console.log(
      `[CRON] Found ${allArtists.length} total artists with Instagram connected`,
    );

    // Refresh cached Instagram media URLs frequently because direct media URLs expire.
    const currentTime = new Date();
    const refreshCutoff = new Date(
      currentTime.getTime() -
        INSTAGRAM_MEDIA_REFRESH_INTERVAL_HOURS * 60 * 60 * 1000,
    );

    const artists: InstagramRefreshArtist[] = [];
    let skippedCount = 0;

    for (const artist of allArtists) {
      const latestInstagramVideoUpdatedAt =
        artist.videos[0]?.updatedAt ?? null;
      const isQueuedRefreshDue = Boolean(
        artist.instagramRefreshNextRunAt &&
          artist.instagramRefreshNextRunAt <= currentTime,
      );
      const isFallbackRefreshDue =
        !artist.instagramRefreshNextRunAt &&
        (!latestInstagramVideoUpdatedAt ||
          latestInstagramVideoUpdatedAt < refreshCutoff);

      // If no videos exist OR last update is older than our refresh window,
      // process this artist again to refresh stale media URLs.
      if (
        isManualForceRun ||
        isQueuedRefreshDue ||
        isFallbackRefreshDue
      ) {
        artists.push({
          id: artist.id,
          userId: artist.userId,
          instagramUsername: artist.instagramUsername,
          latestInstagramVideoUpdatedAt,
          instagramRefreshNextRunAt: artist.instagramRefreshNextRunAt,
        });

        if (isManualForceRun) {
          console.log(
            `[FORCE] Artist ${artist.id} added to refresh queue regardless of schedule`,
          );
        }
      } else {
        skippedCount++;
        console.log(
          artist.instagramRefreshNextRunAt
            ? `[CRON] Skipping artist ${artist.id}: queued for ${artist.instagramRefreshNextRunAt.toISOString()}`
            : latestInstagramVideoUpdatedAt
              ? `[CRON] Skipping artist ${artist.id}: last updated ${Math.floor((currentTime.getTime() - latestInstagramVideoUpdatedAt.getTime()) / (1000 * 60 * 60))} hours ago`
              : `[CRON] Skipping artist ${artist.id}: waiting for next refresh slot`,
        );
      }
    }

    artists.sort(compareArtistsByRefreshPriority);
    console.log("[CRON] Sorted artists by refresh priority ===========> Start: ", artists, "+++++ END ==============>");
    const artistsToProcess = artists.slice(
      0,
      Math.max(INSTAGRAM_REFRESH_MAX_ARTISTS_PER_RUN, 1),
    );

    console.log("[CRON] Artists to process ===========> Start: ", artistsToProcess, "+++++ END ==============>");

    const deferredArtistsCount = Math.max(
      artists.length - artistsToProcess.length,
      0,
    );

    console.log("[CRON] Deferred artists count ===========> ", deferredArtistsCount, "+++++ END ==============>");

    const totalBatches = Math.ceil(
      artistsToProcess.length / Math.max(INSTAGRAM_REFRESH_BATCH_SIZE, 1),
    );

    console.log(
      `[CRON] Processing ${artistsToProcess.length} eligible artists in ${totalBatches} batches (skipped ${skippedCount} recently updated, deferred ${deferredArtistsCount} to the next run)`,
    );

    const result = await processArtistsInBatches({
      artists: artistsToProcess,
      batchSize: INSTAGRAM_REFRESH_BATCH_SIZE,
      perArtistDelayMs: INSTAGRAM_REFRESH_ARTIST_DELAY_MS,
      batchDelayMs: INSTAGRAM_REFRESH_BATCH_DELAY_MS,
      retryDelayMs: INSTAGRAM_REFRESH_RETRY_DELAY_MS,
      maxRetryRounds: INSTAGRAM_REFRESH_MAX_RETRY_ROUNDS,
    });

    const metadata = {
      totalArtists: allArtists.length,
      artistsEligible: artists.length,
      artistsScheduledThisRun: artistsToProcess.length,
      artistsDeferredToNextRun: deferredArtistsCount,
      artistsDeferredDueToRateLimit: result.deferredArtists.length,
      artistIdsDeferredDueToRateLimit: result.deferredArtists.map(
        (artist) => artist.id,
      ),
      artistsSkipped: skippedCount,
      refreshIntervalHours: INSTAGRAM_MEDIA_REFRESH_INTERVAL_HOURS,
      batchSize: Math.max(INSTAGRAM_REFRESH_BATCH_SIZE, 1),
      maxArtistsPerRun: INSTAGRAM_REFRESH_MAX_ARTISTS_PER_RUN,
      maxApiCallsPerHour: INSTAGRAM_REFRESH_MAX_API_CALLS_PER_HOUR,
      batchesPlanned: totalBatches,
      batchesProcessed: result.batchesProcessed,
      perArtistDelayMs: INSTAGRAM_REFRESH_ARTIST_DELAY_MS,
      perBatchDelayMs: INSTAGRAM_REFRESH_BATCH_DELAY_MS,
      retryDelayMs: INSTAGRAM_REFRESH_RETRY_DELAY_MS,
      maxRetryRounds: INSTAGRAM_REFRESH_MAX_RETRY_ROUNDS,
      retryRoundsExecuted: result.retryRoundsExecuted,
      artistAttempts: result.artistAttempts,
      artistsProcessed: result.artistsProcessed,
      videosUpdated: result.videosUpdated,
      errors: result.errors,
      failedArtistsAfterRetries: result.failedArtists.length,
      failedArtistIds: result.failedArtists.map((artist) => artist.id),
      failedArtistInstagramUserNames: result.failedArtists.map((artist) => artist.instagramUsername),
      stoppedDueToRateLimit: result.stoppedDueToRateLimit,
      rateLimitBlockedUntil: result.rateLimitBlockedUntil?.toISOString() || null,
      apiCallsUsedThisHour: result.apiUsageSnapshot?.apiCallsCount || 0,
      apiCallsRemainingThisHour: result.apiUsageSnapshot
        ? Math.max(
            INSTAGRAM_REFRESH_MAX_API_CALLS_PER_HOUR -
              result.apiUsageSnapshot.apiCallsCount,
            0,
          )
        : INSTAGRAM_REFRESH_MAX_API_CALLS_PER_HOUR,
      apiUsageWindowStartedAt:
        result.apiUsageSnapshot?.windowStartedAt.toISOString() || null,
      apiUsageWindowEndsAt:
        result.apiUsageSnapshot?.windowEndsAt.toISOString() || null,
      apiRateLimitHitsThisHour: result.apiUsageSnapshot?.rateLimitHits || 0,
      errorMessages: result.errorMessages,
    };

    await updateCronJobRecord(cronJobId, "completed", null, metadata);

    console.log(`[CRON] Job completed:`, metadata);

    return NextResponse.json({
      success: true,
      message: "Instagram URL refresh completed",
      ...metadata,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    if (cronJobId) {
      await updateCronJobRecord(cronJobId, "failed", errorMessage);
    }

    console.error("[CRON] Job failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 },
    );
  }
}

/**
 * Refresh Instagram videos for a single artist
 * Fetches all current reels from Instagram, upserts them, and deletes old ones
 */
async function refreshArtistInstagramVideos(
  artistId: string,
  userId: string,
  username: string | null,
): Promise<{ videosUpdated: number }> {
  const artistProfiles = await prisma.artist.count({ where: { userId } });
  if (artistProfiles === 1) {
    await prisma.video.updateMany({
      where: { userId, source: "instagram", artistId: null },
      data: { artistId },
    });
  }

  let mediaData: InstagramMediaResponse;

  if (username) {
    // Refresh via the shared Business Discovery token.
    await reserveInstagramRefreshApiCallSlot();

    try {
      const account = await fetchInstagramAccountByUsername(username);
      mediaData = { data: account?.media?.data || [] };
    } catch (error) {
      if (isInstagramApplicationRateLimitError(error)) {
        const usageSnapshot = await markInstagramRefreshRateLimitHit(
          error instanceof Error ? error.message : "Application request limit reached",
        );

        throw new InstagramRefreshRateLimitError(
          error instanceof Error ? error.message : "Application request limit reached",
          usageSnapshot,
        );
      }

      throw error;
    }
  } else {
    throw new Error(`Artist ${artistId} has no Instagram username`);
  }

  if (!mediaData.data || mediaData.data.length === 0) {
    console.log(`[CRON] No media found for artist ${artistId}`);
    return { videosUpdated: 0 };
  }

  // Filter for VIDEO and REEL types only
  const currentReels = mediaData.data.filter(
    (item) => item.media_type === "VIDEO" || item.media_type === "REEL",
  );

  console.log(
    `[CRON] Found ${currentReels.length} current reels for artist ${artistId}`,
  );

  if (currentReels.length === 0) {
    // Delete all Instagram videos for this artist since they have none
    await prisma.video.deleteMany({
      where: {
        artistId: artistId,
        source: "instagram",
      },
    });
    return { videosUpdated: 0 };
  }

  // Get current Instagram reel IDs from their account
  const currentReelIds = new Set(currentReels.map((reel) => reel.id));

  // Delete videos that are no longer on Instagram
  const deleteResult = await prisma.video.deleteMany({
    where: {
      artistId: artistId,
      source: "instagram",
      instagramReelId: {
        not: null,
        notIn: Array.from(currentReelIds),
      },
    },
  });

  console.log(
    `[CRON] Deleted ${deleteResult.count} old reels for artist ${artistId}`,
  );

  let videosUpdated = 0;

  for (const reel of currentReels) {
    try {
      const safeCaption = sanitizeInstagramText(reel.caption);
      const safeMediaUrl = sanitizeInstagramUrl(reel.media_url);
      const safeThumbnailUrl =
        sanitizeInstagramUrl(reel.thumbnail_url) ||
        safeMediaUrl;

      const videoData = {
        userId: userId,
        artistId: artistId,
        title:
          safeCaption?.slice(0, 100) ||
          "Instagram Reel",
        description: safeCaption,
        url: safeMediaUrl || "",
        thumbnailUrl: safeThumbnailUrl || "",
        duration: 0,
        durationFormatted: "0:00",
        views: 0,
        publishedAt: new Date(reel.timestamp),
        isShort: true,
        source: "instagram",
        isApproved: true,
        instagramReelId: reel.id,
      };

      // Upsert: update if exists, create if new
      await prisma.video.upsert({
        where: {
          instagramReelId_userId: {
            instagramReelId: reel.id,
            userId: userId,
          },
        },
        update: {
          url: videoData.url,
          thumbnailUrl: videoData.thumbnailUrl,
          title: videoData.title,
          description: videoData.description,
          artistId: videoData.artistId,
          updatedAt: new Date(),
        },
        create: videoData,
      });

      videosUpdated++;
    } catch (error) {
      console.error(
        `[CRON] Failed to upsert reel ${reel.id} for artist ${artistId}:`,
        error,
      );
      // Continue with next reel instead of failing entire batch
    }
  }

  return { videosUpdated };
}

async function processArtistsInBatches(params: {
  artists: InstagramRefreshArtist[];
  batchSize: number;
  perArtistDelayMs: number;
  batchDelayMs: number;
  retryDelayMs: number;
  maxRetryRounds: number;
}): Promise<ArtistBatchProcessingResult> {
  const {
    artists,
    batchSize,
    perArtistDelayMs,
    batchDelayMs,
    retryDelayMs,
    maxRetryRounds,
  } = params;

  const safeBatchSize = Math.max(batchSize, 1);
  let pendingArtists = [...artists];
  let artistsProcessed = 0;
  let artistAttempts = 0;
  let videosUpdated = 0;
  let errors = 0;
  let retryRoundsExecuted = 0;
  let batchesProcessed = 0;
  const errorMessages: string[] = [];
  let deferredArtists: InstagramRefreshArtist[] = [];
  let stoppedDueToRateLimit = false;
  let rateLimitBlockedUntil: Date | null = null;
  let apiUsageSnapshot: InstagramRefreshApiUsageSnapshot | null = null;

  for (
    let attemptNumber = 0;
    pendingArtists.length > 0 && attemptNumber <= maxRetryRounds;
    attemptNumber++
  ) {
    const isRetryRound = attemptNumber > 0;
    const failedArtistsForNextAttempt: InstagramRefreshArtist[] = [];
    const batches = chunkArray(pendingArtists, safeBatchSize);

    if (isRetryRound) {
      retryRoundsExecuted++;

      if (retryDelayMs > 0) {
        console.log(
          `[CRON] Waiting ${retryDelayMs}ms before retry round ${retryRoundsExecuted} for ${pendingArtists.length} failed artists`,
        );
        await sleep(retryDelayMs);
      }
    }

    console.log(
      `[CRON] Starting ${isRetryRound ? `retry round ${retryRoundsExecuted}` : "initial pass"} with ${pendingArtists.length} artists across ${batches.length} batches`,
    );

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      batchesProcessed++;

      if (batchIndex > 0 && batchDelayMs > 0) {
        console.log(
          `[CRON] Waiting ${batchDelayMs}ms before batch ${batchIndex + 1}/${batches.length} on attempt ${attemptNumber + 1}`,
        );
        await sleep(batchDelayMs);
      }

      console.log(
        `[CRON] Processing batch ${batchIndex + 1}/${batches.length} on attempt ${attemptNumber + 1} (${batch.length} artists)`,
      );

      for (let artistIndex = 0; artistIndex < batch.length; artistIndex++) {
        const artist = batch[artistIndex];

        if (artistIndex > 0 && perArtistDelayMs > 0) {
          console.log(
            `[CRON] Waiting ${perArtistDelayMs}ms before next artist in batch ${batchIndex + 1}/${batches.length}`,
          );
          await sleep(perArtistDelayMs);
        }

        artistAttempts++;

        try {
          const result = await refreshArtistInstagramVideos(
            artist.id,
            artist.userId,
            artist.instagramUsername,
          );
          await prisma.artist.update({
            where: { id: artist.id },
            data: {
              instagramRefreshNextRunAt: scheduleNextInstagramRefresh(),
            },
          });

          artistsProcessed++;
          videosUpdated += result.videosUpdated;

          console.log(
            `[CRON] Artist ${artist.id}: updated ${result.videosUpdated} videos on attempt ${attemptNumber + 1}`,
          );
        } catch (error) {
          errors++;

          const message =
            error instanceof Error ? error.message : "Unknown error";
          errorMessages.push(
            `Attempt ${attemptNumber + 1}, batch ${batchIndex + 1}, artist ${artist.id}: ${message}`,
          );

          if (error instanceof InstagramRefreshRateLimitError) {
            stoppedDueToRateLimit = true;
            rateLimitBlockedUntil = error.blockedUntil;
            apiUsageSnapshot = error.usageSnapshot;
            deferredArtists = [
              artist,
              ...batch.slice(artistIndex + 1),
              ...batches.slice(batchIndex + 1).flat(),
            ];

            console.error(
              `[CRON] Stopping refresh run after hitting Instagram API rate limit. Blocked until ${error.blockedUntil.toISOString()}:`,
              error,
            );

            return {
              artistsProcessed,
              artistAttempts,
              videosUpdated,
              errors,
              errorMessages,
              retryRoundsExecuted,
              batchesProcessed,
              failedArtists: failedArtistsForNextAttempt,
              deferredArtists,
              stoppedDueToRateLimit,
              rateLimitBlockedUntil,
              apiUsageSnapshot,
            };
          }

          failedArtistsForNextAttempt.push(artist);

          console.error(
            `[CRON] Error processing artist ${artist.id} on attempt ${attemptNumber + 1}:`,
            error,
          );
        }
      }
    }

    pendingArtists = failedArtistsForNextAttempt;
  }

  if (pendingArtists.length > 0) {
    console.warn(
      `[CRON] ${pendingArtists.length} artists still failed after ${maxRetryRounds} retry rounds`,
    );
  }

  if (!apiUsageSnapshot) {
    apiUsageSnapshot = await getInstagramRefreshApiUsageSnapshot();
  }

  return {
    artistsProcessed,
    artistAttempts,
    videosUpdated,
    errors,
    errorMessages,
    retryRoundsExecuted,
    batchesProcessed,
    failedArtists: pendingArtists,
    deferredArtists,
    stoppedDueToRateLimit,
    rateLimitBlockedUntil,
    apiUsageSnapshot,
  };
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }

  return result;
}

function compareArtistsByRefreshPriority(
  a: InstagramRefreshArtist,
  b: InstagramRefreshArtist,
): number {
  if (a.instagramRefreshNextRunAt && b.instagramRefreshNextRunAt) {
    const queueTimeDifference =
      a.instagramRefreshNextRunAt.getTime() -
      b.instagramRefreshNextRunAt.getTime();

    if (queueTimeDifference !== 0) {
      return queueTimeDifference;
    }
  }

  if (a.instagramRefreshNextRunAt) {
    return -1;
  }

  if (b.instagramRefreshNextRunAt) {
    return 1;
  }

  if (!a.latestInstagramVideoUpdatedAt && !b.latestInstagramVideoUpdatedAt) {
    return a.id.localeCompare(b.id);
  }

  if (!a.latestInstagramVideoUpdatedAt) {
    return -1;
  }

  if (!b.latestInstagramVideoUpdatedAt) {
    return 1;
  }

  const timeDifference =
    a.latestInstagramVideoUpdatedAt.getTime() -
    b.latestInstagramVideoUpdatedAt.getTime();

  if (timeDifference !== 0) {
    return timeDifference;
  }

  return a.id.localeCompare(b.id);
}

async function sleep(ms: number): Promise<void> {
  if (ms <= 0) {
    return;
  }

  await new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Remove emojis and sanitize text for database storage
 */
function removeEmojis(text: string): string {
  if (!text) return "";

  return text
    .replace(/[\p{Extended_Pictographic}]/gu, "") // Remove emojis
    .replace(/\p{Cc}/gu, "") // Remove control characters / null bytes
    .replace(/\p{Cs}/gu, "") // Remove lone/unpaired surrogates
    .trim();
}

function sanitizeInstagramText(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const cleaned = removeEmojis(value)
    // Drop literal escape fragments that can break downstream serialization.
    .replace(/\\x[0-9A-Fa-f]{0,1}(?![0-9A-Fa-f])/g, "")
    .replace(/\\u[0-9A-Fa-f]{0,3}(?![0-9A-Fa-f])/g, "")
    .trim();

  return cleaned || null;
}

function sanitizeInstagramUrl(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const cleaned = value
    .replace(/\p{Cc}/gu, "")
    .replace(/\p{Cs}/gu, "")
    .trim();

  return cleaned || null;
}

function isInstagramApplicationRateLimitError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error || "");
  return (
    /Application request limit reached/i.test(message) ||
    /\(#4\)/.test(message)
  );
}

function getCurrentHourWindow(now = new Date()) {
  const windowStartedAt = new Date(now);
  windowStartedAt.setMinutes(0, 0, 0);

  const windowEndsAt = new Date(windowStartedAt);
  windowEndsAt.setHours(windowEndsAt.getHours() + 1);

  return { windowStartedAt, windowEndsAt };
}

async function reserveInstagramRefreshApiCallSlot(): Promise<InstagramRefreshApiUsageSnapshot> {
  const now = new Date();
  const { windowStartedAt, windowEndsAt } = getCurrentHourWindow(now);

  await prisma.instagramRefreshApiUsage.upsert({
    where: { windowStartedAt },
    create: {
      windowStartedAt,
      windowEndsAt,
    },
    update: {
      windowEndsAt,
    },
  });

  const usage = await prisma.instagramRefreshApiUsage.findUnique({
    where: { windowStartedAt },
  });

  if (!usage) {
    throw new Error("Failed to load Instagram refresh API usage");
  }

  if (usage.blockedUntil && usage.blockedUntil > now) {
    throw new InstagramRefreshRateLimitError(
      `Instagram refresh API is blocked until ${new Date(usage.blockedUntil!).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)`,
      toInstagramRefreshApiUsageSnapshot(usage),
    );
  }

  if (usage.apiCallsCount >= INSTAGRAM_REFRESH_MAX_API_CALLS_PER_HOUR) {
    const blockedUsage = await prisma.instagramRefreshApiUsage.update({
      where: { id: usage.id },
      data: {
        blockedUntil: usage.blockedUntil && usage.blockedUntil > windowEndsAt
          ? usage.blockedUntil
          : windowEndsAt,
        lastError: `Hourly API call cap reached (${INSTAGRAM_REFRESH_MAX_API_CALLS_PER_HOUR})`,
      },
    });

    throw new InstagramRefreshRateLimitError(
      `Hourly Instagram refresh API cap reached (${INSTAGRAM_REFRESH_MAX_API_CALLS_PER_HOUR})`,
      toInstagramRefreshApiUsageSnapshot(blockedUsage),
    );
  }

  const reservedUsage = await prisma.instagramRefreshApiUsage.update({
    where: { id: usage.id },
    data: {
      apiCallsCount: {
        increment: 1,
      },
      lastError: null,
    },
  });

  return toInstagramRefreshApiUsageSnapshot(reservedUsage);
}

async function markInstagramRefreshRateLimitHit(
  message: string,
): Promise<InstagramRefreshApiUsageSnapshot> {
  const now = new Date();
  const { windowStartedAt, windowEndsAt } = getCurrentHourWindow(now);

  const usage = await prisma.instagramRefreshApiUsage.upsert({
    where: { windowStartedAt },
    create: {
      windowStartedAt,
      windowEndsAt,
      rateLimitHits: 1,
      lastRateLimitedAt: now,
      blockedUntil: windowEndsAt,
      lastError: message,
    },
    update: {
      windowEndsAt,
      rateLimitHits: {
        increment: 1,
      },
      lastRateLimitedAt: now,
      blockedUntil: windowEndsAt,
      lastError: message,
    },
  });

  return toInstagramRefreshApiUsageSnapshot(usage);
}

async function getInstagramRefreshApiUsageSnapshot(): Promise<InstagramRefreshApiUsageSnapshot | null> {
  const { windowStartedAt } = getCurrentHourWindow(new Date());
  const usage = await prisma.instagramRefreshApiUsage.findUnique({
    where: { windowStartedAt },
  });

  return usage ? toInstagramRefreshApiUsageSnapshot(usage) : null;
}

function toInstagramRefreshApiUsageSnapshot(usage: {
  windowStartedAt: Date;
  windowEndsAt: Date;
  apiCallsCount: number;
  rateLimitHits: number;
  blockedUntil: Date | null;
  lastRateLimitedAt: Date | null;
}): InstagramRefreshApiUsageSnapshot {
  return {
    windowStartedAt: usage.windowStartedAt,
    windowEndsAt: usage.windowEndsAt,
    apiCallsCount: usage.apiCallsCount,
    rateLimitHits: usage.rateLimitHits,
    blockedUntil: usage.blockedUntil,
    lastRateLimitedAt: usage.lastRateLimitedAt,
  };
}

/**
 * Create a cron job record
 */
async function createCronJobRecord(jobName: string): Promise<string> {
  const cronJob = await prisma.cronJob.create({
    data: {
      jobName,
      status: "started",
    },
  });

  return cronJob.id;
}

/**
 * Update cron job record
 */
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
