import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  fetchInstagramAccountByUsername,
  isInstagramDiscoveryConfigured,
  InstagramDiscoveryMedia,
} from "@/lib/instagram-discovery";

/**
 * Remove emojis and sanitize text for safe database storage.
 * Strips control characters / null bytes (which Postgres text rejects) and
 * escapes backslashes. Mirrors the sanitizer used by the refresh cron.
 */
function sanitizeText(text: string) {
  if (!text) return "";

  return text
    .replace(/[\p{Extended_Pictographic}]/gu, "") // Remove emojis
    .replace(/\p{Cc}/gu, "") // Remove control chars / null bytes
    .replace(/\p{Cs}/gu, "") // Remove lone/unpaired surrogates
    .trim();
}

/**
 * Connect an Instagram account by username (via Business Discovery, no OAuth).
 * Saves the account to the artist profile and syncs recent media as reels/shorts.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    if (!(await isInstagramDiscoveryConfigured())) {
      return NextResponse.json(
        { success: false, message: "Instagram integration is not configured" },
        { status: 500 },
      );
    }

    const body = await request.json();
    const { username, artistProfileId } = body;

    if (!username || !username.trim()) {
      return NextResponse.json(
        { success: false, message: "Instagram username is required" },
        { status: 400 },
      );
    }

    const artist = artistProfileId
      ? await prisma.artist.findFirst({
          where: { id: artistProfileId, userId: session.user.id },
        })
      : await prisma.artist.findFirst({
          where: { userId: session.user.id },
          orderBy: { profileOrder: "asc" },
        });

    if (!artist) {
      return NextResponse.json(
        { success: false, message: "Artist profile not found" },
        { status: 404 },
      );
    }

    let account;
    try {
      account = await fetchInstagramAccountByUsername(username);
    } catch (err: any) {
      return NextResponse.json(
        {
          success: false,
          message: err?.message || "Failed to fetch Instagram account",
        },
        { status: 502 },
      );
    }

    if (!account) {
      return NextResponse.json(
        {
          success: false,
          message: `Account "@${username
            .trim()
            .replace(/^@/, "")}" not found. Make sure it's a public Instagram Business or Creator account.`,
        },
        { status: 404 },
      );
    }

    // Sync media into the videos table FIRST, so the account is only marked
    // "connected" once its content is actually saved (avoids a half-connected
    // state where the profile shows Connected but no shorts appear).
    // Instagram reels -> Shorts tab (isShort: true), feed posts -> Videos tab.
    const media = account.media?.data || [];
    const supported = media.filter((item: InstagramDiscoveryMedia) =>
      ["VIDEO", "REEL", "IMAGE", "CAROUSEL_ALBUM"].includes(item.media_type),
    );

    let synced = 0;
    if (supported.length > 0) {
      // Start fresh with the latest media for this account
      await prisma.video.deleteMany({
        where: { artistId: artist.id, source: "instagram" },
      });

      const result = await prisma.video.createMany({
        data: supported.map((item: InstagramDiscoveryMedia) => ({
          userId: session.user.id,
          artistId: artist.id,
          title: sanitizeText(item.caption?.slice(0, 100) || "Instagram Post"),
          description: sanitizeText(item.caption || ""),
          url: sanitizeText(item.media_url || ""),
          thumbnailUrl: sanitizeText(item.thumbnail_url || item.media_url || ""),
          duration: 0,
          durationFormatted: "0:00",
          views: 0,
          publishedAt: new Date(item.timestamp),
          isShort: true,
          source: "instagram",
          isApproved: true,
          instagramReelId: item.id,
        })),
        skipDuplicates: true,
      });
      synced = result.count;
    }

    // Save the Instagram account to the artist profile (only after a successful sync)
    await prisma.artist.update({
      where: { id: artist.id },
      data: {
        instagramId: account.id,
        instagramUsername: account.username,
        instagramConnectedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Instagram account connected successfully",
      data: {
        instagramId: account.id,
        username: account.username,
        synced,
      },
    });
  } catch (error) {
    console.error("Error connecting Instagram account:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? `Failed to connect Instagram account: ${error.message}`
            : "Failed to connect Instagram account",
      },
      { status: 500 },
    );
  }
}
