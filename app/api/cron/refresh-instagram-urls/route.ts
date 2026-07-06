import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchInstagramAccountByUsername } from "@/lib/instagram-discovery";
import type { Prisma } from "@prisma/client";

const INSTAGRAM_MEDIA_REFRESH_INTERVAL_HOURS = Number(
  process.env.INSTAGRAM_MEDIA_REFRESH_INTERVAL_HOURS || 22,
);
const INSTAGRAM_REFRESH_BATCH_SIZE = Number(
  process.env.INSTAGRAM_REFRESH_BATCH_SIZE || 10,
);
const INSTAGRAM_REFRESH_ARTIST_DELAY_MS = Number(
  process.env.INSTAGRAM_REFRESH_ARTIST_DELAY_MS || 1000,
);
const INSTAGRAM_REFRESH_BATCH_DELAY_MS = Number(
  process.env.INSTAGRAM_REFRESH_BATCH_DELAY_MS || 2000,
);
const INSTAGRAM_REFRESH_RETRY_DELAY_MS = Number(
  process.env.INSTAGRAM_REFRESH_RETRY_DELAY_MS || 5 * 60 * 1000,
);
const INSTAGRAM_REFRESH_MAX_RETRY_ROUNDS = Number(
  process.env.INSTAGRAM_REFRESH_MAX_RETRY_ROUNDS || 1,
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
}

export async function GET(request: NextRequest) {
  const cronJobId = await createCronJobRecord("refresh-instagram-urls");

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
      await updateCronJobRecord(cronJobId, "failed", "Unauthorized");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[CRON] Starting Instagram URL refresh job...");

    // Get all artists connected through username-based Business Discovery.
    const allArtists = await prisma.artist.findMany({
      where: {
        instagramId: { not: null },
        instagramUsername: { not: null },
      },
      select: {
        id: true,
        userId: true,
        instagramUsername: true,
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

    console.log(
      `[CRON] Found ${allArtists.length} total artists with Instagram connected`,
    );

    // Refresh cached Instagram media URLs frequently because direct media URLs expire.
    const refreshCutoff = new Date(
      Date.now() - INSTAGRAM_MEDIA_REFRESH_INTERVAL_HOURS * 60 * 60 * 1000,
    );

    const artists: InstagramRefreshArtist[] = [];
    let skippedCount = 0;

    for (const artist of allArtists) {
      const latestInstagramVideoUpdatedAt =
        artist.videos[0]?.updatedAt ?? null;

      // If no videos exist OR last update is older than our refresh window,
      // process this artist again to refresh stale media URLs.
      if (
        !latestInstagramVideoUpdatedAt ||
        latestInstagramVideoUpdatedAt < refreshCutoff
      ) {
        artists.push({
          id: artist.id,
          userId: artist.userId,
          instagramUsername: artist.instagramUsername,
          latestInstagramVideoUpdatedAt,
        });
      } else {
        skippedCount++;
        console.log(
          `[CRON] Skipping artist ${artist.id}: last updated ${Math.floor((Date.now() - latestInstagramVideoUpdatedAt.getTime()) / (1000 * 60 * 60))} hours ago`,
        );
      }
    }

    artists.sort(compareArtistsByRefreshPriority);

    const totalBatches = Math.ceil(
      artists.length / Math.max(INSTAGRAM_REFRESH_BATCH_SIZE, 1),
    );

    console.log(
      `[CRON] Processing ${artists.length} eligible artists in ${totalBatches} batches (skipped ${skippedCount} recently updated)`,
    );

    const result = await processArtistsInBatches({
      artists,
      batchSize: INSTAGRAM_REFRESH_BATCH_SIZE,
      perArtistDelayMs: INSTAGRAM_REFRESH_ARTIST_DELAY_MS,
      batchDelayMs: INSTAGRAM_REFRESH_BATCH_DELAY_MS,
      retryDelayMs: INSTAGRAM_REFRESH_RETRY_DELAY_MS,
      maxRetryRounds: INSTAGRAM_REFRESH_MAX_RETRY_ROUNDS,
    });

    const metadata = {
      totalArtists: allArtists.length,
      artistsEligible: artists.length,
      artistsSkipped: skippedCount,
      batchSize: Math.max(INSTAGRAM_REFRESH_BATCH_SIZE, 1),
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
    await updateCronJobRecord(cronJobId, "failed", errorMessage);

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
    const account = await fetchInstagramAccountByUsername(username);
    mediaData = { data: account?.media?.data || [] };
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
      const videoData = {
        userId: userId,
        artistId: artistId,
        title: removeEmojis(reel.caption?.slice(0, 100) || "Instagram Reel"),
        description: removeEmojis(reel.caption || ""),
        url: reel.media_url || "",
        thumbnailUrl: reel.thumbnail_url || reel.media_url || "",
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

  return {
    artistsProcessed,
    artistAttempts,
    videosUpdated,
    errors,
    errorMessages,
    retryRoundsExecuted,
    batchesProcessed,
    failedArtists: pendingArtists,
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
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Remove control characters
    .replace(/\\/g, "\\\\") // Escape backslashes
    .trim();
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
