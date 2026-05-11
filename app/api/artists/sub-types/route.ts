import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ApiErrors, ApiResponse, successResponse } from "@/lib/api-response";
import { normalizeArtistCategoryValue } from "@/lib/artist-category-utils";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DebugInfo = {
  dbMeta?: {
    db: string;
    schema: string;
    search_path: string | null;
    server_addr: string | null;
    server_port: number | null;
  } | null;
  input?: {
    categoryValue: string;
  };
  resolved?: {
    categoryId: string | null;
  };
  counts?: {
    total_cnt: number;
    live_band_cnt: number;
  } | null;
  tableInfo?: Array<{ table_schema: string; table_name: string }>;
  fetch?: {
    rawCount?: number;
    prismaCount?: number;
    rawSample?: string[];
    prismaSample?: string[];
  };
  databaseUrl?: { host: string | null; database: string | null } | null;
};

type SubTypesResponse = ApiResponse<{ subTypes: string[]; debug?: DebugInfo }>;

const DEBUG = process.env.DEBUG_SUBTYPES === "1";

function debugLog(...args: unknown[]) {
  if (DEBUG) console.log("[sub-types]", ...args);
}

function sanitizeDatabaseUrl(value: string | undefined) {
  if (!value) return null;
  try {
    const u = new URL(value);
    const db = u.pathname ? u.pathname.replace(/^\//, "") : null;
    return { host: u.host || null, database: db || null };
  } catch {
    return null;
  }
}

function sortAndDedupeCaseInsensitive(items: string[]) {
  const seen = new Set<string>();
  const merged: string[] = [];

  for (const item of items) {
    const v = (item || "").trim();
    if (!v) continue;
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(v);
  }

  merged.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  return merged;
}

async function resolveCategoryIdFromValue(rawValue: string) {
  const raw = (rawValue || "").trim();
  if (!raw) return null;

  const normalized = normalizeArtistCategoryValue(raw);
  const candidates = Array.from(new Set([raw, normalized].filter(Boolean)));

  for (const candidate of candidates) {
    const rows = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id
      FROM public.artist_categories
      WHERE id = ${candidate}
         OR lower(value) = lower(${candidate})
         OR lower(label) = lower(${candidate})
         OR lower(value) = lower(replace(${candidate}, '-', ' '))
         OR lower(label) = lower(replace(${candidate}, '-', ' '))
         OR lower(replace(value, '-', ' ')) = lower(replace(${candidate}, '-', ' '))
         OR lower(replace(value, ' ', '-')) = lower(replace(${candidate}, ' ', '-'))
      LIMIT 1
    `;

    if (rows[0]?.id) {
      debugLog("resolveCategoryIdFromValue", {
        rawValue,
        normalized,
        candidate,
        resolvedId: rows[0].id,
      });
      return rows[0].id;
    }
  }

  debugLog("resolveCategoryIdFromValue", {
    rawValue,
    normalized,
    candidates,
    resolvedId: null,
  });
  return null;
}

// async function fetchSubTypesByCategoryId(categoryId: string) {
//   const rows = await prisma.$queryRaw<Array<{ sub_category_label: string }>>`
//     SELECT sub_category_label
//     FROM artists_sub_categories
//     WHERE category_id = ${categoryId}
//     ORDER BY sub_category_label ASC
//   `;

//   return sortAndDedupeCaseInsensitive(rows.map((r) => r.sub_category_label));
// }

async function fetchSubTypesByCategoryId(categoryId: string) {
  const [rawRows, prismaRows] = await Promise.all([
    prisma.$queryRaw<Array<{ sub_category_label: string }>>`
      SELECT sub_category_label
      FROM public.artists_sub_categories
      WHERE category_id = ${categoryId}
         OR btrim(category_id) = btrim(${categoryId})
      ORDER BY sub_category_label ASC
    `,
    prisma.artists_sub_categories
      .findMany({
        where: { categoryId },
        select: { subCategoryLabel: true },
        orderBy: { subCategoryLabel: "asc" },
      })
      .catch((e) => {
        debugLog("prisma.findMany(category) failed", e);
        return [] as Array<{ subCategoryLabel: string }>;
      }),
  ]);

  const raw = sortAndDedupeCaseInsensitive(
    rawRows.map((r) => r.sub_category_label),
  );
  const viaPrisma = sortAndDedupeCaseInsensitive(
    prismaRows.map((r) => r.subCategoryLabel),
  );

  debugLog("fetchSubTypesByCategoryId", {
    categoryId,
    rawCount: raw.length,
    prismaCount: viaPrisma.length,
    rawSample: raw.slice(0, 5),
    prismaSample: viaPrisma.slice(0, 5),
  });

  return raw.length > 0 ? raw : viaPrisma;
}

// async function fetchAllDistinctSubTypes() {
//   const rows = await prisma.$queryRaw<Array<{ sub_category_label: string }>>`
//     SELECT DISTINCT sub_category_label
//     FROM artists_sub_categories
//     ORDER BY sub_category_label ASC
//   `;

//   return sortAndDedupeCaseInsensitive(rows.map((r) => r.sub_category_label));
// }

async function fetchAllDistinctSubTypes() {
  const [rawRows, prismaRows] = await Promise.all([
    prisma.$queryRaw<Array<{ sub_category_label: string }>>`
      SELECT DISTINCT sub_category_label
      FROM public.artists_sub_categories
      ORDER BY sub_category_label ASC
    `,
    prisma.artists_sub_categories
      .findMany({ select: { subCategoryLabel: true } })
      .catch((e) => {
        debugLog("prisma.findMany(all) failed", e);
        return [] as Array<{ subCategoryLabel: string }>;
      }),
  ]);

  const raw = sortAndDedupeCaseInsensitive(
    rawRows.map((r) => r.sub_category_label),
  );
  const viaPrisma = sortAndDedupeCaseInsensitive(
    prismaRows.map((r) => r.subCategoryLabel),
  );

  debugLog("fetchAllDistinctSubTypes", {
    rawCount: raw.length,
    prismaCount: viaPrisma.length,
    rawSample: raw.slice(0, 5),
    prismaSample: viaPrisma.slice(0, 5),
  });

  return raw.length > 0 ? raw : viaPrisma;
}

export async function GET(req: NextRequest): Promise<SubTypesResponse> {
  try {
    const categoryValue = req.nextUrl.searchParams.get("category") || "";
    debugLog("GET", { url: req.nextUrl.toString(), categoryValue });
    const debugRequested =
      req.nextUrl.searchParams.get("debug") === "1" &&
      process.env.NODE_ENV !== "production";

    let debugInfo: DebugInfo | undefined;
    if (debugRequested) {
      debugInfo = {
        input: { categoryValue },
        databaseUrl: sanitizeDatabaseUrl(process.env.DATABASE_URL),
      };
    }

    if (DEBUG || debugRequested) {
      try {
        const meta = await prisma.$queryRaw<
          Array<{
            db: string;
            schema: string;
            search_path: string | null;
            server_addr: string | null;
            server_port: number | null;
          }>
        >`
          SELECT
            current_database()::text as db,
            current_schema()::text as schema,
            current_setting('search_path', true)::text as search_path,
            inet_server_addr()::text as server_addr,
            inet_server_port()::int as server_port
        `;
        debugLog("db-meta", meta?.[0] ?? null);
        if (debugInfo) debugInfo.dbMeta = meta?.[0] ?? null;

        const counts = await prisma.$queryRaw<
          Array<{ total_cnt: number; live_band_cnt: number }>
        >`
          SELECT
            (SELECT count(*)::int FROM public.artists_sub_categories) as total_cnt,
            (SELECT count(*)::int FROM public.artists_sub_categories WHERE category_id='cat_live_band') as live_band_cnt
        `;
        debugLog("table-counts", counts?.[0] ?? null);
        if (debugInfo) debugInfo.counts = counts?.[0] ?? null;

        const tableInfo = await prisma.$queryRaw<
          Array<{ table_schema: string; table_name: string }>
        >`
          SELECT table_schema::text, table_name::text
          FROM information_schema.tables
          WHERE table_name = 'artists_sub_categories'
          ORDER BY table_schema, table_name
        `;
        debugLog("table-info", tableInfo);
        if (debugInfo) debugInfo.tableInfo = tableInfo;
      } catch (e) {
        debugLog("debug meta failed", e);
      }
    }

    if (categoryValue.trim()) {
      try {
        const categoryId = await resolveCategoryIdFromValue(categoryValue);
        if (debugInfo) debugInfo.resolved = { categoryId };
        if (!categoryId) return successResponse({ subTypes: [], debug: debugInfo });

        const [rawRows, prismaRows] = await Promise.all([
          prisma.$queryRaw<Array<{ sub_category_label: string }>>`
            SELECT sub_category_label
            FROM public.artists_sub_categories
            WHERE category_id = ${categoryId}
               OR btrim(category_id) = btrim(${categoryId})
            ORDER BY sub_category_label ASC
          `,
          prisma.artists_sub_categories
            .findMany({
              where: { categoryId },
              select: { subCategoryLabel: true },
              orderBy: { subCategoryLabel: "asc" },
            })
            .catch(() => [] as Array<{ subCategoryLabel: string }>),
        ]);

        const raw = sortAndDedupeCaseInsensitive(
          rawRows.map((r) => r.sub_category_label),
        );
        const viaPrisma = sortAndDedupeCaseInsensitive(
          prismaRows.map((r) => r.subCategoryLabel),
        );

        if (debugInfo) {
          debugInfo.fetch = {
            rawCount: raw.length,
            prismaCount: viaPrisma.length,
            rawSample: raw.slice(0, 10),
            prismaSample: viaPrisma.slice(0, 10),
          };
        }

        const subTypes = raw.length > 0 ? raw : viaPrisma;
        debugLog("GET result", { categoryId, count: subTypes.length });
        return successResponse({ subTypes, debug: debugInfo });
      } catch (error) {
        console.error("[sub-types] category query failed:", error);
        return successResponse({ subTypes: [], debug: debugInfo });
      }
    }

    try {
      const subTypes = await fetchAllDistinctSubTypes();
      debugLog("GET result", { categoryId: null, count: subTypes.length });
      return successResponse({ subTypes, debug: debugInfo });
    } catch (error) {
      console.error("[sub-types] query failed:", error);
      return successResponse({ subTypes: [], debug: debugInfo });
    }
  } catch (error) {
    console.error("[sub-types] failed:", error);
    return ApiErrors.internalError("Failed to fetch sub-types");
  }
}

type CreateSubTypeResponse = ApiResponse<{
  created: boolean;
  subType: { id: number; label: string; categoryId: string };
}>;

export async function POST(req: NextRequest): Promise<CreateSubTypeResponse> {
  const session = await auth();
  if (!session || session.user.role !== "artist") return ApiErrors.unauthorized();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return ApiErrors.badRequest("Invalid JSON body");
  }

  const categoryValue =
    body && typeof body === "object" && "category" in body
      ? String((body as any).category || "")
      : "";
  const label =
    body && typeof body === "object" && "label" in body
      ? String((body as any).label || "")
      : "";

  const trimmedLabel = label.trim();
  const trimmedCategoryValue = categoryValue.trim();
  if (!trimmedCategoryValue) return ApiErrors.badRequest("Category is required");
  if (!trimmedLabel) return ApiErrors.badRequest("Label is required");

  try {
    const categoryId = await resolveCategoryIdFromValue(trimmedCategoryValue);
    if (!categoryId) return ApiErrors.badRequest("Invalid category");

    const existingRows = await prisma.$queryRaw<
      Array<{ id: number; category_id: string; sub_category_label: string }>
    >`
      SELECT id, category_id, sub_category_label
      FROM public.artists_sub_categories
      WHERE category_id = ${categoryId}
        AND lower(sub_category_label) = lower(${trimmedLabel})
      LIMIT 1
    `;
    const existing = existingRows[0];

    if (existing) {
      debugLog("POST dedup hit", { categoryId, label: trimmedLabel, id: existing.id });
      return successResponse({
        created: false,
        subType: {
          id: existing.id,
          label: existing.sub_category_label,
          categoryId: existing.category_id,
        },
      });
    }

    const insertedRows = await prisma.$queryRaw<
      Array<{ id: number; category_id: string; sub_category_label: string }>
    >`
      INSERT INTO public.artists_sub_categories (category_id, sub_category_label, created_at, updated_at)
      VALUES (${categoryId}, ${trimmedLabel}, NOW(), NOW())
      ON CONFLICT (category_id, sub_category_label) DO NOTHING
      RETURNING id, category_id, sub_category_label
    `;
    const created = insertedRows[0];
    if (!created) {
      const stillExistingRows = await prisma.$queryRaw<
        Array<{ id: number; category_id: string; sub_category_label: string }>
      >`
        SELECT id, category_id, sub_category_label
        FROM public.artists_sub_categories
        WHERE category_id = ${categoryId}
          AND lower(sub_category_label) = lower(${trimmedLabel})
        LIMIT 1
      `;
      const stillExisting = stillExistingRows[0];
      if (!stillExisting) return ApiErrors.internalError("Failed to create sub-type");
      debugLog("POST dedup hit (after insert)", {
        categoryId,
        label: trimmedLabel,
        id: stillExisting.id,
      });
      return successResponse({
        created: false,
        subType: {
          id: stillExisting.id,
          label: stillExisting.sub_category_label,
          categoryId: stillExisting.category_id,
        },
      });
    }

    debugLog("POST created", { categoryId, label: trimmedLabel, id: created.id });

    return successResponse({
      created: true,
      subType: {
        id: created.id,
        label: created.sub_category_label,
        categoryId: created.category_id,
      },
    });
  } catch (error) {
    console.error("[sub-types] create failed:", error);
    return ApiErrors.internalError("Failed to create sub-type");
  }
}
