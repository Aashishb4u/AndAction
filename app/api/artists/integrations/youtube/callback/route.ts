import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { syncYouTubeVideos } from "@/app/actions/youtube/sync-videos";

const YOUTUBE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const YOUTUBE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const YOUTUBE_REDIRECT_URI =
  process.env.YOUTUBE_REDIRECT_URI ||
  `${process.env.NEXTAUTH_URL}/api/artists/integrations/youtube/callback`;

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

interface YouTubeChannelResponse {
  items?: Array<{
    id: string;
    snippet: {
      title: string;
      description: string;
      customUrl?: string;
      thumbnails: {
        default: { url: string };
      };
    };
  }>;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Handle errors from YouTube
    if (error) {
      console.error("YouTube OAuth error:", error);
      return NextResponse.redirect(
        new URL(
          "/artist/profile?tab=integrations&error=youtube_denied",
          request.url
        )
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL(
          "/artist/profile?tab=integrations&error=missing_params",
          request.url
        )
      );
    }

    // Verify the state parameter
    let stateData: { artistId: string; userId: string; timestamp: number };
    try {
      stateData = JSON.parse(Buffer.from(state, "base64").toString());
    } catch {
      return NextResponse.redirect(
        new URL(
          "/artist/profile?tab=integrations&error=invalid_state",
          request.url
        )
      );
    }

    // Check if state is not too old (15 minutes max)
    if (Date.now() - stateData.timestamp > 15 * 60 * 1000) {
      return NextResponse.redirect(
        new URL("/artist/profile?tab=integrations&error=expired", request.url)
      );
    }

    const session = await auth();
    if (!session?.user?.id || session.user.id !== stateData.userId) {
      return NextResponse.redirect(
        new URL(
          "/artist/profile?tab=integrations&error=session_mismatch",
          request.url
        )
      );
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: YOUTUBE_CLIENT_ID!,
        client_secret: YOUTUBE_CLIENT_SECRET!,
        redirect_uri: YOUTUBE_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("Token exchange failed:", errorData);
      return NextResponse.redirect(
        new URL(
          "/artist/profile?tab=integrations&error=token_exchange_failed",
          request.url
        )
      );
    }

    const tokens: TokenResponse = await tokenResponse.json();

    // Get the user's YouTube channel info
    const channelResponse = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      }
    );

    if (!channelResponse.ok) {
      console.error("Failed to fetch channel info");
      return NextResponse.redirect(
        new URL(
          "/artist/profile?tab=integrations&error=channel_fetch_failed",
          request.url
        )
      );
    }

    const channelData: YouTubeChannelResponse = await channelResponse.json();
    const channel = channelData.items?.[0];

    if (!channel) {
      return NextResponse.redirect(
        new URL(
          "/artist/profile?tab=integrations&error=no_channel",
          request.url
        )
      );
    }

    // Calculate token expiry
    const tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000);

    // Update the artist profile with YouTube integration data
    await prisma.artist.update({
      where: { id: stateData.artistId },
      data: {
        youtubeAccessToken: tokens.access_token,
        youtubeRefreshToken: tokens.refresh_token || null,
        youtubeTokenExpiry: tokenExpiry,
        youtubeChannelId: channel.id,
        youtubeChannelName: channel.snippet.title,
        youtubeConnectedAt: new Date(),
      },
    });

    // Redirect back to integrations tab with success
    return NextResponse.redirect(
      new URL(
        "/artist/profile?tab=integrations&success=youtube_connected",
        request.url
      )
    );
  } catch (error) {
    console.error("YouTube callback error:", error);
    return NextResponse.redirect(
      new URL(
        "/artist/profile?tab=integrations&error=callback_failed",
        request.url
      )
    );
  }
}
