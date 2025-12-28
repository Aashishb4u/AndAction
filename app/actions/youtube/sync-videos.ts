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

export async function syncYouTubeVideos(): Promise<SyncResult> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" };
    }

    // Get artist profile
    const artist = await prisma.artist.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        youtubeChannelId: true,
        youtubeAccessToken: true,
      },
    });

    if (!artist) {
      return { success: false, message: "Artist profile not found" };
    }

    if (!artist.youtubeChannelId || !artist.youtubeAccessToken) {
      return { success: false, message: "YouTube not connected" };
    }

    // Get valid access token
    const accessToken = await getValidYouTubeToken(artist.id);

    if (!accessToken) {
      return {
        success: false,
        message: "Failed to get valid YouTube token. Please reconnect.",
      };
    }

    // Get uploads playlist ID
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${artist.youtubeChannelId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!channelResponse.ok) {
      return { success: false, message: "Failed to fetch channel info" };
    }

    const channelData = await channelResponse.json();
    console.log(`shorts data : ${JSON.stringify(channelData)}`)
    const uploadsPlaylistId =
      channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

    if (!uploadsPlaylistId) {
      return { success: false, message: "No uploads playlist found" };
    }

    // Fetch videos from playlist
    const playlistResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=50`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!playlistResponse.ok) {
      return { success: false, message: "Failed to fetch videos" };
    }

    const playlistData: YouTubePlaylistItemResponse =
      await playlistResponse.json();
    const videoItems = playlistData.items || [];

    if (videoItems.length === 0) {
      return {
        success: true,
        message: "No videos found on YouTube channel",
        synced: 0,
        skipped: 0,
        total: 0,
      };
    }

    // Get video details (duration, views)
    const videoIds = videoItems
      .map((item) => item.snippet.resourceId.videoId)
      .join(",");
    const videoDetailsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics&id=${videoIds}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const videoDetailsData: YouTubeVideoDetailsResponse =
      await videoDetailsResponse.json();
    const videoDetailsMap = new Map(
      videoDetailsData.items?.map((item) => [item.id, item]) || []
    );

    // Process and sync videos
    let synced = 0;
    let skipped = 0;

    for (const item of videoItems) {
      const videoId = item.snippet.resourceId.videoId;
      const details = videoDetailsMap.get(videoId);
      const duration = details?.contentDetails?.duration || "PT0S";
      const durationSeconds = parseDurationToSeconds(duration);
      const isShort = durationSeconds <= 60;

      // Check if video already exists
      const existingVideo = await prisma.video.findUnique({
        where: {
          youtubeVideoId_userId: {
            youtubeVideoId: videoId,
            userId: session.user.id,
          }
        },
      });

      if (existingVideo) {
        // Update existing video
        await prisma.video.update({
          where: {
            youtubeVideoId_userId: {
              youtubeVideoId: videoId,
              userId: session.user.id
            }
          },
          data: {
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnailUrl:
              item.snippet.thumbnails.high?.url ||
              item.snippet.thumbnails.medium?.url ||
              item.snippet.thumbnails.default?.url,
            views: parseInt(details?.statistics?.viewCount || "0"),
            updatedAt: new Date(),
          },
        });
        skipped++;
      } else {
        // Create new video
        await prisma.video.create({
          data: {
            youtubeVideoId: videoId,
            userId: session.user.id,
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
    }

    revalidatePath("/artist/profile");

    return {
      success: true,
      message: `Sync complete! ${synced} new videos added, ${skipped} updated.`,
      synced,
      skipped,
      total: videoItems.length,
    };
  } catch (error) {
    console.error("Error syncing YouTube videos:", error);
    return { success: false, message: "Failed to sync videos" };
  }
}

export async function getSyncedVideos(type: "all" | "shorts" | "videos") {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized", data: null };
    }

    const isShort =
      type === "shorts" ? true : type === "videos" ? false : undefined;

    const videos = await prisma.video.findMany({
      where: {
        userId: session.user.id,
        isShort,
      },
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
export async function getYouTubeSyncStatus() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, connected: false, videoCount: 0, shortCount: 0 };
    }

    const artist = await prisma.artist.findUnique({
      where: { userId: session.user.id },
      select: {
        youtubeChannelId: true,
        youtubeAccessToken: true,
        youtubeChannelName: true,
      },
    });

    const isConnected = !!(
      artist?.youtubeChannelId && artist?.youtubeAccessToken
    );

    // Get video counts
    const [videoCount, shortCount] = await Promise.all([
      prisma.video.count({
        where: { userId: session.user.id, isShort: false },
      }),
      prisma.video.count({
        where: { userId: session.user.id, isShort: true },
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
