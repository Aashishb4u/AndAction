"use server";

import { prisma } from "@/lib/prisma";
import { isTokenExpired } from "@/lib/utils";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  refresh_token?: string;
}

export async function refreshYouTubeToken(
  artistId: string
): Promise<string | null> {
  try {
    const artist = await prisma.artist.findUnique({
      where: { id: artistId },
      select: {
        youtubeRefreshToken: true,
        youtubeAccessToken: true,
        youtubeTokenExpiry: true,
      },
    });

    if (!artist?.youtubeRefreshToken) {
      console.error("No refresh token available for artist:", artistId);
      return null;
    }

    // Check if token is still valid
    if (!isTokenExpired(artist.youtubeTokenExpiry)) {
      return artist.youtubeAccessToken;
    }

    // Refresh the token
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        refresh_token: artist.youtubeRefreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to refresh YouTube token:", errorText);
      return null;
    }

    const tokens: TokenResponse = await response.json();
    const newExpiry = new Date(Date.now() + tokens.expires_in * 1000);

    // Update the artist's tokens in the database
    await prisma.artist.update({
      where: { id: artistId },
      data: {
        youtubeAccessToken: tokens.access_token,
        youtubeTokenExpiry: newExpiry,
        // Only update refresh token if a new one was provided
        ...(tokens.refresh_token && {
          youtubeRefreshToken: tokens.refresh_token,
        }),
      },
    });

    return tokens.access_token;
  } catch (error) {
    console.error("Error refreshing YouTube token:", error);
    return null;
  }
}

export async function getValidYouTubeToken(
  artistId: string
): Promise<string | null> {
  const artist = await prisma.artist.findUnique({
    where: { id: artistId },
    select: {
      youtubeAccessToken: true,
      youtubeTokenExpiry: true,
      youtubeRefreshToken: true,
    },
  });

  if (!artist?.youtubeAccessToken) {
    return null;
  }

  // If token is not expired, return it
  if (!isTokenExpired(artist.youtubeTokenExpiry)) {
    return artist.youtubeAccessToken;
  }

  // Token is expired, try to refresh
  if (artist.youtubeRefreshToken) {
    return await refreshYouTubeToken(artistId);
  }

  return null;
}
