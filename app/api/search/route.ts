import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type ArtistCategorySearchRow = {
  value: string;
  label: string;
};

export async function GET(req: any) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";

  const categories = await prisma.$queryRaw<ArtistCategorySearchRow[]>`
    SELECT "value", "label"
    FROM "artist_categories"
    WHERE "isActive" = true
      AND (
        ${q} = ''
        OR "label" ILIKE ${`%${q}%`}
        OR "value" ILIKE ${`%${q}%`}
      )
    ORDER BY "sortOrder" ASC, "label" ASC
  `;

  return NextResponse.json({ categories });
}
