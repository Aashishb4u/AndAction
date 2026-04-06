import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type ArtistCategoryRow = {
  value: string;
  label: string;
};

export async function GET(_request: NextRequest) {
  try {
    const categories = await prisma.$queryRaw<ArtistCategoryRow[]>`
      SELECT "value", "label"
      FROM "artist_categories"
      WHERE "isActive" = true
      ORDER BY "sortOrder" ASC, "label" ASC
    `;

    return NextResponse.json({
      success: true,
      data: { categories },
    });
  } catch (error) {
    console.error("Failed to fetch artist categories", error);
    return NextResponse.json(
      { success: false, data: { categories: [] } },
      { status: 500 },
    );
  }
}
