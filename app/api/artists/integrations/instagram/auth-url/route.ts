import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const INSTAGRAM_CLIENT_ID = process.env.INSTAGRAM_CLIENT_ID;
const INSTAGRAM_REDIRECT_URI =
  process.env.INSTAGRAM_REDIRECT_URI ||
  `${process.env.NEXTAUTH_URL}/api/artists/integrations/instagram/callback`;

// Instagram Business API scopes
const SCOPES = [
  "instagram_business_basic",
  "instagram_business_manage_messages",
  "instagram_business_manage_comments",
  "instagram_business_content_publish",
  "instagram_business_manage_insights",
].join(",");

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const artist = await prisma.artist.findUnique({
      where: { userId: session.user.id },
    });

    if (!artist) {
      return NextResponse.json(
        { success: false, message: "Artist profile not found" },
        { status: 404 }
      );
    }

    if (!INSTAGRAM_CLIENT_ID) {
      return NextResponse.json(
        { success: false, message: "Instagram integration is not configured" },
        { status: 500 }
      );
    }

    const returnUrl =
      request.nextUrl.searchParams.get("returnUrl") ||
      "/artist/profile?tab=integrations";

    const state = Buffer.from(
      JSON.stringify({
        artistId: artist.id,
        userId: session.user.id,
        timestamp: Date.now(),
        returnUrl,
      })
    ).toString("base64");

    // Instagram Business API OAuth URL
    const authUrl = new URL("https://www.instagram.com/oauth/authorize");
    authUrl.searchParams.set("client_id", INSTAGRAM_CLIENT_ID);
    authUrl.searchParams.set("redirect_uri", INSTAGRAM_REDIRECT_URI);
    authUrl.searchParams.set("scope", SCOPES);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("state", state);

    console.log("Generated Instagram auth URL:", authUrl.toString());
    return NextResponse.json({
      success: true,
      authUrl: authUrl.toString(),
    });
  } catch (error) {
    console.error("Error generating Instagram auth URL:", error);
    return NextResponse.json(
      { success: false, message: "Failed to generate authorization URL" },
      { status: 500 }
    );
  }
}
