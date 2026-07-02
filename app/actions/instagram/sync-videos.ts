"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { fetchInstagramAccountByUsername } from "@/lib/instagram-discovery";

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

function removeEmojis(text: string) {
  if (!text) return "";

  return text
    .replace(/[\p{Extended_Pictographic}]/gu, "") // Remove emojis
    .replace(/\p{Cc}/gu, "") // Remove control chars / null bytes
    .replace(/\p{Cs}/gu, "") // Remove lone/unpaired surrogates
    .trim();
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
          select: {
            id: true,
            instagramId: true,
            instagramUsername: true,
          },
        })
      : await prisma.artist.findFirst({
          where: { userId: session.user.id },
          orderBy: { profileOrder: "asc" },
          select: {
            id: true,
            instagramId: true,
            instagramUsername: true,
          },
        });

    if (!artist) {
      return { success: false, message: "Artist profile not found" };
    }

    if (!artist.instagramId) {
      return { success: false, message: "Instagram not connected" };
    }

    let mediaData: InstagramMediaResponse;

    if (artist.instagramUsername) {
      const account = await fetchInstagramAccountByUsername(
        artist.instagramUsername,
      );
      mediaData = { data: account?.media?.data || [] };
    } else {
      return { success: false, message: "Instagram not connected" };
    }

    if (!mediaData.data || mediaData.data.length === 0) {
      return { success: true, message: "No reels found", synced: 0, total: 0 };
    }

    // Filter VIDEO and REEL types - all Instagram videos are treated as reels/shorts
    const reels = mediaData.data.filter(
      (item) => item.media_type === "VIDEO" || item.media_type === "REEL"
    );

    if (reels.length === 0) {
      return {
        success: true,
        message: "No reels found",
        synced: 0,
        total: 0,
      };
    }

    // Get existing reel URLs to avoid duplicates
    const existingReels = await prisma.video.findMany({
      where: { artistId: artist.id, source: "instagram", isShort: true },
      select: { instagramReelId: true },
    });

    const existingUrls = new Set(existingReels.map((v) => v.instagramReelId));

    // Prepare reels for database
    const reelsToSync = reels.map((item) => ({
      instagramReelId: item.id,
      title: item.caption?.slice(0, 100) || "Instagram Reel",
      description: item.caption || "",
      thumbnail: item.thumbnail_url || item.media_url || "",
      videoUrl: item.media_url || "",
      publishedAt: item.timestamp,
    }));

    console.log(
      `Total reels fetched: ${reels.length}, Reels to sync: ${reelsToSync.length}`
    );
    console.log(`Existing URLs: ${JSON.stringify(Array.from(existingUrls))}`);

    // Filter out already synced reels
    const newReels = reelsToSync.filter(
      (reel) => !existingUrls.has(reel.instagramReelId)
    );

    if (newReels.length === 0) {
      return {
        success: true,
        message: "All reels already synced",
        synced: 0,
        skipped: reels.length,
        total: reels.length,
      };
    }

    // Insert new reels
    await prisma.video.createMany({
      data: newReels.map((reel) => ({
        userId: session.user.id,
        artistId: artist.id,
        title: removeEmojis(reel.description), // removeEmojis(reel.title),
        description: removeEmojis(reel.description),
        url: removeEmojis(reel.videoUrl),
        thumbnailUrl: removeEmojis(reel.thumbnail),
        duration: 0,
        durationFormatted: "0:00",
        views: 0,
        publishedAt: new Date(reel.publishedAt),
        isShort: true,
        source: "instagram",
        isApproved: true,
        instagramReelId: reel.instagramReelId,
      })),
      skipDuplicates: true,
    });

    revalidatePath("/artist/profile");

    return {
      success: true,
      message: `Successfully synced ${newReels.length} reel(s)`,
      synced: newReels.length,
      skipped: reels.length - newReels.length,
      total: reels.length,
    };
  } catch (error) {
    console.error("Error syncing Instagram reels:", error);
    return { success: false, message: "Failed to sync Instagram reels" };
  }
}
