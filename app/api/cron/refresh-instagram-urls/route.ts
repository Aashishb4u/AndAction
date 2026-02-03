import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getValidInstagramToken } from "@/app/actions/instagram/instagram";

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
  paging?: {
    cursors: {
      after?: string;
    };
    next?: string;
  };
}

export async function GET(request: NextRequest) {
  const cronJobId = await createCronJobRecord("refresh-instagram-urls");

  try {
    // Security check - validate cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      await updateCronJobRecord(cronJobId, "failed", "Unauthorized");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[CRON] Starting Instagram URL refresh job...");

    // Get all artists with Instagram connected
    const allArtists = await prisma.artist.findMany({
      where: {
        AND: [
          { instagramId: { not: null } },
          { instagramAccessToken: { not: null } },
        ],
      },
      select: {
        id: true,
        userId: true,
        instagramId: true,
        instagramAccessToken: true,
      },
    });

    console.log(
      `[CRON] Found ${allArtists.length} total artists with Instagram connected`,
    );

    // Filter artists by priority: only process if last video update was 6+ days ago
    const sixDaysAgo = new Date();
    sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);

    const artists = [];
    let skippedCount = 0;

    for (const artist of allArtists) {
      // Get the most recent video update for this artist
      const mostRecentVideo = await prisma.video.findFirst({
        where: {
          userId: artist.userId,
          source: "instagram",
        },
        orderBy: {
          updatedAt: "desc",
        },
        select: {
          updatedAt: true,
        },
      });

      // If no videos exist OR last update was 6+ days ago, process this artist
      if (!mostRecentVideo || mostRecentVideo.updatedAt < sixDaysAgo) {
        artists.push(artist);
      } else {
        skippedCount++;
        console.log(
          `[CRON] Skipping artist ${artist.id}: last updated ${Math.floor((Date.now() - mostRecentVideo.updatedAt.getTime()) / (1000 * 60 * 60 * 24))} days ago`,
        );
      }
    }

    console.log(
      `[CRON] Processing ${artists.length} artists (skipped ${skippedCount} recently updated)`,
    );

    let totalArtistsProcessed = 0;
    let totalVideosUpdated = 0;
    let totalErrors = 0;
    const errors: string[] = [];

    // Process each artist
    for (const artist of artists) {
      try {
        const result = await refreshArtistInstagramVideos(
          artist.id,
          artist.userId,
        );
        totalArtistsProcessed++;
        totalVideosUpdated += result.videosUpdated;

        console.log(
          `[CRON] Artist ${artist.id}: Updated ${result.videosUpdated} videos`,
        );
      } catch (error) {
        totalErrors++;
        const errorMsg = `Artist ${artist.id}: ${error instanceof Error ? error.message : "Unknown error"}`;
        errors.push(errorMsg);
        console.error(`[CRON] Error processing artist ${artist.id}:`, error);
      }
    }

    const metadata = {
      totalArtists: allArtists.length,
      artistsEligible: artists.length,
      artistsSkipped: skippedCount,
      artistsProcessed: totalArtistsProcessed,
      videosUpdated: totalVideosUpdated,
      errors: totalErrors,
      errorMessages: errors,
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
): Promise<{ videosUpdated: number }> {
  const accessToken = await getValidInstagramToken(artistId);

  if (!accessToken) {
    throw new Error(
      `Failed to get valid Instagram token for artist ${artistId}`,
    );
  }

  // Fetch all current media from Instagram (only 1 API call!)
  const response = await fetch(
    `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&access_token=${accessToken}`,
  );

  if (!response.ok) {
    const errorData = await response.text();
    console.error(
      `[CRON] Failed to fetch Instagram media for artist ${artistId}:`,
      errorData,
    );
    throw new Error("Failed to fetch Instagram media");
  }

  const mediaData: InstagramMediaResponse = await response.json();

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
        userId: userId,
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
      userId: userId,
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
  metadata: any = null,
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
