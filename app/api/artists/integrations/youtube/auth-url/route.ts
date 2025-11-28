import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const YOUTUBE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const YOUTUBE_REDIRECT_URI =
  process.env.YOUTUBE_REDIRECT_URI ||
  `${process.env.NEXTAUTH_URL}/api/artists/integrations/youtube/callback`;

const SCOPES = [
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/youtube.force-ssl",
].join(" ");

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is an artist
    const artist = await prisma.artist.findUnique({
      where: { userId: session.user.id },
    });

    if (!artist) {
      return NextResponse.json(
        { success: false, message: "Artist profile not found" },
        { status: 404 }
      );
    }

    if (!YOUTUBE_CLIENT_ID) {
      return NextResponse.json(
        { success: false, message: "YouTube integration is not configured" },
        { status: 500 }
      );
    }

    // Generate a state parameter for security (includes artist ID for verification)
    const state = Buffer.from(
      JSON.stringify({
        artistId: artist.id,
        userId: session.user.id,
        timestamp: Date.now(),
      })
    ).toString("base64");

    // Build the YouTube OAuth URL
    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", YOUTUBE_CLIENT_ID);
    authUrl.searchParams.set("redirect_uri", YOUTUBE_REDIRECT_URI);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", SCOPES);
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent"); // Force consent to get refresh token
    authUrl.searchParams.set("state", state);

    return NextResponse.json({
      success: true,
      authUrl: authUrl.toString(),
    });
  } catch (error) {
    console.error("Error generating YouTube auth URL:", error);
    return NextResponse.json(
      { success: false, message: "Failed to generate authorization URL" },
      { status: 500 }
    );
  }
}
