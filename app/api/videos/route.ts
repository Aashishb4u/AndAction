/**
 * app/api/videos/route.ts
 *
 * Handles the retrieval of the main video feed (list of approved videos).
 * Implements pagination, type filtering, and artist filtering.
 *
 * Optional: add &withBookmarks=true to include bookmark info for logged-in user
 *
 * GET /api/videos
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiErrors, successResponse } from "@/lib/api-response";
import { auth } from "@/auth";
import { Prisma } from "@prisma/client";
import { getArtistTypeMatches } from "@/lib/artist-type-mapping";

// --- Configuration ---
const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;
const SHORTS_LOCATION_BUCKET_REELS_PER_ARTIST_RAW = Number(
  process.env.SHORTS_LOCATION_BUCKET_REELS_PER_ARTIST || 10,
);
const SHORTS_LOCATION_BUCKET_REELS_PER_ARTIST =
  Number.isFinite(SHORTS_LOCATION_BUCKET_REELS_PER_ARTIST_RAW)
    ? Math.floor(SHORTS_LOCATION_BUCKET_REELS_PER_ARTIST_RAW)
    : 10;
const INDIA_GEO_BOUNDS = {
  minLat: 6,
  maxLat: 37.5,
  minLng: 68,
  maxLng: 98,
} as const;

function normalizeIndiaLatLng(
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

export async function GET(request: NextRequest): Promise<NextResponse<any>> {
  try {
    const url = new URL(request.url);

    const page = parseInt(url.searchParams.get("page") || "1", 10);
    let limit = parseInt(
      url.searchParams.get("limit") || DEFAULT_LIMIT.toString(),
      10,
    );
    const type = url.searchParams.get("type"); // "shorts" | "videos" | null
    const artistId = url.searchParams.get("artistId"); // filter by userId (legacy)
    const artistProfileId = url.searchParams.get("artistProfileId"); // filter by artist profile (Artist.id)
    const withBookmarks = url.searchParams.get("withBookmarks") === "true"; // NEW 🔥
    const random = url.searchParams.get("random") === "true";
    const artistCategory = url.searchParams.get("category") || "all";
    // Seed for consistent random ordering across paginated pages
    const seedParam = url.searchParams.get("seed");
    const seed = seedParam ? parseFloat(seedParam) : null;

    // Check logged in user if bookmark details requested
    let userId: string | null = null;

    const shouldLoadViewerLocation = type === "shorts" && random;
    let viewerLocation: { lat: number; lng: number } | null = null;

    if (withBookmarks || shouldLoadViewerLocation) {
      const session = await auth();
      userId = session?.user?.id || null;

      if (shouldLoadViewerLocation && userId) {
        const viewer = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            latitude: true,
            longitude: true,
          },
        });

        viewerLocation = normalizeIndiaLatLng(
          viewer?.latitude,
          viewer?.longitude,
        );
      }
    }

    // Build filters
    const where: Prisma.VideoWhereInput = { isApproved: true };

    if (artistCategory && artistCategory !== "all") {
      const matchValues = getArtistTypeMatches(artistCategory);
      where.user = {
        artists: {
          some: {
            OR: matchValues.map((val) => ({
              artistType: { contains: val, mode: "insensitive" as const },
            })),
          },
        },
      };
    }
    // Type filter
    if (type === "shorts") where.isShort = true;
    if (type === "videos") where.isShort = false;

    // Artist filter (NEW)
    if (artistId) where.userId = artistId;
    if (artistProfileId) where.artistId = artistProfileId;

    // Ensure limit is reasonable
    limit = Math.min(limit, MAX_LIMIT);
    limit = Math.max(1, limit);

    const offset = (page - 1) * limit;

    const videoSelect = {
      id: true,
      title: true,
      url: true,
      thumbnailUrl: true,
      duration: true,
      views: true,
      createdAt: true,
      isShort: true,
      artist: {
        select: {
          id: true,
          artistType: true,
          stageName: true,
          profileImage: true,
          profileOrder: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          firstName: true,
          lastName: true,
          avatar: true,
          image: true,
          isArtistVerified: true,
          artists: {
            take: 1,
            orderBy: { profileOrder: "asc" },
            select: { id: true, artistType: true, stageName: true, profileImage: true },
          },
        },
      },
      ...(withBookmarks && userId
        ? {
            bookmarkedByUsers: {
              where: { userId },
              select: { id: true },
            },
          }
        : {}),
    };

    // If we're filtering by a specific artist (artistId or artistProfileId),
    // we don't want random ordering regardless of the random parameter
    const isArtistSpecific = !!artistId || !!artistProfileId;
    const useRandom = random && !isArtistSpecific;

    let videos: any[];
    let totalCount: number;

    if (useRandom) {
      // Build SQL fragments for ORDER BY RANDOM() via raw query
      const typeCondition =
        type === "shorts"
          ? Prisma.sql`AND v."isShort" = true`
          : type === "videos"
          ? Prisma.sql`AND v."isShort" = false`
          : Prisma.empty;

      const artistCondition = artistId
        ? Prisma.sql`AND v."userId" = ${artistId}`
        : Prisma.empty;

      const artistProfileCondition = artistProfileId
        ? Prisma.sql`AND v."artistId" = ${artistProfileId}`
        : Prisma.empty;

      const categoryJoin =
        artistCategory && artistCategory !== "all"
          ? Prisma.sql`JOIN "users" cu ON v."userId" = cu.id JOIN "artists" ca ON cu.id = ca."userId"`
          : Prisma.empty;

      let categoryCondition = Prisma.empty;
      if (artistCategory && artistCategory !== "all") {
        const matchValues = getArtistTypeMatches(artistCategory);
        const conditions = matchValues.map(
          (val) => Prisma.sql`LOWER(TRIM(ca."artistType")) = LOWER(${val})`
        );
        categoryCondition = Prisma.sql`AND (${Prisma.join(conditions, " OR ")})`;
      }

      // Round-robin by artist: rank each artist's videos by newest first,
      // then interleave one video per artist per round so every artist appears
      // on page 1 regardless of how many videos they have.
      // Artist order within each round is randomised by MD5(userId||seed).
      const hasSeed = seed !== null && !isNaN(seed) && seed >= -1 && seed <= 1;
      // Fall back to a server-side random seed so requests without a seed still
      // get consistent intra-request pagination (same query, same OFFSET).
      const effectiveSeedStr = String(hasSeed ? seed : Math.random() * 2 - 1);
      const sourcePrioritySelect =
        type === "shorts"
          ? Prisma.sql`CASE WHEN v."source" = 'instagram' THEN 0 ELSE 1 END AS source_priority,`
          : Prisma.empty;
      const randomFeedOrderBy =
        type === "shorts"
          ? Prisma.sql`source_priority, video_rank, artist_sort_key, id DESC`
          : Prisma.sql`video_rank, artist_sort_key, id DESC`;
      const perArtistOrder =
        type === "shorts"
          ? Prisma.sql`CASE WHEN v."source" = 'instagram' THEN 0 ELSE 1 END, v."publishedAt" DESC, v."createdAt" DESC, v."id" DESC`
          : Prisma.sql`v."publishedAt" DESC, v."createdAt" DESC, v."id" DESC`;
      const locationAwareShortsFeed = type === "shorts" && !!viewerLocation;
      let bucketDebugRows:
        | Array<{
            artist_bucket: number;
            artist_distance_rank: number;
            user_id: string;
            artist_id: string | null;
            stage_name: string | null;
            distance_km: number | null;
            missing_location_priority: number;
          }>
        | null = null;

      const [idRows, countRows, debugRows] = await Promise.all([
        locationAwareShortsFeed
          ? prisma.$queryRaw<{ id: string }[]>`
              WITH matching_artists AS (
                SELECT DISTINCT v."userId"
                FROM "videos" v
                ${categoryJoin}
                WHERE v."isApproved" = true
                ${typeCondition}
                ${artistCondition}
                ${artistProfileCondition}
                ${categoryCondition}
              ),
              ranked_artists AS (
                SELECT
                  ma."userId" AS user_id,
                  CASE
                    WHEN u."latitude" IS NULL OR u."longitude" IS NULL THEN 1
                    ELSE 0
                  END AS missing_location_priority,
                  CASE
                    WHEN u."latitude" IS NULL OR u."longitude" IS NULL THEN NULL
                    ELSE 6371 * 2 * ASIN(
                      SQRT(
                        POWER(SIN(RADIANS((u."latitude" - ${viewerLocation!.lat}) / 2)), 2) +
                        COS(RADIANS(${viewerLocation!.lat})) *
                        COS(RADIANS(u."latitude")) *
                        POWER(SIN(RADIANS((u."longitude" - ${viewerLocation!.lng}) / 2)), 2)
                      )
                    )
                  END AS distance_km,
                  ROW_NUMBER() OVER (
                    ORDER BY
                      CASE
                        WHEN u."latitude" IS NULL OR u."longitude" IS NULL THEN 1
                        ELSE 0
                      END,
                      CASE
                        WHEN u."latitude" IS NULL OR u."longitude" IS NULL THEN NULL
                        ELSE 6371 * 2 * ASIN(
                          SQRT(
                            POWER(SIN(RADIANS((u."latitude" - ${viewerLocation!.lat}) / 2)), 2) +
                            COS(RADIANS(${viewerLocation!.lat})) *
                            COS(RADIANS(u."latitude")) *
                            POWER(SIN(RADIANS((u."longitude" - ${viewerLocation!.lng}) / 2)), 2)
                          )
                        )
                      END NULLS LAST,
                      ma."userId"
                  ) AS artist_distance_rank
                FROM matching_artists ma
                JOIN "users" u ON u.id = ma."userId"
              ),
              per_artist_videos AS (
                SELECT
                  v.id,
                  FLOOR((ra.artist_distance_rank - 1) / 10.0) AS artist_bucket,
                  ra.artist_distance_rank,
                  ROW_NUMBER() OVER (
                    PARTITION BY v."userId"
                    ORDER BY ${perArtistOrder}
                  ) AS video_rank
                FROM "videos" v
                JOIN ranked_artists ra ON ra.user_id = v."userId"
                WHERE v."isApproved" = true
                ${typeCondition}
              ),
              artist_ranked AS (
                SELECT *
                FROM per_artist_videos
                WHERE video_rank <= ${SHORTS_LOCATION_BUCKET_REELS_PER_ARTIST}
              )
              SELECT id
              FROM artist_ranked
              ORDER BY artist_bucket, video_rank, artist_distance_rank, id DESC
              LIMIT ${limit} OFFSET ${offset}
            `
          : prisma.$queryRaw<{ id: string }[]>`
              WITH artist_ranked AS (
                SELECT
                  v.id,
                  ${sourcePrioritySelect}
                  ROW_NUMBER() OVER (
                    PARTITION BY v."userId"
                    ORDER BY ${perArtistOrder}
                  ) AS video_rank,
                  MD5(v."userId" || ${effectiveSeedStr}) AS artist_sort_key
                FROM "videos" v
                ${categoryJoin}
                WHERE v."isApproved" = true
                ${typeCondition}
                ${artistCondition}
                ${artistProfileCondition}
                ${categoryCondition}
              )
              SELECT id
              FROM artist_ranked
              ORDER BY ${randomFeedOrderBy}
              LIMIT ${limit} OFFSET ${offset}
            `,
        locationAwareShortsFeed
          ? prisma.$queryRaw<{ count: bigint }[]>`
              WITH matching_artists AS (
                SELECT DISTINCT v."userId"
                FROM "videos" v
                ${categoryJoin}
                WHERE v."isApproved" = true
                ${typeCondition}
                ${artistCondition}
                ${artistProfileCondition}
                ${categoryCondition}
              ),
              capped_artist_counts AS (
                SELECT LEAST(COUNT(v.id), ${SHORTS_LOCATION_BUCKET_REELS_PER_ARTIST})::bigint AS capped_count
                FROM matching_artists ma
                JOIN "videos" v ON v."userId" = ma."userId"
                WHERE v."isApproved" = true
                ${typeCondition}
                GROUP BY ma."userId"
              )
              SELECT COALESCE(SUM(capped_count), 0)::bigint AS count
              FROM capped_artist_counts
            `
          : prisma.$queryRaw<{ count: bigint }[]>`
              SELECT COUNT(v.id) AS count
              FROM "videos" v
              ${categoryJoin}
              WHERE v."isApproved" = true
              ${typeCondition}
              ${artistCondition}
              ${artistProfileCondition}
              ${categoryCondition}
            `,
        locationAwareShortsFeed
          ? prisma.$queryRaw<
              Array<{
                artist_bucket: number;
                artist_distance_rank: number;
                user_id: string;
                artist_id: string | null;
                stage_name: string | null;
                distance_km: number | null;
                missing_location_priority: number;
              }>
            >`
              WITH matching_artists AS (
                SELECT DISTINCT v."userId"
                FROM "videos" v
                ${categoryJoin}
                WHERE v."isApproved" = true
                ${typeCondition}
                ${artistCondition}
                ${artistProfileCondition}
                ${categoryCondition}
              ),
              ranked_artists AS (
                SELECT
                  ma."userId" AS user_id,
                  CASE
                    WHEN u."latitude" IS NULL OR u."longitude" IS NULL THEN 1
                    ELSE 0
                  END AS missing_location_priority,
                  CASE
                    WHEN u."latitude" IS NULL OR u."longitude" IS NULL THEN NULL
                    ELSE 6371 * 2 * ASIN(
                      SQRT(
                        POWER(SIN(RADIANS((u."latitude" - ${viewerLocation!.lat}) / 2)), 2) +
                        COS(RADIANS(${viewerLocation!.lat})) *
                        COS(RADIANS(u."latitude")) *
                        POWER(SIN(RADIANS((u."longitude" - ${viewerLocation!.lng}) / 2)), 2)
                      )
                    )
                  END AS distance_km,
                  ROW_NUMBER() OVER (
                    ORDER BY
                      CASE
                        WHEN u."latitude" IS NULL OR u."longitude" IS NULL THEN 1
                        ELSE 0
                      END,
                      CASE
                        WHEN u."latitude" IS NULL OR u."longitude" IS NULL THEN NULL
                        ELSE 6371 * 2 * ASIN(
                          SQRT(
                            POWER(SIN(RADIANS((u."latitude" - ${viewerLocation!.lat}) / 2)), 2) +
                            COS(RADIANS(${viewerLocation!.lat})) *
                            COS(RADIANS(u."latitude")) *
                            POWER(SIN(RADIANS((u."longitude" - ${viewerLocation!.lng}) / 2)), 2)
                          )
                        )
                      END NULLS LAST,
                      ma."userId"
                  ) AS artist_distance_rank
                FROM matching_artists ma
                JOIN "users" u ON u.id = ma."userId"
              )
              SELECT
                FLOOR((ra.artist_distance_rank - 1) / 10.0)::int AS artist_bucket,
                ra.artist_distance_rank::int AS artist_distance_rank,
                ra.user_id,
                (
                  SELECT a.id
                  FROM "artists" a
                  WHERE a."userId" = ra.user_id
                  ORDER BY a."profileOrder" ASC
                  LIMIT 1
                ) AS artist_id,
                (
                  SELECT a."stageName"
                  FROM "artists" a
                  WHERE a."userId" = ra.user_id
                  ORDER BY a."profileOrder" ASC
                  LIMIT 1
                ) AS stage_name,
                ra.distance_km,
                ra.missing_location_priority::int AS missing_location_priority
              FROM ranked_artists ra
              ORDER BY artist_bucket, artist_distance_rank
            `
          : Promise.resolve(null),
      ]);

      totalCount = Number(countRows[0]?.count ?? 0);
      bucketDebugRows = debugRows;

      if (bucketDebugRows) {
        const bucketMap = new Map<
          number,
          Array<{
            rank: number;
            userId: string;
            artistId: string | null;
            stageName: string | null;
            distanceKm: number | null;
            missingLocation: boolean;
          }>
        >();

        for (const row of bucketDebugRows) {
          const bucket = Number(row.artist_bucket) + 1;
          if (!bucketMap.has(bucket)) {
            bucketMap.set(bucket, []);
          }

          bucketMap.get(bucket)!.push({
            rank: Number(row.artist_distance_rank),
            userId: row.user_id,
            artistId: row.artist_id,
            stageName: row.stage_name,
            distanceKm:
              row.distance_km == null ? null : Number(row.distance_km.toFixed(2)),
            missingLocation: Number(row.missing_location_priority) === 1,
          });
        }

        console.log(
          "[VIDEOS] Shorts location buckets:",
          JSON.stringify(Object.fromEntries(bucketMap), null, 2),
        );
      }

      const randomIds = idRows.map((r) => r.id);

      if (randomIds.length > 0) {
        const fetched = await prisma.video.findMany({
          where: { id: { in: randomIds } },
          select: videoSelect as any,
        });
        const videoMap = new Map(fetched.map((v: any) => [v.id, v]));
        videos = randomIds.map((id) => videoMap.get(id)).filter(Boolean) as any[];
      } else {
        videos = [];
      }
    } else {
      // On artist detail pages, keep Instagram shorts ahead of YouTube shorts
      // so the first pages prioritise the fresher Instagram content.
      const shortsOrderBy =
        type === "shorts" && isArtistSpecific
          ? [
              { source: "asc" as const },
              { publishedAt: "desc" as const },
              { createdAt: "desc" as const },
              { id: "desc" as const },
            ]
          : [
              { publishedAt: "desc" as const },
              { createdAt: "desc" as const },
              { id: "desc" as const },
            ];

      // Default: newest-first ordering
      const [fetched, count] = await Promise.all([
        prisma.video.findMany({
          where,
          skip: offset,
          take: limit,
          orderBy: shortsOrderBy,
          select: videoSelect as any,
        }),
        prisma.video.count({ where }),
      ]);
      videos = fetched;
      totalCount = count;
    }

    const totalPages = Math.ceil(totalCount / limit);

    // 3. Inject bookmark state (only when withBookmarks=true)
    let processedVideos = videos;

    if (withBookmarks) {
      processedVideos = videos.map((v: any) => ({
        ...v,
        isBookmarked: (v.bookmarkedByUsers?.length ?? 0) > 0,
        bookmarkId: v.bookmarkedByUsers?.[0]?.id || null,
        bookmarkedByUsers: undefined, // remove raw join key
      }));
    }

    return successResponse(
      {
        videos: processedVideos,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
      `Successfully retrieved ${processedVideos.length} videos for page ${page}.`,
      200,
    );
  } catch (error) {
    console.error("GET /api/videos API Error:", error);
    return ApiErrors.internalError(
      "An unexpected error occurred while fetching videos.",
    );
  }
}
