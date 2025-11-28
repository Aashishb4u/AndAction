import { NextResponse } from "next/server";

const API_KEY = process.env.YOUTUBE_KEY;

// Convert ISO 8601 duration (PT1M10S) to seconds
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)M)?(?:(\d+)S)?/);
  const mins = match?.[1] ? parseInt(match[1], 10) : 0;
  const secs = match?.[2] ? parseInt(match[2], 10) : 0;
  return mins * 60 + secs;
}

export async function POST(req: Request) {
  const { channelId } = await req.json();

  if (!channelId) {
    return NextResponse.json({ error: "channelId missing" }, { status: 400 });
  }

  try {
    // 1️⃣ Get list of videos
    const searchURL =
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=50&type=video&order=date&key=${API_KEY}`;

    const searchRes = await fetch(searchURL);
    const searchData = await searchRes.json();

    const videoIds = searchData.items.map((i: any) => i.id.videoId).join(",");

    if (!videoIds) {
      return NextResponse.json({ shorts: [] });
    }

    // 2️⃣ Get detailed info to filter shorts
    const detailsURL =
      `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet,statistics&id=${videoIds}&key=${API_KEY}`;

    const detailsRes = await fetch(detailsURL);
    const detailsData = await detailsRes.json();

    const shorts = detailsData.items.filter((vid: any) => {
      const sec = parseDuration(vid.contentDetails.duration);
      return sec <= 60; // ONLY SHORTS
    });

    return NextResponse.json({ shorts });

  } catch (err) {
    console.error("YouTube API error:", err);
    return NextResponse.json({ error: "Failed to fetch YouTube shorts" }, { status: 500 });
  }
}
