import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getArtistTypeMatches } from "@/lib/artist-type-mapping";
import { expandSearchTerm } from "@/lib/search-aliases";
import { calculateDistanceKm, normalizeIndiaLatLng } from "@/lib/nearby-artists";
import { formatDisplayLabel, getArtishName } from "@/lib/utils";
import type { AndyArtist, AndySearchFilters } from "./types";

const MAX_RESULTS = 10;
// shortcut: candidates are ranked in memory from a capped pool; move ranking into SQL if matching artists exceed this.
const POOL_SIZE = 300;
const PLACE_POOL_SIZE = 100;

export type AndyLocation = { lat: number; lng: number };

const clean = (value?: string) => (value ?? "").trim().slice(0, 80);

const num = (value: unknown): number | null => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

type PriceState = "fit" | "unpriced" | "out";

const UNPRICED: Prisma.ArtistWhereInput = {
  OR: [{ soloChargesFrom: null }, { soloChargesFrom: 0 }],
};

/** Prisma filters for everything except place and budget. */
function buildConditions(filters: AndySearchFilters): Prisma.ArtistWhereInput[] {
  const out: Prisma.ArtistWhereInput[] = [];

  const service = clean(filters.service);
  if (service) {
    const terms = expandSearchTerm(service);
    out.push({
      OR: terms.flatMap((term) => [
        { stageName: { contains: term, mode: "insensitive" as const } },
        { subArtistType: { contains: term, mode: "insensitive" as const } },
        { performingEventType: { contains: term, mode: "insensitive" as const } },
        { artistType: { contains: term, mode: "insensitive" as const } },
      ]),
    });
  }

  // Category: the artist's main type, e.g. "Live Band" or "spiritual".
  const type = clean(filters.artist_type);
  if (type) {
    out.push({
      OR: [{ artistType: { in: getArtistTypeMatches(type) } }, { artistType: { contains: type, mode: "insensitive" } }],
    });
  }

  // Sub-category inside the category, e.g. "Acoustic band" or "Sundarkand path". Stored as one
  // comma-separated string, so "contains" matches any of the artist's sub-categories.
  const subCategory = clean(filters.sub_category);
  if (subCategory) {
    out.push({
      OR: expandSearchTerm(subCategory).map((term) => ({
        subArtistType: { contains: term, mode: "insensitive" as const },
      })),
    });
  }

  const eventType = clean(filters.event_type);
  if (eventType) out.push({ performingEventType: { contains: eventType, mode: "insensitive" } });

  const language = clean(filters.language);
  if (language) out.push({ performingLanguage: { contains: language, mode: "insensitive" } });

  return out;
}

const placeWhere = (place: string): Prisma.ArtistWhereInput => ({
  OR: [
    { performingStates: { contains: place, mode: "insensitive" } },
    { user: { is: { state: { contains: place, mode: "insensitive" } } } },
    { user: { is: { city: { contains: place, mode: "insensitive" } } } },
  ],
});

/**
 * Same overlap rule as the main artist list: a fixed fee must sit inside the range, a fee range must
 * overlap it. Artists with no price are not "out of budget": they rank after the ones that fit.
 */
function priceState(from: unknown, to: unknown, min: number | null, max: number | null): PriceState {
  const lo = num(from) ?? 0;
  const hi = num(to) ?? lo;
  if (!lo && !hi) return "unpriced";
  if (min === null && max === null) return "fit";
  return lo <= (max ?? Infinity) && hi >= (min ?? 0) ? "fit" : "out";
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

const poolSelect = {
  id: true,
  profileImage: true,
  stageName: true,
  artistType: true,
  subArtistType: true,
  performingStates: true,
  soloChargesFrom: true,
  soloChargesTo: true,
  user: {
    select: { firstName: true, lastName: true, city: true, state: true, latitude: true, longitude: true },
  },
} satisfies Prisma.ArtistSelect;

/**
 * Public artist search used by Andy. Every card shown in chat comes from here, never from model text.
 *
 * Ranking, in order: (1) within the requested budget, then artists with no price listed;
 * (2) artists in the named city; (3) nearest to the user's location (when known), else most recently updated.
 * Artists priced outside the budget are dropped.
 */
export async function searchArtistsForAndy(
  filters: AndySearchFilters,
  location?: AndyLocation | null,
): Promise<{ artists: AndyArtist[]; area: string | null }> {
  const place = clean(filters.place);
  const min = num(filters.budget_min);
  const max = num(filters.budget_max);
  const hasBudget = min !== null || max !== null;

  const base: Prisma.ArtistWhereInput[] = [{ user: { is: { role: "artist" } } }, ...buildConditions(filters)];
  if (hasBudget) {
    const lower = min ?? 0;
    const upper = max ?? Number.MAX_SAFE_INTEGER;
    base.push({
      OR: [
        UNPRICED,
        { AND: [{ soloChargesTo: null }, { soloChargesFrom: { gte: lower } }, { soloChargesFrom: { lte: upper } }] },
        { AND: [{ soloChargesTo: { not: null } }, { soloChargesFrom: { lte: upper } }, { soloChargesTo: { gte: lower } }] },
      ],
    });
  }

  const find = (extra: Prisma.ArtistWhereInput[], take: number) =>
    prisma.artist.findMany({
      where: { AND: [...base, ...extra] },
      take,
      orderBy: { updatedAt: "desc" },
      select: poolSelect,
    });

  // The named city is queried on its own so it cannot be cut off by the general pool.
  const [inPlace, general] = await Promise.all([
    place ? find([placeWhere(place)], PLACE_POOL_SIZE) : [],
    find([], POOL_SIZE),
  ]);

  const needle = place.toLowerCase();
  const seen = new Set<string>();
  const ranked = [...inPlace, ...general]
    .filter((r) => !seen.has(r.id) && !!seen.add(r.id))
    .map((r) => {
      const coords = normalizeIndiaLatLng(r.user.latitude, r.user.longitude);
      const distance =
        location && coords ? calculateDistanceKm(location.lat, location.lng, coords.lat, coords.lng) : NaN;
      const inCity =
        !!needle &&
        [r.user.city, r.user.state, r.performingStates].some((v) => (v ?? "").toLowerCase().includes(needle));
      return {
        r,
        price: priceState(r.soloChargesFrom, r.soloChargesTo, min, max),
        inCity,
        distance: Number.isFinite(distance) ? distance : null,
      };
    })
    .filter((x) => x.price !== "out")
    .sort(
      (a, b) =>
        Number(a.price === "unpriced") - Number(b.price === "unpriced") ||
        Number(b.inCity) - Number(a.inCity) ||
        (a.distance ?? Infinity) - (b.distance ?? Infinity),
    )
    .slice(0, MAX_RESULTS);

  const area = place
    ? `${place} first${location ? ", then nearest to the user" : ", then other cities"}`
    : location
      ? "nearest to the user first"
      : null;

  return {
    artists: ranked.map(({ r, distance }) =>
      toCard(r, r.user, { startingPrice: num(r.soloChargesFrom) || null, distanceKm: distance }),
    ),
    area,
  };
}
