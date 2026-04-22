import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const INSTAGRAM_CLIENT_ID = process.env.INSTAGRAM_CLIENT_ID;
const INSTAGRAM_CLIENT_SECRET = process.env.INSTAGRAM_CLIENT_SECRET;
const INSTAGRAM_REDIRECT_URI =
  process.env.INSTAGRAM_REDIRECT_URI ||
  `${process.env.NEXTAUTH_URL}/api/artists/integrations/instagram/callback`;
const NEXTAUTH_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

const INSTAGRAM_VERIFICATION_TOKEN = process.env.INSTAGRAM_VERIFICATION_TOKEN;

interface ShortLivedTokenResponse {
  access_token: string;
  user_id: number;
}
interface LongLivedTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number; // seconds (60 days)
}

interface InstagramUserResponse {
  id: string;
  username: string;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Handle Instagram Webhook Verification
    const hubMode = searchParams.get("hub.mode");
    const hubChallenge = searchParams.get("hub.challenge");
    const hubVerifyToken = searchParams.get("hub.verify_token");

    if (hubMode === "subscribe" && hubChallenge && hubVerifyToken) {
      // Verify the token matches
      if (hubVerifyToken === INSTAGRAM_VERIFICATION_TOKEN) {
        console.log("Instagram webhook verification successful");
        // Return the challenge as plain text
        return new NextResponse(hubChallenge, {
          status: 200,
          headers: { "Content-Type": "text/plain" },
        });
      } else {
        console.error("Instagram webhook verification failed: token mismatch");
        return new NextResponse("Forbidden", { status: 403 });
      }
    }

    // Handle OAuth callback
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const errorReason = searchParams.get("error_reason");

    // Handle errors from Instagram
    if (error) {
      console.error("Instagram OAuth error:", error, errorReason);
      return NextResponse.redirect(
        new URL(
          "/artist/profile?tab=integrations&error=instagram_denied",
          NEXTAUTH_URL
        )
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL(
          "/artist/profile?tab=integrations&error=missing_params",
          NEXTAUTH_URL
        )
      );
    }

    // Verify the state parameter
    let stateData: {
      artistId: string;
      userId: string;
      timestamp: number;
      returnUrl?: string;
    };
    try {
      stateData = JSON.parse(Buffer.from(state, "base64").toString());
    } catch {
      return NextResponse.redirect(
        new URL(
          "/artist/profile?tab=integrations&error=invalid_state",
          NEXTAUTH_URL
        )
      );
    }

    // Use returnUrl from state or default to integrations tab
    const baseReturnUrl =
      stateData.returnUrl || "/artist/profile?tab=integrations";

    // Check if state is not too old (15 minutes max)
    if (Date.now() - stateData.timestamp > 15 * 60 * 1000) {
      const errorUrl = new URL(baseReturnUrl, NEXTAUTH_URL);
      errorUrl.searchParams.set("error", "expired");
      return NextResponse.redirect(errorUrl);
    }

    // Verify artist exists (state contains artistId which was set during auth-url generation)
    const artist = await prisma.artist.findUnique({
      where: { id: stateData.artistId },
    });

    if (!artist) {
      const errorUrl = new URL(baseReturnUrl, NEXTAUTH_URL);
      errorUrl.searchParams.set("error", "artist_not_found");
      return NextResponse.redirect(errorUrl);
    }

    // Step 1: Exchange code for short-lived access token
    const tokenFormData = new URLSearchParams();
    tokenFormData.append("client_id", INSTAGRAM_CLIENT_ID!);
    tokenFormData.append("client_secret", INSTAGRAM_CLIENT_SECRET!);
    tokenFormData.append("grant_type", "authorization_code");
    tokenFormData.append("redirect_uri", INSTAGRAM_REDIRECT_URI);
    tokenFormData.append("code", code);

    const shortTokenResponse = await fetch(
      "https://api.instagram.com/oauth/access_token",
      {
        method: "POST",
        body: tokenFormData,
      }
    );

    if (!shortTokenResponse.ok) {
      const errorData = await shortTokenResponse.text();
      console.error("Instagram token exchange failed:", errorData);
      const errorUrl = new URL(baseReturnUrl, NEXTAUTH_URL);
      errorUrl.searchParams.set("error", "token_exchange_failed");
      return NextResponse.redirect(errorUrl);
    }

    const shortTokenData: ShortLivedTokenResponse =
      await shortTokenResponse.json();

    // Step 2: Exchange short-lived token for long-lived token (60 days)
    const longTokenResponse = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${INSTAGRAM_CLIENT_SECRET}&access_token=${shortTokenData.access_token}`,
      { method: "GET" }
    );

    if (!longTokenResponse.ok) {
      const errorData = await longTokenResponse.text();
      console.error("Instagram long-lived token exchange failed:", errorData);
      const errorUrl = new URL(baseReturnUrl, NEXTAUTH_URL);
      errorUrl.searchParams.set("error", "long_token_failed");
      return NextResponse.redirect(errorUrl);
    }

    const longTokenData: LongLivedTokenResponse =
      await longTokenResponse.json();

    // Step 3: Get user profile info
    const userResponse = await fetch(
      `https://graph.instagram.com/me?fields=id,username&access_token=${longTokenData.access_token}`
    );

    if (!userResponse.ok) {
      console.error("Failed to fetch Instagram user info");
      const errorUrl = new URL(baseReturnUrl, NEXTAUTH_URL);
      errorUrl.searchParams.set("error", "user_fetch_failed");
      return NextResponse.redirect(errorUrl);
    }

    const userData: InstagramUserResponse = await userResponse.json();

    // Calculate token expiry (60 days from now)
    const tokenExpiry = new Date(Date.now() + longTokenData.expires_in * 1000);

    // Update the artist profile with Instagram integration data
    await prisma.artist.update({
      where: { id: stateData.artistId },
      data: {
        instagramAccessToken: longTokenData.access_token,
        instagramTokenExpiry: tokenExpiry,
        instagramId: userData.id,
        instagramUsername: userData.username,
        instagramConnectedAt: new Date(),
      },
    });

    const successUrl = new URL(baseReturnUrl, NEXTAUTH_URL);
    successUrl.searchParams.set("success", "instagram_connected");

    return NextResponse.redirect(successUrl);
  } catch (error) {
    console.error("Instagram callback error:", error);
    return NextResponse.redirect(
      new URL(
        "/artist/profile?tab=integrations&error=callback_failed",
        NEXTAUTH_URL
      )
    );
  }
}
