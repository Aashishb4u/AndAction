import { NextResponse } from "next/server";

const ARTIST_CATEGORIES = [
  "Signer",
  "Devotional/Spiritual singer",
  "Live band",
  "Dj/Vj",
  "Musician/Instrumentalist",
];

export async function GET(req:any) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.toLowerCase() || "";
  const filtered = ARTIST_CATEGORIES.filter((cat) =>
    cat.toLowerCase().includes(q)
  );
  return NextResponse.json({ categories: filtered });
}
