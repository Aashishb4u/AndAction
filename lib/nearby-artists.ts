/**
 * Location "buckets" for artist lists: widen the radius step by step (50 → 2000 km) until enough
 * artists are found, sort by distance, and top up from a fallback list when the nearby pool is thin.
 * Shared by /api/artists/nearby (home page rows) and Andy, so both rank artists the same way.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export interface NearbySearchMetadata {
  strategy: "nearby" | "expanded" | "nationwide";
  radiusUsed: number;
  totalFound: number;
  nearbyCount: number;
  expandedCount: number;
  nationwideCount: number;
  message: string;
  userLocation: { lat: number; lng: number } | null;
}

export interface NearbyArtist {
  id: string;
  profileImage: string | null;
  stageName: string | null;
  artistType: string | null;
  subArtistType: string | null;
  shortBio: string | null;
  yearsOfExperience: number | null;
  distance: number | null;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatar: string | null;
    city: string | null;
    state: string | null;
    latitude: number | null;
    longitude: number | null;
  };
}

export const RADIUS_STEPS_KM = [50, 100, 200, 350, 500, 1000, 2000];

const INDIA_GEO_BOUNDS = { minLat: 6, maxLat: 37.5, minLng: 68, maxLng: 98 } as const;

export function normalizeIndiaLatLng(
  latitude: unknown,
  longitude: unknown,
): { lat: number; lng: number } | null {
  const lat = Number(latitude);
  const lng = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

  const inIndia =
    lat >= INDIA_GEO_BOUNDS.minLat &&
    lat <= INDIA_GEO_BOUNDS.maxLat &&
    lng >= INDIA_GEO_BOUNDS.minLng &&
    lng <= INDIA_GEO_BOUNDS.maxLng;
  if (inIndia) return { lat, lng };

  const swappedInIndia =
    lng >= INDIA_GEO_BOUNDS.minLat &&
    lng <= INDIA_GEO_BOUNDS.maxLat &&
    lat >= INDIA_GEO_BOUNDS.minLng &&
    lat <= INDIA_GEO_BOUNDS.maxLng;
  if (swappedInIndia) return { lat: lng, lng: lat };

  return { lat, lng };
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

export function calculateDistanceKm(
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

  const distance = 6371 * c;
  return Number.isFinite(distance) ? distance : NaN;
}

export function sortArtistsByDistance<T extends { distance: number | null }>(artists: T[]): T[] {
  return [...artists].sort((a, b) => {
    const aDistance = typeof a.distance === "number" && Number.isFinite(a.distance) ? a.distance : null;
    const bDistance = typeof b.distance === "number" && Number.isFinite(b.distance) ? b.distance : null;

    if (aDistance === null && bDistance === null) return 0;
    if (aDistance === null) return 1;
    if (bDistance === null) return -1;

    const distanceDelta = aDistance - bDistance;
    if (distanceDelta !== 0) return distanceDelta;
    return String((a as { id?: string }).id ?? "").localeCompare(String((b as { id?: string }).id ?? ""));
  });
}

const effectiveLatSql = Prisma.sql`CASE
    WHEN u.latitude BETWEEN ${INDIA_GEO_BOUNDS.minLat} AND ${INDIA_GEO_BOUNDS.maxLat}
      AND u.longitude BETWEEN ${INDIA_GEO_BOUNDS.minLng} AND ${INDIA_GEO_BOUNDS.maxLng}
      THEN u.latitude
    WHEN u.longitude BETWEEN ${INDIA_GEO_BOUNDS.minLat} AND ${INDIA_GEO_BOUNDS.maxLat}
      AND u.latitude BETWEEN ${INDIA_GEO_BOUNDS.minLng} AND ${INDIA_GEO_BOUNDS.maxLng}
      THEN u.longitude
    ELSE u.latitude
  END`;

const effectiveLngSql = Prisma.sql`CASE
    WHEN u.latitude BETWEEN ${INDIA_GEO_BOUNDS.minLat} AND ${INDIA_GEO_BOUNDS.maxLat}
      AND u.longitude BETWEEN ${INDIA_GEO_BOUNDS.minLng} AND ${INDIA_GEO_BOUNDS.maxLng}
      THEN u.longitude
    WHEN u.longitude BETWEEN ${INDIA_GEO_BOUNDS.minLat} AND ${INDIA_GEO_BOUNDS.maxLat}
      AND u.latitude BETWEEN ${INDIA_GEO_BOUNDS.minLng} AND ${INDIA_GEO_BOUNDS.maxLng}
      THEN u.latitude
    ELSE u.longitude
  END`;

const distanceSql = (userLat: number, userLng: number) => Prisma.sql`(
    6371 * acos(
      LEAST(
        1,
        GREATEST(
          -1,
          cos(radians(${userLat})) *
          cos(radians(${effectiveLatSql})) *
          cos(radians(${effectiveLngSql}) - radians(${userLng})) +
          sin(radians(${userLat})) *
          sin(radians(${effectiveLatSql}))
        )
      )
    )
  )`;

/** Query tables: artists as `a`, users as `u`. `whereSql` is the caller's filter (role, type, budget...). */
async function countArtistsInRadius(whereSql: Prisma.Sql, userLat: number, userLng: number, radius: number) {
  const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count
    FROM "artists" a
    INNER JOIN "users" u ON a."userId" = u.id
    WHERE (${whereSql})
      AND u.latitude IS NOT NULL
      AND u.longitude IS NOT NULL
      AND ${distanceSql(userLat, userLng)} <= ${radius}
  `;
  return Number(result[0]?.count || 0);
}

async function fetchArtistsInRadius(
  whereSql: Prisma.Sql,
  userLat: number,
  userLng: number,
  radius: number,
  limit: number,
): Promise<NearbyArtist[]> {
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
      ${distanceSql(userLat, userLng)} AS distance
    FROM "artists" a
    INNER JOIN "users" u ON a."userId" = u.id
    WHERE (${whereSql})
      AND u.latitude IS NOT NULL
      AND u.longitude IS NOT NULL
      AND ${distanceSql(userLat, userLng)} <= ${radius}
    ORDER BY distance ASC, a.id ASC
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
    distance: Number.isFinite(Number(artist.distance)) ? Number(artist.distance) : null,
    user: {
      id: artist.userId,
      firstName: artist.firstName,
      lastName: artist.lastName,
      avatar: artist.avatar,
      city: artist.city,
      state: artist.state,
      latitude: Number.isFinite(Number(artist.latitude)) ? Number(artist.latitude) : null,
      longitude: Number.isFinite(Number(artist.longitude)) ? Number(artist.longitude) : null,
    },
  }));
}

export async function fetchArtistsWithProgressiveSearch(opts: {
  whereSql: Prisma.Sql;
  userLat: number;
  userLng: number;
  minResults: number;
  maxRadius: number;
  /** Used when the nearby pool is thin: artists from anywhere, to top up the list. */
  fetchFallback: () => Promise<NearbyArtist[]>;
  limit?: number;
}): Promise<{ artists: NearbyArtist[]; metadata: NearbySearchMetadata }> {
  const { whereSql, userLat, userLng, minResults, maxRadius, fetchFallback, limit = 50 } = opts;
  const radiusSteps = RADIUS_STEPS_KM.filter((r) => r <= maxRadius);

  for (const radius of radiusSteps) {
    const count = await countArtistsInRadius(whereSql, userLat, userLng, radius);

    if (count >= minResults) {
      const artists = await fetchArtistsInRadius(whereSql, userLat, userLng, radius, limit);
      const strategy = radius <= 100 ? "nearby" : "expanded";
      return {
        artists,
        metadata: {
          strategy,
          radiusUsed: radius,
          totalFound: artists.length,
          nearbyCount: artists.filter((a) => a.distance && a.distance <= 50).length,
          expandedCount: artists.filter((a) => a.distance && a.distance > 50).length,
          nationwideCount: 0,
          message: getSearchMessage(strategy, radius),
          userLocation: { lat: userLat, lng: userLng },
        },
      };
    }
  }

  // Fallback: keep nearby artists first, then fill with additional artists and sort by proximity.
  const nearbyArtists = await fetchArtistsInRadius(whereSql, userLat, userLng, maxRadius, limit);
  const nearbyIds = new Set(nearbyArtists.map((artist) => artist.id));

  const supplementalArtists = (await fetchFallback())
    .filter((artist) => !nearbyIds.has(artist.id))
    .map((artist) => {
      const normalized = normalizeIndiaLatLng(artist.user.latitude, artist.user.longitude);
      if (normalized) {
        const distance = calculateDistanceKm(userLat, userLng, normalized.lat, normalized.lng);
        return { ...artist, distance: Number.isFinite(distance) ? distance : null };
      }
      return { ...artist, distance: null };
    });

  const artists = sortArtistsByDistance([...nearbyArtists, ...supplementalArtists]).slice(0, limit);

  const nationwideCount = artists.filter((a) => a.distance === null).length;
  const strategy = nationwideCount > 0 ? "nationwide" : maxRadius <= 100 ? "nearby" : "expanded";

  return {
    artists,
    metadata: {
      strategy,
      radiusUsed: maxRadius,
      totalFound: artists.length,
      nearbyCount: artists.filter((a) => a.distance && a.distance <= 50).length,
      expandedCount: artists.filter((a) => a.distance && a.distance > 50).length,
      nationwideCount,
      message: getSearchMessage(strategy, maxRadius),
      userLocation: { lat: userLat, lng: userLng },
    },
  };
}
