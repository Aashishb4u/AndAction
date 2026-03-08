/**
 * GET /api/artists/sub-types
 *
 * Returns all unique sub-artist types from the database.
 * These are extracted from comma-separated `subArtistType` fields on Artist records.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse } from "@/lib/api-response";

export async function GET() {
  try {
    // Fetch all non-null subArtistType values
    const artists = await prisma.artist.findMany({
      where: {
        subArtistType: { not: null },
      },
      select: {
        subArtistType: true,
      },
    });

    // Extract unique sub-types from comma-separated strings
    const subTypeSet = new Set<string>();
    for (const artist of artists) {
      if (artist.subArtistType) {
        artist.subArtistType
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .forEach((s) => subTypeSet.add(s));
      }
    }

    // Sort alphabetically
    const subTypes = Array.from(subTypeSet).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    );

    return successResponse({ subTypes }, "Sub-types retrieved successfully.");
  } catch (error) {
    console.error("Failed to fetch sub-types:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch sub-types" },
      { status: 500 },
    );
  }
}
