import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  fetchInstagramAccountByUsername,
  isInstagramDiscoveryConfigured,
} from "@/lib/instagram-discovery";

/**
 * Preview Instagram account details before connecting.
 * Looks up the account by username via Business Discovery without saving.
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
    const { username } = body;

    if (!username || !username.trim()) {
      return NextResponse.json(
        { success: false, message: "Instagram username is required" },
        { status: 400 },
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
            .replace(/^@/, "")}" not found. Make sure it's a public Instagram Business or Creator account and the username is spelled correctly.`,
        },
        { status: 404 },
      );
    }

    const formatCount = (count?: number) => {
      if (count === undefined || count === null) return undefined;
      if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
      if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
      return `${count}`;
    };

    return NextResponse.json({
      success: true,
      data: {
        instagramId: account.id,
        username: account.username,
        name: account.name,
        profilePictureUrl: account.profile_picture_url,
        biography: account.biography,
        website: account.website,
        followersCount: formatCount(account.followers_count),
        followsCount: formatCount(account.follows_count),
        mediaCount: account.media_count,
      },
    });
  } catch (error) {
    console.error("Error previewing Instagram account:", error);
    return NextResponse.json(
      { success: false, message: "Failed to preview Instagram account" },
      { status: 500 },
    );
  }
}
