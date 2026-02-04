import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

/**
 * Preview YouTube channel details before connecting
 * Fetches channel information without saving to database
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

    if (!YOUTUBE_API_KEY) {
      return NextResponse.json(
        { success: false, message: "YouTube API key is not configured" },
        { status: 500 },
      );
    }

    const body = await request.json();
    const { channelInput } = body;

    if (!channelInput || !channelInput.trim()) {
      return NextResponse.json(
        { success: false, message: "Channel name or ID is required" },
        { status: 400 },
      );
    }

    let cleanedInput = channelInput.trim().replace(/^@/, "");
    const originalInputWithAt = `@${cleanedInput}`.toLowerCase();

    let channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails,statistics&id=${encodeURIComponent(
        cleanedInput,
      )}&key=${YOUTUBE_API_KEY}`,
    );

    let channelData = await channelResponse.json();
    let foundChannel = null;

    if (!channelData.items || channelData.items.length === 0) {
      channelResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails,statistics&forUsername=${encodeURIComponent(
          cleanedInput,
        )}&key=${YOUTUBE_API_KEY}`,
      );

      channelData = await channelResponse.json();
    }

    if (!channelData.items || channelData.items.length === 0) {
      const searchResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(
          cleanedInput,
        )}&maxResults=10&key=${YOUTUBE_API_KEY}`,
      );

      const searchData = await searchResponse.json();

      if (searchData.items && searchData.items.length > 0) {
        const channelIds = searchData.items
          .map((item: any) => item.snippet.channelId)
          .join(",");

        const detailsResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails,statistics&id=${channelIds}&key=${YOUTUBE_API_KEY}`,
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
          message: `Channel "${channelInput}" not found. Please try:\n• Using the exact handle (e.g., @username)\n• Using the Channel ID (starts with UC)\n• Using the exact channel name`,
        },
        { status: 404 },
      );
    }

    const channel = channelData.items[0];

    // Format subscriber count
    const formatCount = (count: string) => {
      const num = parseInt(count);
      if (num >= 1000000) {
        return `${(num / 1000000).toFixed(1)}M`;
      } else if (num >= 1000) {
        return `${(num / 1000).toFixed(1)}K`;
      }
      return count;
    };

    // Return channel preview data
    return NextResponse.json({
      success: true,
      data: {
        channelId: channel.id,
        channelName: channel.snippet.title,
        customUrl: channel.snippet.customUrl,
        description: channel.snippet.description,
        thumbnailUrl:
          channel.snippet.thumbnails?.high?.url ||
          channel.snippet.thumbnails?.medium?.url,
        subscriberCount: channel.statistics?.subscriberCount
          ? formatCount(channel.statistics.subscriberCount)
          : undefined,
        videoCount: channel.statistics?.videoCount,
      },
    });
  } catch (error) {
    console.error("Error previewing YouTube channel:", error);
    return NextResponse.json(
      { success: false, message: "Failed to preview YouTube channel" },
      { status: 500 },
    );
  }
}
