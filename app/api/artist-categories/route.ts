import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request: NextRequest) {
  try {
    const categories = await prisma.artist_categories.findMany({
      where: { isActive: true },
      select: { value: true, label: true },
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    });

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
