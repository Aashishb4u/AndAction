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

export async function syncInstagramReels(): Promise<SyncResult> {
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
        instagramId: true,
        instagramAccessToken: true,
      },
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
      where: {
        userId: session.user.id,
        source: "instagram",
        isShort: true,
      },
      select: { url: true },
    });

    const existingUrls = new Set(existingReels.map((v) => v.url));

    // Prepare reels for database
    const reelsToSync = reels.map((item) => ({
      id: item.id,
      title: item.caption?.slice(0, 100) || "Instagram Reel",
      description: item.caption || "",
      thumbnail: item.thumbnail_url || item.media_url || "",
      videoUrl: item.permalink,
      publishedAt: item.timestamp,
    }));

    // Filter out already synced reels
    const newReels = reelsToSync.filter(
      (reel) => !existingUrls.has(reel.videoUrl)
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
        title: reel.title,
        description: reel.description,
        url: reel.videoUrl,
        thumbnailUrl: reel.thumbnail,
        duration: 0,
        durationFormatted: "0:00",
        views: 0,
        publishedAt: new Date(reel.publishedAt),
        isShort: true,
        source: "instagram",
        isApproved: false,
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
