import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiErrors, successResponse } from "@/lib/api-response";
import { Prisma } from "@prisma/client";
import { getArtistTypeMatches } from "@/lib/artist-type-mapping";

interface SearchMetadata {
  strategy: "nearby" | "expanded" | "nationwide";
  radiusUsed: number;
  totalFound: number;
  nearbyCount: number;
  expandedCount: number;
  nationwideCount: number;
  message: string;
  userLocation: {
    lat: number;
    lng: number;
  } | null;
}

function getSearchMessage(strategy: string, radius: number): string {
  switch (strategy) {
    case "nearby":
      return `Showing artists near your location (within ${radius}km)`;
    case "expanded":
      return `Showing artists within ${radius}km of your location`;
    case "nationwide":
      return `Limited artists nearby. Showing top-rated artists nationwide`;
    default:
      return `Showing artists`;
  }
}

function calculateDistanceKm(
  userLat: number,
  userLng: number,
  targetLat: number,
  targetLng: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(targetLat - userLat);
  const dLng = toRad(targetLng - userLng);
  const lat1 = toRad(userLat);
  const lat2 = toRad(targetLat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return 6371 * c;
}

function sortArtistsByDistance<T extends { distance: number | null }>(
  artists: T[],
): T[] {
  return [...artists].sort((a, b) => {
    if (a.distance === null && b.distance === null) return 0;
    if (a.distance === null) return 1;
    if (b.distance === null) return -1;
    return a.distance - b.distance;
  });
}

async function countArtistsInRadius(
  type: string,
  userLat: number,
  userLng: number,
  radius: number,
  verified: boolean,
): Promise<number> {
  const typeMatches = getArtistTypeMatches(type);

  const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count
    FROM "artists" a
    INNER JOIN "users" u ON a."userId" = u.id
    WHERE 
      (${Prisma.raw(typeMatches.map((t) => `a."artistType" = '${t}'`).join(" OR "))})
      AND u.role = 'artist'
      AND u.latitude IS NOT NULL
      AND u.longitude IS NOT NULL
      ${verified ? Prisma.sql`AND u."isAccountVerified" = true AND u."isArtistVerified" = true` : Prisma.empty}
      AND (
        6371 * acos(
          cos(radians(${userLat})) * 
          cos(radians(u.latitude)) * 
          cos(radians(u.longitude) - radians(${userLng})) + 
          sin(radians(${userLat})) * 
          sin(radians(u.latitude))
        )
      ) <= ${radius}
  `;

  return Number(result[0]?.count || 0);
}

/**
 * Fetch artists within radius with distance calculation
 */
async function fetchArtistsInRadius(
  type: string,
  userLat: number,
  userLng: number,
  radius: number,
  verified: boolean,
  limit: number = 50,
) {
  const typeMatches = getArtistTypeMatches(type);

  const artists = await prisma.$queryRaw<Array<any>>`
    SELECT 
      a.id,
      a."profileImage",
      a."stageName",
      a."artistType",
      a."subArtistType",
      a."shortBio",
      a."yearsOfExperience",
      u.id as "userId",
      u."firstName",
      u."lastName",
      u.avatar,
      u.city,
      u.state,
      u.latitude,
      u.longitude,
      (
        6371 * acos(
          cos(radians(${userLat})) * 
          cos(radians(u.latitude)) * 
          cos(radians(u.longitude) - radians(${userLng})) + 
          sin(radians(${userLat})) * 
          sin(radians(u.latitude))
        )
      ) AS distance
    FROM "artists" a
    INNER JOIN "users" u ON a."userId" = u.id
    WHERE 
      (${Prisma.raw(typeMatches.map((t) => `a."artistType" = '${t}'`).join(" OR "))})
      AND u.role = 'artist'
      AND u.latitude IS NOT NULL
      AND u.longitude IS NOT NULL
      ${verified ? Prisma.sql`AND u."isAccountVerified" = true AND u."isArtistVerified" = true` : Prisma.empty}
      AND (
        6371 * acos(
          cos(radians(${userLat})) * 
          cos(radians(u.latitude)) * 
          cos(radians(u.longitude) - radians(${userLng})) + 
          sin(radians(${userLat})) * 
          sin(radians(u.latitude))
        )
      ) <= ${radius}
    ORDER BY distance ASC
    LIMIT ${limit}
  `;

  return artists.map((artist) => ({
    id: artist.id,
    profileImage: artist.profileImage,
    stageName: artist.stageName,
    artistType: artist.artistType,
    subArtistType: artist.subArtistType,
    shortBio: artist.shortBio,
    yearsOfExperience: artist.yearsOfExperience,
    distance: Number(artist.distance),
    user: {
      id: artist.userId,
      firstName: artist.firstName,
      lastName: artist.lastName,
      avatar: artist.avatar,
      city: artist.city,
      state: artist.state,
      latitude: Number(artist.latitude),
      longitude: Number(artist.longitude),
    },
  }));
}

async function fetchTopRatedNationwide(
  type: string,
  verified: boolean,
  limit: number = 50,
) {
  const typeMatches = getArtistTypeMatches(type);

  const artists = await prisma.artist.findMany({
    where: {
      artistType: { in: typeMatches },
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

async function fetchArtistsWithProgressiveSearch(
  type: string,
  userLat: number,
  userLng: number,
  minResults: number,
  maxRadius: number,
  verified: boolean,
) {
  const radiusSteps = [50, 100, 200, 350, 500, 1000, 2000].filter(
    (r) => r <= maxRadius,
  );

  let nearbyCount = 0;
  let expandedCount = 0;

  // Try each radius progressively
  for (const radius of radiusSteps) {
    // Quick count check
    const count = await countArtistsInRadius(
      type,
      userLat,
      userLng,
      radius,
      verified,
    );

    // If we have enough, fetch them
    if (count >= minResults) {
      const artists = await fetchArtistsInRadius(
        type,
        userLat,
        userLng,
        radius,
        verified,
        50,
      );

      // Count nearby vs expanded
      nearbyCount = artists.filter(
        (a) => a.distance && a.distance <= 50,
      ).length;
      expandedCount = artists.filter(
        (a) => a.distance && a.distance > 50,
      ).length;

      const strategy = radius <= 100 ? "nearby" : "expanded";

      return {
        artists,
        metadata: {
          strategy,
          radiusUsed: radius,
          totalFound: artists.length,
          nearbyCount,
          expandedCount,
          nationwideCount: 0,
          message: getSearchMessage(strategy, radius),
          userLocation: { lat: userLat, lng: userLng },
        } as SearchMetadata,
      };
    }
  }

  // Fallback: keep nearby artists first, then fill with additional artists and sort by proximity.
  const nearbyArtists = await fetchArtistsInRadius(
    type,
    userLat,
    userLng,
    maxRadius,
    verified,
    50,
  );

  const nearbyIds = new Set(nearbyArtists.map((artist) => artist.id));

  const nationwideCandidates = await fetchTopRatedNationwide(type, verified, 50);
  const supplementalArtists = nationwideCandidates
    .filter((artist) => !nearbyIds.has(artist.id))
    .map((artist) => {
      if (
        typeof artist.user.latitude === "number" &&
        typeof artist.user.longitude === "number"
      ) {
        return {
          ...artist,
          distance: calculateDistanceKm(
            userLat,
            userLng,
            artist.user.latitude,
            artist.user.longitude,
          ),
        };
      }

      return {
        ...artist,
        distance: null,
      };
    });

  const artists = sortArtistsByDistance([
    ...nearbyArtists,
    ...supplementalArtists,
  ]).slice(0, 50);

  nearbyCount = artists.filter((a) => a.distance && a.distance <= 50).length;
  expandedCount = artists.filter((a) => a.distance && a.distance > 50).length;
  const nationwideCount = artists.filter((a) => a.distance === null).length;

  const strategy =
    nationwideCount > 0
      ? "nationwide"
      : maxRadius <= 100
        ? "nearby"
        : "expanded";

  return {
    artists,
    metadata: {
      strategy,
      radiusUsed: maxRadius,
      totalFound: artists.length,
      nearbyCount,
      expandedCount,
      nationwideCount,
      message: getSearchMessage(strategy, maxRadius),
      userLocation: { lat: userLat, lng: userLng },
    } as SearchMetadata,
  };
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

    // Execute smart progressive search
    const result = await fetchArtistsWithProgressiveSearch(
      type,
      lat,
      lng,
      minResults,
      maxRadius,
      verified,
    );

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
