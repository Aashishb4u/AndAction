"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { getValidInstagramToken } from "@/app/actions/instagram/instagram";

interface SyncResult {
  success: boolean;
  message: string;
  synced?: number;
  skipped?: number;
  total?: number;
}

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

const INSTAGRAM_MAX_REELS = 25;

function removeEmojis(text: string) {
  return text.replace(/[\p{Extended_Pictographic}]/gu, "");
}

export async function syncInstagramReels(
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
          select: { id: true, instagramId: true, instagramAccessToken: true },
        })
      : await prisma.artist.findFirst({
          where: { userId: session.user.id },
          orderBy: { profileOrder: "asc" },
          select: { id: true, instagramId: true, instagramAccessToken: true },
        });

    if (!artist) {
      return { success: false, message: "Artist profile not found" };
    }

    if (!artist.instagramId || !artist.instagramAccessToken) {
      return { success: false, message: "Instagram not connected" };
    }

    // Get valid access token
    const accessToken = await getValidInstagramToken(artist.id);

    if (!accessToken) {
      return {
        success: false,
        message: "Failed to get valid Instagram token. Please reconnect.",
      };
    }

    // Fetch user's media
    const mediaResponse = await fetch(
      `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&access_token=${accessToken}`
    );

    if (!mediaResponse.ok) {
      const errorData = await mediaResponse.text();
      console.error("Failed to fetch Instagram media:", errorData);
      return { success: false, message: "Failed to fetch Instagram media" };
    }

    const mediaData: InstagramMediaResponse = await mediaResponse.json();

    if (!mediaData.data || mediaData.data.length === 0) {
      return { success: true, message: "No reels found", synced: 0, total: 0 };
    }

    // Filter VIDEO and REEL types - all Instagram videos are treated as reels/shorts
    const reels = mediaData.data
      .filter((item) => item.media_type === "VIDEO" || item.media_type === "REEL")
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

    if (reels.length === 0) {
      return {
        success: true,
        message: "No reels found",
        synced: 0,
        total: 0,
      };
    }

    // // Get existing reel URLs to avoid duplicates
    // const existingReels = await prisma.video.findMany({
    //   where: { artistId: artist.id, source: "instagram", isShort: true },
    //   select: { instagramReelId: true },
    // });

    // const existingUrls = new Set(existingReels.map((v) => v.instagramReelId));

    // // Prepare reels for database
    // const reelsToSync = reels.map((item) => ({
    //   instagramReelId: item.id,
    //   title: item.caption?.slice(0, 100) || "Instagram Reel",
    //   description: item.caption || "",
    //   thumbnail: item.thumbnail_url || item.media_url || "",
    //   videoUrl: item.media_url || "",
    //   publishedAt: item.timestamp,
    // }));

    // console.log(
    //   `Total reels fetched: ${reels.length}, Reels to sync: ${reelsToSync.length}`
    // );
    // console.log(`Existing URLs: ${JSON.stringify(Array.from(existingUrls))}`);

    // // Filter out already synced reels
    // const newReels = reelsToSync.filter(
    //   (reel) => !existingUrls.has(reel.instagramReelId)
    // );

    // if (newReels.length === 0) {
    //   return {
    //     success: true,
    //     message: "All reels already synced",
    //     synced: 0,
    //     skipped: reels.length,
    //     total: reels.length,
    //   };
    // }

    // // Insert new reels
    // await prisma.video.createMany({
    //   data: newReels.map((reel) => ({
    //     userId: session.user.id,
    //     artistId: artist.id,
    //     title: removeEmojis(reel.description), // removeEmojis(reel.title),
    //     description: removeEmojis(reel.description),
    //     url: reel.videoUrl,
    //     thumbnailUrl: reel.thumbnail,
    //     duration: 0,
    //     durationFormatted: "0:00",
    //     views: 0,
    //     publishedAt: new Date(reel.publishedAt),
    //     isShort: true,
    //     source: "instagram",
    //     isApproved: true,
    //     instagramReelId: reel.instagramReelId,
    //   })),
    //   skipDuplicates: true,
    // });

    // const extraReelIds = await prisma.video.findMany({
    //   where: { artistId: artist.id, source: "instagram", isShort: true },
    //   orderBy: { publishedAt: "desc" },
    //   skip: INSTAGRAM_MAX_REELS,
    //   select: { id: true },
    // });

    // if (extraReelIds.length > 0) {
    //   await prisma.video.deleteMany({
    //     where: { id: { in: extraReelIds.map((reel) => reel.id) } },
    //   });
    // }


    const reelsToCreate = reels
  .slice(0, INSTAGRAM_MAX_REELS)
  .map((item) => ({
    userId: session.user.id,
    artistId: artist.id,
    title: removeEmojis(item.description || item.caption || ""),
    description: removeEmojis(item.caption || ""),
    url: item.media_url || "",
    thumbnailUrl: item.thumbnail_url || item.media_url || "",
    duration: 0,
    durationFormatted: "0:00",
    views: 0,
    publishedAt: new Date(item.timestamp),
    isShort: true,
    source: "instagram",
    isApproved: true,
    instagramReelId: item.id,
  }));

await prisma.$transaction([
  prisma.video.deleteMany({
    where: {
      artistId: artist.id,
      source: "instagram",
    },
  }),
  prisma.video.createMany({
    data: reelsToCreate,
  }),
]);
    revalidatePath("/artist/profile");

    return {
      success: true,
      // message: `Successfully synced ${newReels.length} reel(s)`,
      // synced: newReels.length,
      // skipped: reels.length - newReels.length,
      // total: reels.length,
      message: `Successfully synced ${reelsToCreate.length} reel(s)`,
      synced: reelsToCreate.length,
      total: reelsToCreate.length,
    };
  } catch (error) {
    console.error("Error syncing Instagram reels:", error);
    return { success: false, message: "Failed to sync Instagram reels" };
  }
}
