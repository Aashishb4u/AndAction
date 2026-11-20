import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiErrors, successResponse } from "@/lib/api-response";
import { Prisma } from "@prisma/client";
import { getArtistTypeMatches } from "@/lib/artist-type-mapping";
import {
  fetchArtistsWithProgressiveSearch,
  type NearbySearchMetadata as SearchMetadata,
} from "@/lib/nearby-artists";

async function fetchTopRatedNationwide(
  type: string,
  verified: boolean,
  limit: number = 50,
) {
  const typeMatches = await getArtistTypeMatches(type);
//issue here;
  const artists = await prisma.artist.findMany({
    where: {
      artistType: {
        in:
          typeof typeMatches === "string"
            ? [typeMatches]
            : Array.isArray(typeMatches)
              ? typeMatches.filter((item) => typeof item === "string")
              : [],
      },
      user: {
        role: "artist",
        ...(verified && {
          isAccountVerified: true,
          isArtistVerified: true,
        }),
      },
    },
    take: limit,
    orderBy: {
      createdAt: "desc", // Could be rating/popularity if available
    },
    select: {
      id: true,
      profileImage: true,
      stageName: true,
      artistType: true,
      subArtistType: true,
      shortBio: true,
      yearsOfExperience: true,
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
          city: true,
          state: true,
          latitude: true,
          longitude: true,
        },
      },
    },
  });

  return artists.map((artist) => ({
    ...artist,
    distance: null, // No distance for nationwide results
  }));
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);

    // Required parameters
    const type = searchParams.get("type");

    // Optional location parameters
    const latParam = searchParams.get("lat");
    const lngParam = searchParams.get("lng");
    const lat = latParam ? parseFloat(latParam) : null;
    const lng = lngParam ? parseFloat(lngParam) : null;

    // Optional parameters
    const minResults = parseInt(searchParams.get("minResults") || "10");
    const maxRadius = parseInt(searchParams.get("maxRadius") || "500");
    const verified = searchParams.get("verified") === "true";

    // Validation
    if (!type) {
      return ApiErrors.badRequest("Artist type is required");
    }

    // If location not provided, return artists without distance filtering
    if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) {
      const artists = await fetchTopRatedNationwide(type, verified, 50);

      return successResponse(
        {
          artists,
          metadata: {
            strategy: "nationwide",
            radiusUsed: 0,
            totalFound: artists.length,
            nearbyCount: 0,
            expandedCount: 0,
            nationwideCount: artists.length,
            message: "Showing artists (location not available)",
            userLocation: null,
          } as SearchMetadata,
        },
        "Artists retrieved successfully",
        200,
      );
    }

    // Validate coordinates
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return ApiErrors.badRequest("Invalid coordinates");
    }

    // Execute smart progressive search (shared with Andy, see lib/nearby-artists.ts)
    const typeMatches = await getArtistTypeMatches(type);
    const result = await fetchArtistsWithProgressiveSearch({
      whereSql: Prisma.sql`a."artistType" IN (${Prisma.join(typeMatches)})
        AND u.role = 'artist'
        ${verified ? Prisma.sql`AND u."isAccountVerified" = true AND u."isArtistVerified" = true` : Prisma.empty}`,
      userLat: lat,
      userLng: lng,
      minResults,
      maxRadius,
      fetchFallback: () => fetchTopRatedNationwide(type, verified, 50) as any,
    });

    console.log(`\n✅ Strategy: ${result.metadata.strategy}`);
    console.log(`   Radius: ${result.metadata.radiusUsed}km`);
    console.log(`   Found: ${result.metadata.totalFound} artists\n`);

    return successResponse(
      {
        artists: result.artists,
        metadata: result.metadata,
      },
      "Artists retrieved successfully",
      200,
    );
  } catch (error) {
    console.error("❌ Nearby Artists API Error:", error);
    return ApiErrors.internalError("Failed to fetch nearby artists");
  }
}
