"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

/**
 * Get a valid Instagram access token, refreshing if needed
 */
export async function getValidInstagramToken(
  artistId: string
): Promise<string | null> {
  const artist = await prisma.artist.findUnique({
    where: { id: artistId },
    select: {
      instagramAccessToken: true,
      instagramTokenExpiry: true,
    },
  });

  if (!artist?.instagramAccessToken) {
    return null;
  }

  // Check if token is expired or will expire in the next 5 minutes
  const now = new Date();
  const expiryBuffer = 5 * 60 * 1000; // 5 minutes

  if (
    artist.instagramTokenExpiry &&
    artist.instagramTokenExpiry.getTime() - expiryBuffer > now.getTime()
  ) {
    // Token is still valid
    return artist.instagramAccessToken;
  }

  // Token is expired or about to expire, try to refresh it
  try {
    const refreshResponse = await fetch(
      `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${artist.instagramAccessToken}`,
      { method: "GET" }
    );

    if (!refreshResponse.ok) {
      console.error("Failed to refresh Instagram token");
      return null;
    }

    const refreshData = await refreshResponse.json();

    // Update the token in the database
    const newExpiry = new Date(Date.now() + refreshData.expires_in * 1000);

    await prisma.artist.update({
      where: { id: artistId },
      data: {
        instagramAccessToken: refreshData.access_token,
        instagramTokenExpiry: newExpiry,
      },
    });

    return refreshData.access_token;
  } catch (error) {
    console.error("Error refreshing Instagram token:", error);
    return null;
  }
}
