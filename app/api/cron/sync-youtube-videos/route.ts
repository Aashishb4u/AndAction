import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getValidYouTubeToken } from "@/app/actions/youtube/youtube";
import type { Prisma } from "@prisma/client";

interface YouTubeChannelResponse {
  items?: Array<{
    contentDetails?: {
      relatedPlaylists?: {
        uploads?: string;
      };
    };
  }>;
}

interface YouTubePlaylistItem {
  snippet: {
    resourceId: {
      videoId: string;
    };
    title: string;
    description: string;
    publishedAt: string;
    thumbnails: {
      high?: { url: string };
      medium?: { url: string };
      default?: { url: string };
    };
  };
}

interface YouTubePlaylistResponse {
  items?: YouTubePlaylistItem[];
  nextPageToken?: string;
}

interface YouTubeVideoDetails {
  id: string;
  contentDetails?: {
    duration?: string;
  };
  statistics?: {
    viewCount?: string;
  };
}

interface YouTubeVideoDetailsResponse {
  items?: YouTubeVideoDetails[];
}

interface RecentVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  durationIso: string;
  viewCount: number;
}

export async function GET(request: NextRequest) {
  const cronJobId = await createCronJobRecord("sync-youtube-videos");

  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      await updateCronJobRecord(cronJobId, "failed", "Unauthorized");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[CRON] Starting YouTube sync (7-day rolling replacement)...");

    const allArtists = await prisma.artist.findMany({
      where: {
        youtubeChannelId: { not: null },
      },
      select: {
        id: true,
        userId: true,
        youtubeChannelId: true,
        youtubeAccessToken: true,
      },
    });

    console.log(`[CRON] Found ${allArtists.length} artists with YouTube channel`);

    // Match Instagram behavior: process an artist only once in ~7 days
    const sixDaysAgo = new Date();
    sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);

    const artists = [];
    let skippedCount = 0;

    for (const artist of allArtists) {
      const mostRecentVideo = await prisma.video.findFirst({
        where: {
          userId: artist.userId,
          source: "youtube",
        },
        orderBy: {
          updatedAt: "desc",
        },
        select: {
          updatedAt: true,
        },
      });

      if (!mostRecentVideo || mostRecentVideo.updatedAt < sixDaysAgo) {
        artists.push(artist);
      } else {
        skippedCount++;
        console.log(
          `[CRON] Skipping artist ${artist.id}: last YouTube sync ${Math.floor((Date.now() - mostRecentVideo.updatedAt.getTime()) / (1000 * 60 * 60 * 24))} days ago`,
        );
      }
    }

    console.log(
      `[CRON] Processing ${artists.length} artists (skipped ${skippedCount} recently updated)`,
    );

    let processed = 0;
    let totalInserted = 0;
    let totalDeleted = 0;
    let totalNewVideos = 0;
    let totalErrors = 0;
    const errors: string[] = [];

    for (const artist of artists) {
      if (!artist.youtubeChannelId) {
        continue;
      }

      try {
        const result = await syncArtistYoutubeRollingWindow({
          artistId: artist.id,
          userId: artist.userId,
          youtubeChannelId: artist.youtubeChannelId,
          hasOAuthToken: !!artist.youtubeAccessToken,
        });

        processed++;
        totalInserted += result.inserted;
        totalDeleted += result.deleted;
        totalNewVideos += result.newVideoCount;

        console.log(
          `[CRON] Artist ${artist.id}: recent=${result.recentCount}, new=${result.newVideoCount}, deleted=${result.deleted}, inserted=${result.inserted}`,
        );
      } catch (error) {
        totalErrors++;
        const message =
          error instanceof Error ? error.message : "Unknown error";
        errors.push(`Artist ${artist.id}: ${message}`);
        console.error(`[CRON] Error for artist ${artist.id}:`, error);
      }
    }

    const metadata = {
      artistsFound: allArtists.length,
      artistsEligible: artists.length,
      artistsSkipped: skippedCount,
      artistsProcessed: processed,
      newVideosDetected: totalNewVideos,
      videosDeleted: totalDeleted,
      videosInserted: totalInserted,
      errors: totalErrors,
      errorMessages: errors,
    };

    await updateCronJobRecord(cronJobId, "completed", null, metadata);

    return NextResponse.json({
      success: true,
      message: "YouTube 7-day rolling sync completed",
      ...metadata,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    await updateCronJobRecord(cronJobId, "failed", errorMessage);

    console.error("[CRON] YouTube sync failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 },
    );
  }
}

async function syncArtistYoutubeRollingWindow(params: {
  artistId: string;
  userId: string;
  youtubeChannelId: string;
  hasOAuthToken: boolean;
}): Promise<{ recentCount: number; newVideoCount: number; deleted: number; inserted: number }> {
  const { artistId, userId, youtubeChannelId, hasOAuthToken } = params;

  const auth = await buildYouTubeAuth(artistId, hasOAuthToken);
  const uploadsPlaylistId = await getUploadsPlaylistId(
    youtubeChannelId,
    auth.headers,
    auth.apiKeyParam,
  );

  if (!uploadsPlaylistId) {
    throw new Error("No uploads playlist found");
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentPlaylistItems = await fetchRecentPlaylistItems(
    uploadsPlaylistId,
    sevenDaysAgo,
    auth.headers,
    auth.apiKeyParam,
  );

  if (recentPlaylistItems.length === 0) {
    return { recentCount: 0, newVideoCount: 0, deleted: 0, inserted: 0 };
  }

  const detailedVideos = await hydrateVideoDetails(
    recentPlaylistItems,
    auth.headers,
    auth.apiKeyParam,
  );

  const recentVideoIds = detailedVideos.map((v) => v.id);

  const existingVideos = await prisma.video.findMany({
    where: {
      userId,
      source: "youtube",
      youtubeVideoId: {
        in: recentVideoIds,
      },
    },
    select: {
      youtubeVideoId: true,
    },
  });

  const existingSet = new Set(
    existingVideos
      .map((v) => v.youtubeVideoId)
      .filter((id): id is string => Boolean(id)),
  );

  const newVideos = detailedVideos.filter((video) => !existingSet.has(video.id));
  const newCount = newVideos.length;

  if (newCount === 0) {
    return {
      recentCount: detailedVideos.length,
      newVideoCount: 0,
      deleted: 0,
      inserted: 0,
    };
  }

  const oldestVideosToDelete = await prisma.video.findMany({
    where: {
      userId,
      source: "youtube",
    },
    orderBy: [
      { publishedAt: "asc" },
      { createdAt: "asc" },
    ],
    take: newCount,
    select: {
      id: true,
    },
  });

  const idsToDelete = oldestVideosToDelete.map((video) => video.id);

  let deletedCount = 0;
  if (idsToDelete.length > 0) {
    const deleteResult = await prisma.video.deleteMany({
      where: {
        id: {
          in: idsToDelete,
        },
      },
    });
    deletedCount = deleteResult.count;
  }

  const insertData = newVideos.map((video) => {
    const durationSeconds = parseDurationToSeconds(video.durationIso);
    return {
      youtubeVideoId: video.id,
      userId,
      title: video.title,
      description: video.description,
      url: `https://www.youtube.com/watch?v=${video.id}`,
      thumbnailUrl: video.thumbnailUrl,
      duration: durationSeconds,
      durationFormatted: formatDuration(video.durationIso),
      views: video.viewCount,
      publishedAt: new Date(video.publishedAt),
      isShort: durationSeconds <= 60,
      source: "youtube",
      isApproved: true,
    };
  });

  const insertResult = await prisma.video.createMany({
    data: insertData,
    skipDuplicates: true,
  });

  return {
    recentCount: detailedVideos.length,
    newVideoCount: newCount,
    deleted: deletedCount,
    inserted: insertResult.count,
  };
}

async function buildYouTubeAuth(
  artistId: string,
  hasOAuthToken: boolean,
): Promise<{ headers: Record<string, string>; apiKeyParam: string }> {
  if (hasOAuthToken) {
    const token = await getValidYouTubeToken(artistId);

    if (!token) {
      throw new Error("Failed to get valid YouTube token");
    }

    return {
      headers: { Authorization: `Bearer ${token}` },
      apiKeyParam: "",
    };
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY is missing");
  }

  return {
    headers: {},
    apiKeyParam: `&key=${apiKey}`,
  };
}

async function getUploadsPlaylistId(
  youtubeChannelId: string,
  headers: Record<string, string>,
  apiKeyParam: string,
): Promise<string | null> {
  const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${youtubeChannelId}${apiKeyParam}`;
  const response = await fetch(channelUrl, { headers });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to fetch channel info: ${errText}`);
  }

  const data: YouTubeChannelResponse = await response.json();
  return data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads || null;
}

async function fetchRecentPlaylistItems(
  uploadsPlaylistId: string,
  sinceDate: Date,
  headers: Record<string, string>,
  apiKeyParam: string,
): Promise<YouTubePlaylistItem[]> {
  const results: YouTubePlaylistItem[] = [];
  let nextPageToken: string | undefined;

  do {
    const pageTokenParam = nextPageToken ? `&pageToken=${nextPageToken}` : "";
    const playlistUrl =
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=50${pageTokenParam}${apiKeyParam}`;

    const response = await fetch(playlistUrl, { headers });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to fetch playlist items: ${errText}`);
    }

    const page: YouTubePlaylistResponse = await response.json();
    const items = page.items || [];

    for (const item of items) {
      const published = new Date(item.snippet.publishedAt);
      if (published >= sinceDate) {
        results.push(item);
      }
    }

    if (items.length === 0) {
      break;
    }

    const oldestInPage = new Date(items[items.length - 1].snippet.publishedAt);
    if (oldestInPage < sinceDate) {
      break;
    }

    nextPageToken = page.nextPageToken;
  } while (nextPageToken);

  return results;
}

async function hydrateVideoDetails(
  playlistItems: YouTubePlaylistItem[],
  headers: Record<string, string>,
  apiKeyParam: string,
): Promise<RecentVideo[]> {
  const idToItem = new Map(
    playlistItems.map((item) => [item.snippet.resourceId.videoId, item]),
  );

  const uniqueIds = Array.from(idToItem.keys());
  const detailsMap = new Map<string, YouTubeVideoDetails>();

  for (let i = 0; i < uniqueIds.length; i += 50) {
    const chunk = uniqueIds.slice(i, i + 50);
    const ids = chunk.join(",");

    const detailsUrl =
      `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics&id=${ids}${apiKeyParam}`;

    const response = await fetch(detailsUrl, { headers });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to fetch video details: ${errText}`);
    }

    const data: YouTubeVideoDetailsResponse = await response.json();
    for (const item of data.items || []) {
      detailsMap.set(item.id, item);
    }
  }

  return uniqueIds.map((id) => {
    const playlistItem = idToItem.get(id);
    const details = detailsMap.get(id);

    return {
      id,
      title: playlistItem?.snippet.title || "Untitled",
      description: playlistItem?.snippet.description || "",
      thumbnailUrl:
        playlistItem?.snippet.thumbnails.high?.url ||
        playlistItem?.snippet.thumbnails.medium?.url ||
        playlistItem?.snippet.thumbnails.default?.url ||
        "",
      publishedAt: playlistItem?.snippet.publishedAt || new Date().toISOString(),
      durationIso: details?.contentDetails?.duration || "PT0S",
      viewCount: parseInt(details?.statistics?.viewCount || "0", 10),
    };
  });
}

function parseDurationToSeconds(isoDuration: string): number {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) {
    return 0;
  }

  const hours = match[1] ? parseInt(match[1], 10) : 0;
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const seconds = match[3] ? parseInt(match[3], 10) : 0;

  return hours * 3600 + minutes * 60 + seconds;
}

function formatDuration(isoDuration: string): string {
  const totalSeconds = parseDurationToSeconds(isoDuration);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
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
  metadata: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined = undefined,
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
