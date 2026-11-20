import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getArtistTypeMatches } from "@/lib/artist-type-mapping";
import { expandSearchTerm } from "@/lib/search-aliases";
import { fetchArtistsWithProgressiveSearch, type NearbyArtist } from "@/lib/nearby-artists";
import { formatDisplayLabel, getArtishName } from "@/lib/utils";
import type { AndyArtist, AndySearchFilters } from "./types";

const MAX_RESULTS = 10;
// Same defaults the home page rows use for /api/artists/nearby.
const MIN_RESULTS = 10;
const MAX_RADIUS_KM = 500;

export type AndyLocation = { lat: number; lng: number };

const clean = (value?: string) => (value ?? "").trim().slice(0, 80);

const num = (value: unknown): number | null => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

const col = (name: string) => Prisma.raw(name);
const ilikeAny = (column: Prisma.Sql, terms: string[]) =>
  Prisma.sql`(${Prisma.join(terms.map((t) => Prisma.sql`${column} ILIKE ${`%${t}%`}`), " OR ")})`;

type Condition = { where: Prisma.ArtistWhereInput; sql: Prisma.Sql };

/**
 * Each filter is written twice, side by side: once as a Prisma filter (no-location search) and once as SQL
 * (the nearby radius search). Keep the two in step when you change one.
 */
function buildConditions(filters: AndySearchFilters): Condition[] {
  const out: Condition[] = [];

  const service = clean(filters.service);
  if (service) {
    const terms = expandSearchTerm(service);
    out.push({
      where: {
        OR: terms.flatMap((term) => [
          { stageName: { contains: term, mode: "insensitive" as const } },
          { subArtistType: { contains: term, mode: "insensitive" as const } },
          { performingEventType: { contains: term, mode: "insensitive" as const } },
          { artistType: { contains: term, mode: "insensitive" as const } },
        ]),
      },
      sql: Prisma.sql`(${Prisma.join(
        [`a."stageName"`, `a."subArtistType"`, `a."performingEventType"`, `a."artistType"`].map((c) =>
          ilikeAny(col(c), terms),
        ),
        " OR ",
      )})`,
    });
  }

  // Category: the artist's main type, e.g. "Live Band" or "spiritual".
  const type = clean(filters.artist_type);
  if (type) {
    const matches = getArtistTypeMatches(type);
    out.push({
      where: {
        OR: [
          { artistType: { in: matches } },
          { artistType: { contains: type, mode: "insensitive" } },
        ],
      },
      sql: Prisma.sql`(a."artistType" IN (${Prisma.join(matches)}) OR a."artistType" ILIKE ${`%${type}%`})`,
    });
  }

  // Sub-category inside the category, e.g. "Acoustic band" or "Sundarkand path". Stored as one
  // comma-separated string, so "contains" matches any of the artist's sub-categories.
  const subCategory = clean(filters.sub_category);
  if (subCategory) {
    const terms = expandSearchTerm(subCategory);
    out.push({
      where: {
        OR: terms.map((term) => ({ subArtistType: { contains: term, mode: "insensitive" as const } })),
      },
      sql: ilikeAny(col(`a."subArtistType"`), terms),
    });
  }

  const eventType = clean(filters.event_type);
  if (eventType) {
    out.push({
      where: { performingEventType: { contains: eventType, mode: "insensitive" } },
      sql: Prisma.sql`a."performingEventType" ILIKE ${`%${eventType}%`}`,
    });
  }

  const language = clean(filters.language);
  if (language) {
    out.push({
      where: { performingLanguage: { contains: language, mode: "insensitive" } },
      sql: Prisma.sql`a."performingLanguage" ILIKE ${`%${language}%`}`,
    });
  }

  const place = clean(filters.place);
  if (place) {
    out.push({
      where: {
        OR: [
          { performingStates: { contains: place, mode: "insensitive" } },
          { user: { is: { state: { contains: place, mode: "insensitive" } } } },
          { user: { is: { city: { contains: place, mode: "insensitive" } } } },
        ],
      },
      sql: Prisma.sql`(a."performingStates" ILIKE ${`%${place}%`} OR u.state ILIKE ${`%${place}%`} OR u.city ILIKE ${`%${place}%`})`,
    });
  }

  const min = num(filters.budget_min);
  const max = num(filters.budget_max);
  if (min !== null || max !== null) {
    // Same overlap rule as the main artist list: a fixed fee must sit inside the range, a fee range
    // must overlap it. Artists with no price are left out.
    const lower = min ?? 0;
    const upper = max ?? Number.MAX_SAFE_INTEGER;
    out.push({
      where: {
        OR: [
          {
            AND: [
              { soloChargesTo: null },
              { soloChargesFrom: { gte: lower } },
              { soloChargesFrom: { lte: upper } },
            ],
          },
          {
            AND: [
              { soloChargesTo: { not: null } },
              { soloChargesFrom: { lte: upper } },
              { soloChargesTo: { gte: lower } },
            ],
          },
        ],
      },
      sql: Prisma.sql`((a."soloChargesTo" IS NULL AND a."soloChargesFrom" >= ${lower} AND a."soloChargesFrom" <= ${upper})
        OR (a."soloChargesTo" IS NOT NULL AND a."soloChargesFrom" <= ${upper} AND a."soloChargesTo" >= ${lower}))`,
    });
  }

  return out;
}

const toCard = (
  row: { id: string; profileImage: string | null; stageName: string | null; artistType: string | null; subArtistType: string | null },
  user: { firstName: string | null; lastName: string | null; state: string | null },
  extra: { startingPrice?: number | null; distanceKm?: number | null } = {},
): AndyArtist => ({
  id: row.id,
  name: getArtishName(row.stageName, user.firstName, user.lastName),
  location: formatDisplayLabel(user.state || ""),
  image: row.profileImage || "",
  category: formatDisplayLabel((row.subArtistType || row.artistType || "").split(/[,/]+/)[0]),
  startingPrice: extra.startingPrice ?? null,
  distanceKm: extra.distanceKm != null ? Math.round(extra.distanceKm) : null,
});

/**
 * Public artist search used by Andy. Every card shown in chat comes from here, never from model text.
 *
 * With the user's location (and no other city named), it uses the same radius-bucket logic as the
 * home page (lib/nearby-artists.ts): nearest first, widening 50 → 500 km until enough artists match.
 * Without it, it falls back to a plain filter search.
 */
export async function searchArtistsForAndy(
  filters: AndySearchFilters,
  location?: AndyLocation | null,
): Promise<{ artists: AndyArtist[]; area: string | null }> {
  const namedPlace = clean(filters.place);
  const useGeo = !!location && !namedPlace;
  // When geo is used the radius replaces the text place filter; a named city always wins over it.
  const conditions = buildConditions(useGeo ? { ...filters, place: undefined } : filters);

  const plainSearch = (take: number) =>
    prisma.artist.findMany({
      where: { AND: conditions.map((c) => c.where), user: { is: { role: "artist" } } },
      take,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        profileImage: true,
        stageName: true,
        artistType: true,
        subArtistType: true,
        shortBio: true,
        yearsOfExperience: true,
        soloChargesFrom: true,
        user: {
          select: { id: true, firstName: true, lastName: true, avatar: true, city: true, state: true, latitude: true, longitude: true },
        },
      },
    });

  if (!useGeo) {
    const rows = await plainSearch(MAX_RESULTS);
    return {
      artists: rows.map((r) => toCard(r, r.user, { startingPrice: num(r.soloChargesFrom) || null })),
      area: namedPlace ? `around ${namedPlace}` : null,
    };
  }

  const { artists, metadata } = await fetchArtistsWithProgressiveSearch({
    whereSql: Prisma.sql`u.role = 'artist'${conditions.length ? Prisma.sql` AND ${Prisma.join(conditions.map((c) => c.sql), " AND ")}` : Prisma.empty}`,
    userLat: location!.lat,
    userLng: location!.lng,
    minResults: MIN_RESULTS,
    maxRadius: MAX_RADIUS_KM,
    limit: MAX_RESULTS,
    fetchFallback: async () =>
      (await plainSearch(50)).map<NearbyArtist>((r) => ({
        id: r.id,
        profileImage: r.profileImage,
        stageName: r.stageName,
        artistType: r.artistType,
        subArtistType: r.subArtistType,
        shortBio: r.shortBio,
        yearsOfExperience: r.yearsOfExperience,
        distance: null,
        user: { ...r.user, latitude: num(r.user.latitude), longitude: num(r.user.longitude) },
      })),
  });

  return {
    artists: artists.map((a) => toCard(a, a.user, { distanceKm: a.distance })),
    area:
      metadata.strategy === "nationwide"
        ? "from across India (few matches nearby)"
        : `within ${metadata.radiusUsed} km of the user`,
  };
}
