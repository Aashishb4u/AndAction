import { NextResponse } from "next/server";

const IG_TOKEN = process.env.INSTAGRAM_TOKEN;

export async function POST(req: Request) {
  const { instagramId } = await req.json();

  if (!instagramId) {
    return NextResponse.json({ error: "instagramId missing" }, { status: 400 });
  }

  try {
    // 1️⃣ Get all media for the account
    const url =
      `https://graph.instagram.com/${instagramId}/media?fields=id,media_type,media_url,thumbnail_url,caption,permalink&access_token=${IG_TOKEN}`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data?.data) {
      return NextResponse.json({ reels: [] });
    }

    // 2️⃣ Filter reels (videos)
    const reels = data.data.filter((media: any) =>
      media.media_type === "VIDEO"
    );

    return NextResponse.json({ reels });

  } catch (err) {
    console.error("Instagram API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch Instagram reels" },
      { status: 500 }
    );
  }
}
