import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

/**
 * Connect YouTube channel by channel name or ID (without OAuth)
 * Artists just need to provide their channel name/ID to fetch public videos
 */
export async function POST(request: NextRequest) {
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

    if (!YOUTUBE_API_KEY) {
      return NextResponse.json(
        { success: false, message: "YouTube API key is not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { channelInput } = body;

    if (!channelInput || !channelInput.trim()) {
      return NextResponse.json(
        { success: false, message: "Channel name or ID is required" },
        { status: 400 }
      );
    }

    // Clean the input: remove @ symbol if present
    let cleanedInput = channelInput.trim().replace(/^@/, "");
    const originalInputWithAt = `@${cleanedInput}`.toLowerCase();

    // Try to find channel by ID first (Channel IDs start with UC)
    let channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails&id=${encodeURIComponent(
        cleanedInput
      )}&key=${YOUTUBE_API_KEY}`
    );

    let channelData = await channelResponse.json();
    let foundChannel = null;

    // If not found by ID, try forUsername (for legacy usernames)
    if (!channelData.items || channelData.items.length === 0) {
      channelResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails&forUsername=${encodeURIComponent(
          cleanedInput
        )}&key=${YOUTUBE_API_KEY}`
      );

      channelData = await channelResponse.json();
    }

    // If still not found, use search
    if (!channelData.items || channelData.items.length === 0) {
      const searchResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(
          cleanedInput
        )}&maxResults=10&key=${YOUTUBE_API_KEY}`
      );

      const searchData = await searchResponse.json();

      if (searchData.items && searchData.items.length > 0) {
        // Get all channel IDs from search results
        const channelIds = searchData.items
          .map((item: any) => item.snippet.channelId)
          .join(",");

        // Fetch full details for all channels to get customUrl
        const detailsResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails&id=${channelIds}&key=${YOUTUBE_API_KEY}`
        );

        const detailsData = await detailsResponse.json();

        if (detailsData.items && detailsData.items.length > 0) {
          // Try to find exact match by customUrl first
          foundChannel = detailsData.items.find((channel: any) => {
            const customUrl = channel.snippet.customUrl?.toLowerCase();
            const title = channel.snippet.title?.toLowerCase();
            const inputLower = cleanedInput.toLowerCase();
            
            return (
              customUrl === originalInputWithAt ||
              customUrl === `@${inputLower}` ||
              customUrl === inputLower ||
              title === inputLower
            );
          });

          // If no exact match, use the first result (most relevant)
          if (!foundChannel) {
            foundChannel = detailsData.items[0];
          }

          channelData = { items: [foundChannel] };
        }
      }
    }

    if (!channelData.items || channelData.items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Channel "${channelInput}" not found. Please try:\n\n1. Using the exact handle (e.g., @username or username)\n2. Using the Channel ID (starts with UC) for 100% accuracy\n3. Using the exact channel name as shown on YouTube`,
        },
        { status: 404 }
      );
    }

    const channel = channelData.items[0];

    // Update the artist profile with YouTube channel data (without OAuth tokens)
    await prisma.artist.update({
      where: { id: artist.id },
      data: {
        youtubeChannelId: channel.id,
        youtubeChannelName: channel.snippet.title,
        youtubeConnectedAt: new Date(),
        // Clear any old OAuth tokens if they exist
        youtubeAccessToken: null,
        youtubeRefreshToken: null,
        youtubeTokenExpiry: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "YouTube channel connected successfully",
      data: {
        channelId: channel.id,
        channelName: channel.snippet.title,
      },
    });
  } catch (error) {
    console.error("Error connecting YouTube channel:", error);
    return NextResponse.json(
      { success: false, message: "Failed to connect YouTube channel" },
      { status: 500 }
    );
  }
}
