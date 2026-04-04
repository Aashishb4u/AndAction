import { NextResponse } from "next/server";
import { ARTIST_CATEGORIES } from "@/lib/constants";

export async function GET(req:any) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.toLowerCase() || "";
  const filtered = ARTIST_CATEGORIES.map((cat) => cat.label).filter((label) =>
    label.toLowerCase().includes(q)
  );
  return NextResponse.json({ categories: filtered });
}
