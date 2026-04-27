"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { getValidYouTubeToken } from "@/app/actions/youtube/youtube";

interface YouTubeVideoData {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  videoUrl: string;
  publishedAt: string;
  duration: string;
  durationSeconds: number;
  viewCount: string;
  isShort: boolean;
}

interface SyncResult {
  success: boolean;
  message: string;
  synced?: number;
  skipped?: number;
  total?: number;
  importedVideos?: number;
  importedShorts?: number;
}

interface YouTubePlaylistItemResponse {
  items?: Array<{
    snippet: {
      resourceId: {
        videoId: string;
      };
      title: string;
      description: string;
      thumbnails: {
        high?: { url: string };
        medium?: { url: string };
        default?: { url: string };
      };
      publishedAt: string;
    };
  }>;
  nextPageToken?: string;
}

interface YouTubeVideoDetailsResponse {
  items?: Array<{
    id: string;
    contentDetails: {
      duration: string;
    };
    statistics: {
      viewCount: string;
    };
  }>;
}

const YT_MAX_VIDEOS = 25;
const YT_MAX_SHORTS = 25;
const YT_SHORT_MAX_SECONDS = 180;
const YT_PLAYLIST_PAGE_SIZE = 50;
const YT_MAX_PLAYLIST_PAGES = 6;

function parseDurationToSeconds(isoDuration: string): number {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const seconds = match[3] ? parseInt(match[3]) : 0;

  return hours * 3600 + minutes * 60 + seconds;
}

function formatDuration(isoDuration: string): string {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "0:00";

  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const seconds = match[3] ? parseInt(match[3]) : 0;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export async function syncYouTubeVideos(
  artistProfileId?: string | null
): Promise<SyncResult> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" };
    }

    const artist = artistProfileId
      ? await prisma.artist.findFirst({
          where: { id: artistProfileId, userId: session.user.id },
          select: { id: true, youtubeChannelId: true, youtubeAccessToken: true },
        })
      : await prisma.artist.findFirst({
          where: { userId: session.user.id },
          orderBy: { profileOrder: "asc" },
          select: { id: true, youtubeChannelId: true, youtubeAccessToken: true },
        });

    if (!artist) {
      return { success: false, message: "Artist profile not found" };
    }

    if (!artist.youtubeChannelId) {
      return { success: false, message: "YouTube not connected" };
    }

    // Call internal sync function
    return await syncYouTubeVideosInternal(
      artist.id,
      session.user.id,
      artist.youtubeChannelId,
      artist.youtubeAccessToken
    );
  } catch (error) {
    console.error("Error syncing YouTube videos:", error);
    return { success: false, message: "Failed to sync videos" };
  }
}

/**
 * Internal sync function that can be called directly with artist details
 * Used for auto-sync after channel connection
 */
export async function syncYouTubeVideosInternal(
  artistId: string,
  userId: string,
  youtubeChannelId: string,
  youtubeAccessToken: string | null
): Promise<SyncResult> {
  try {
    // Determine whether to use OAuth or API key
    const useOAuth = !!youtubeAccessToken;
    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

    let authHeader: Record<string, string> = {};
    let apiKeyParam = "";

    if (useOAuth) {
      // Get valid access token for OAuth
      const accessToken = await getValidYouTubeToken(artistId);

      if (!accessToken) {
        return {
          success: false,
          message: "Failed to get valid YouTube token. Please reconnect.",
        };
      }
      authHeader = { Authorization: `Bearer ${accessToken}` };
    } else {
      // Use API key for public data
      if (!YOUTUBE_API_KEY) {
        return {
          success: false,
          message: "YouTube API is not configured. Please contact support.",
        };
      }
      apiKeyParam = `&key=${YOUTUBE_API_KEY}`;
    }

    // Get uploads playlist ID
    const channelUrl = useOAuth
      ? `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${youtubeChannelId}`
      : `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${youtubeChannelId}${apiKeyParam}`;

    const channelResponse = await fetch(channelUrl, { headers: authHeader });

    if (!channelResponse.ok) {
      return { success: false, message: "Failed to fetch channel info" };
    }

    const channelData = await channelResponse.json();
    const uploadsPlaylistId =
      channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

    if (!uploadsPlaylistId) {
      return { success: false, message: "No uploads playlist found" };
    }

    const playlistItems: YouTubePlaylistItemResponse["items"] = [];
    let nextPageToken: string | undefined = undefined;
    for (let page = 0; page < YT_MAX_PLAYLIST_PAGES; page++) {
      const pageTokenParam = nextPageToken ? `&pageToken=${nextPageToken}` : "";
      const playlistUrl = useOAuth
        ? `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=${YT_PLAYLIST_PAGE_SIZE}${pageTokenParam}`
        : `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=${YT_PLAYLIST_PAGE_SIZE}${pageTokenParam}${apiKeyParam}`;

      const playlistResponse = await fetch(playlistUrl, { headers: authHeader });

      if (!playlistResponse.ok) {
        return { success: false, message: "Failed to fetch videos" };
      }

      const playlistData: YouTubePlaylistItemResponse = await playlistResponse.json();
      if (playlistData.items?.length) {
        playlistItems.push(...playlistData.items);
      }
      nextPageToken = playlistData.nextPageToken;
      if (!nextPageToken) break;
    }

    const videoItems = playlistItems || [];

    if (videoItems.length === 0) {
      return {
        success: true,
        message: "No videos found on YouTube channel",
        synced: 0,
        skipped: 0,
        total: 0,
      };
    }

    const uniqueVideoIds = Array.from(
      new Set(videoItems.map((item) => item.snippet.resourceId.videoId))
    );

    const videoDetailsMap = new Map<string, YouTubeVideoDetailsResponse["items"][number]>();
    for (let i = 0; i < uniqueVideoIds.length; i += 50) {
      const batchIds = uniqueVideoIds.slice(i, i + 50).join(",");
      const videoDetailsUrl = useOAuth
        ? `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics&id=${batchIds}`
        : `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics&id=${batchIds}${apiKeyParam}`;
      const videoDetailsResponse = await fetch(videoDetailsUrl, { headers: authHeader });
      const videoDetailsData: YouTubeVideoDetailsResponse = await videoDetailsResponse.json();
      for (const detail of videoDetailsData.items || []) {
        videoDetailsMap.set(detail.id, detail);
      }
    }

    // Process and sync videos
    let synced = 0;
    let skipped = 0;
    let importedVideos = 0;
    let importedShorts = 0;

    for (const item of videoItems) {
      if (importedVideos >= YT_MAX_VIDEOS && importedShorts >= YT_MAX_SHORTS) break;
      const videoId = item.snippet.resourceId.videoId;
      const details = videoDetailsMap.get(videoId);
      const duration = details?.contentDetails?.duration || "PT0S";
      const durationSeconds = parseDurationToSeconds(duration);
      const isShort =
        durationSeconds <= YT_SHORT_MAX_SECONDS ||
        /(^|\s)#shorts(\s|$)/i.test(
          `${item.snippet.title || ""} ${item.snippet.description || ""}`
        );
      if (isShort && importedShorts >= YT_MAX_SHORTS) continue;
      if (!isShort && importedVideos >= YT_MAX_VIDEOS) continue;

      // Check if video already exists
      const existingVideo = await prisma.video.findUnique({
        where: {
          youtubeVideoId_userId: {
            youtubeVideoId: videoId,
            userId: userId,
          }
        },
      });

      if (existingVideo) {
        // Update existing video
        await prisma.video.update({
          where: {
            youtubeVideoId_userId: {
              youtubeVideoId: videoId,
              userId: userId
            }
          },
          data: {
            artistId,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnailUrl:
              item.snippet.thumbnails.high?.url ||
              item.snippet.thumbnails.medium?.url ||
              item.snippet.thumbnails.default?.url,
            views: parseInt(details?.statistics?.viewCount || "0"),
            isApproved: true,
            updatedAt: new Date(),
          },
        });
        skipped++;
      } else {
        // Create new video
        await prisma.video.create({
          data: {
            youtubeVideoId: videoId,
            userId: userId,
            artistId,
            title: item.snippet.title,
            description: item.snippet.description,
            url: `https://www.youtube.com/watch?v=${videoId}`,
            thumbnailUrl:
              item.snippet.thumbnails.high?.url ||
              item.snippet.thumbnails.medium?.url ||
              item.snippet.thumbnails.default?.url,
            duration: durationSeconds,
            durationFormatted: formatDuration(duration),
            views: parseInt(details?.statistics?.viewCount || "0"),
            publishedAt: new Date(item.snippet.publishedAt),
            isShort,
            source: "youtube",
            isApproved: true,
          },
        });
        synced++;
      }

      if (isShort) importedShorts++;
      else importedVideos++;
    }

    const extraVideoIds = await prisma.video.findMany({
      where: { artistId, source: "youtube", isShort: false },
      orderBy: { publishedAt: "desc" },
      skip: YT_MAX_VIDEOS,
      select: { id: true },
    });
    if (extraVideoIds.length > 0) {
      await prisma.video.deleteMany({
        where: { id: { in: extraVideoIds.map((v) => v.id) } },
      });
    }

    const extraShortIds = await prisma.video.findMany({
      where: { artistId, source: "youtube", isShort: true },
      orderBy: { publishedAt: "desc" },
      skip: YT_MAX_SHORTS,
      select: { id: true },
    });
    if (extraShortIds.length > 0) {
      await prisma.video.deleteMany({
        where: { id: { in: extraShortIds.map((v) => v.id) } },
      });
    }

    revalidatePath("/artist/profile");

    return {
      success: true,
      message: `Sync complete! ${synced} new items added, ${skipped} updated.`,
      synced,
      skipped,
      total: importedVideos + importedShorts,
      importedVideos,
      importedShorts,
    };
  } catch (error) {
    console.error("Error syncing YouTube videos (internal):", error);
    return { success: false, message: "Failed to sync videos" };
  }
}

export async function getSyncedVideos(
  type: "all" | "shorts" | "videos",
  artistProfileId?: string | null
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized", data: null };
    }

    const artist = artistProfileId
      ? await prisma.artist.findFirst({
          where: { id: artistProfileId, userId: session.user.id },
          select: { id: true },
        })
      : await prisma.artist.findFirst({
          where: { userId: session.user.id, profileOrder: 0 },
          select: { id: true },
        });

    if (!artist) {
      return { success: false, message: "Artist profile not found", data: null };
    }

    const isShort =
      type === "shorts" ? true : type === "videos" ? false : undefined;

    const videos = await prisma.video.findMany({
      where: {
        artistId: artist.id,
        isShort,
      },
      take: type === "videos" || type === "shorts" ? 25 : 50,
      orderBy: { publishedAt: "desc" },
      select: {
        id: true,
        youtubeVideoId: true,
        title: true,
        description: true,
        url: true,
        thumbnailUrl: true,
        duration: true,
        durationFormatted: true,
        views: true,
        publishedAt: true,
        isShort: true,
        source: true,
      },
    });

    return { success: true, data: videos };
  } catch (error) {
    console.error("Error fetching synced videos:", error);
    return { success: false, message: "Failed to fetch videos", data: null };
  }
}

/**
 * Check if YouTube is connected and has synced videos
 */
export async function getYouTubeSyncStatus(artistProfileId?: string | null) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, connected: false, videoCount: 0, shortCount: 0 };
    }

    const artist = artistProfileId
      ? await prisma.artist.findFirst({
          where: { id: artistProfileId, userId: session.user.id },
          select: { id: true, youtubeChannelId: true, youtubeChannelName: true },
        })
      : await prisma.artist.findFirst({
          where: { userId: session.user.id, profileOrder: 0 },
          select: { id: true, youtubeChannelId: true, youtubeChannelName: true },
        });

    // Connected if channel ID exists (either via OAuth or manual connection)
    const isConnected = !!artist?.youtubeChannelId;

    // Get video counts
    const [videoCount, shortCount] = await Promise.all([
      prisma.video.count({
        where: { artistId: artist?.id ?? undefined, isShort: false },
      }),
      prisma.video.count({
        where: { artistId: artist?.id ?? undefined, isShort: true },
      }),
    ]);

    return {
      success: true,
      connected: isConnected,
      channelName: artist?.youtubeChannelName || null,
      videoCount,
      shortCount,
    };
  } catch (error) {
    console.error("Error checking YouTube sync status:", error);
    return { success: false, connected: false, videoCount: 0, shortCount: 0 };
  }
}
