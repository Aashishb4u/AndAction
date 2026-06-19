"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { getValidYouTubeToken } from "@/app/actions/youtube/youtube";
import { detectYouTubeShortIds } from "@/lib/youtube-content-classification";

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

interface YouTubeVideoDetail {
  id: string;
  contentDetails: {
    duration: string;
  };
  statistics: {
    viewCount: string;
  };
}

const YT_MAX_VIDEOS = 25;
const YT_MAX_SHORTS = 25;
// const IG_MAX_REELS = 25;
const YT_PLAYLIST_PAGE_SIZE = 50;
const YT_MAX_PLAYLIST_PAGES = 6;
// const YT_MAX_PLAYLIST_PAGES = 2;

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

    const videoItems = (playlistItems || []).sort(
      (a, b) =>
        new Date(b.snippet.publishedAt).getTime() -
        new Date(a.snippet.publishedAt).getTime()
    );

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

    const playlistItemMap = new Map(
      videoItems.map((item) => [item.snippet.resourceId.videoId, item])
    );

    const videoDetailsMap = new Map<string, YouTubeVideoDetail>();
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

    const shortIds = await detectYouTubeShortIds(
      uniqueVideoIds.map((videoId) => {
        const playlistItem = playlistItemMap.get(videoId);

        return {
          id: videoId,
          title: playlistItem?.snippet.title,
          description: playlistItem?.snippet.description,
        };
      })
    );

    // Process and sync videos
    // Process and sync videos
    let synced = 0;
    // let skipped = 0;
    let importedVideos = 0;
    let importedShorts = 0;

    const videosToCreate = [];

    for (const item of videoItems) {
      if (importedVideos >= YT_MAX_VIDEOS && importedShorts >= YT_MAX_SHORTS) break;
      const videoId = item.snippet.resourceId.videoId;
      const details = videoDetailsMap.get(videoId);
      const duration = details?.contentDetails?.duration || "PT0S";
      const durationSeconds = parseDurationToSeconds(duration);
      const isShort = shortIds.has(videoId);
      const videoUrl = isShort
        ? `https://www.youtube.com/shorts/${videoId}`
        : `https://www.youtube.com/watch?v=${videoId}`;
      if (isShort && importedShorts >= YT_MAX_SHORTS) continue;
      if (!isShort && importedVideos >= YT_MAX_VIDEOS) continue;

      // Check if video already exists
      // const existingVideo = await prisma.video.findUnique({
      //   where: {
      //     youtubeVideoId_userId: {
      //       youtubeVideoId: videoId,
      //       userId: userId,
      //     }
      //   },
      // });

      // if (existingVideo) {
      //   // Update existing video
      //   await prisma.video.update({
      //     where: {
      //       youtubeVideoId_userId: {
      //         youtubeVideoId: videoId,
      //         userId: userId
      //       }
      //     },
      //     data: {
      //       artistId,
      //       title: item.snippet.title,
      //       description: item.snippet.description,
      //       url: videoUrl,
      //       thumbnailUrl:
      //         item.snippet.thumbnails.high?.url ||
      //         item.snippet.thumbnails.medium?.url ||
      //         item.snippet.thumbnails.default?.url,
      //       duration: durationSeconds,
      //       durationFormatted: formatDuration(duration),
      //       views: parseInt(details?.statistics?.viewCount || "0"),
      //       publishedAt: new Date(item.snippet.publishedAt),
      //       isShort,
      //       isApproved: true,
      //       updatedAt: new Date(),
      //     },
      //   });
      //   skipped++;
      // } else {
      //   // Create new video
      //   await prisma.video.create({
      //     data: {
      //       youtubeVideoId: videoId,
      //       userId: userId,
      //       artistId,
      //       title: item.snippet.title,
      //       description: item.snippet.description,
      //       url: videoUrl,
      //       thumbnailUrl:
      //         item.snippet.thumbnails.high?.url ||
      //         item.snippet.thumbnails.medium?.url ||
      //         item.snippet.thumbnails.default?.url,
      //       duration: durationSeconds,
      //       durationFormatted: formatDuration(duration),
      //       views: parseInt(details?.statistics?.viewCount || "0"),
      //       publishedAt: new Date(item.snippet.publishedAt),
      //       isShort,
      //       source: "youtube",
      //       isApproved: true,
      //     },
      //   });
      //   synced++;
      // }


      videosToCreate.push({
      youtubeVideoId: videoId,
      userId,
      artistId,
      title: item.snippet.title,
      description: item.snippet.description,
      url: videoUrl,
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
    });

    synced++;

    if (isShort) importedShorts++;
      else importedVideos++;
    }

    // await prisma.video.createMany({
    //   data: videosToCreate,
    //   skipDuplicates: true,
    // }); 

    await prisma.$transaction([
  prisma.video.deleteMany({
    where: {
      artistId,
      source: "youtube",
    },
  }),
  prisma.video.createMany({
    data: videosToCreate,
  }),
]);

    // const extraVideoIds = await prisma.video.findMany({
    //   where: { artistId, source: "youtube", isShort: false },
    //   orderBy: { publishedAt: "desc" },
    //   skip: YT_MAX_VIDEOS,
    //   select: { id: true },
    // });
    // if (extraVideoIds.length > 0) {
    //   await prisma.video.deleteMany({
    //     where: { id: { in: extraVideoIds.map((v) => v.id) } },
    //   });
    // }

    // const extraShortIds = await prisma.video.findMany({
    //   where: { artistId, source: "youtube", isShort: true },
    //   orderBy: { publishedAt: "desc" },
    //   skip: YT_MAX_SHORTS,
    //   select: { id: true },
    // });
    // if (extraShortIds.length > 0) {
    //   await prisma.video.deleteMany({
    //     where: { id: { in: extraShortIds.map((v) => v.id) } },
    //   });
    // }

    revalidatePath("/artist/profile");

    return {
      success: true,
      message: `Sync complete! ${synced} items synced.`,      synced,
      // skipped,
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

    const videoSelect = {
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
    } as const;

    // if (type === "shorts") {
    //   const [youtubeShorts, instagramReels] = await Promise.all([
    //     prisma.video.findMany({
    //       where: {
    //         artistId: artist.id,
    //         isShort: true,
    //         source: "youtube",
    //       },
    //       take: YT_MAX_SHORTS,
    //       orderBy: { publishedAt: "desc" },
    //       select: videoSelect,
    //     }),
    //     prisma.video.findMany({
    //       where: {
    //         artistId: artist.id,
    //         isShort: true,
    //         source: "instagram",
    //       },
    //       take: IG_MAX_REELS,
    //       orderBy: { publishedAt: "desc" },
    //       select: videoSelect,
    //     }),
    //   ]);

    //   const shorts = [...youtubeShorts, ...instagramReels].sort(
    //     (a, b) =>
    //       new Date(b.publishedAt ?? 0).getTime() -
    //       new Date(a.publishedAt ?? 0).getTime()
    //   );

    //   return { success: true, data: shorts };
    // }

    if (type === "shorts") {
  const shorts = await prisma.video.findMany({
    where: {
      artistId: artist.id,
      isShort: true,
      source: "youtube",
    },
    take: YT_MAX_SHORTS,
    orderBy: { publishedAt: "desc" },
    select: videoSelect,
  });

  return { success: true, data: shorts };
}

    const isShort = type === "videos" ? false : undefined;

    const videos = await prisma.video.findMany({
      // where: {
      //   artistId: artist.id,
      //   isShort,
      // },
      where: {
        artistId: artist.id,
        isShort,
        source: "youtube",
      },
      take: type === "videos"
        ? YT_MAX_VIDEOS
        : YT_MAX_VIDEOS + YT_MAX_SHORTS,
      // take: type === "videos" ? YT_MAX_VIDEOS : YT_MAX_VIDEOS + YT_MAX_SHORTS + IG_MAX_REELS,
      orderBy: { publishedAt: "desc" },
      select: videoSelect,
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
