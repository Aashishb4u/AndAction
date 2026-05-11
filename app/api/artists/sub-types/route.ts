import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ApiErrors, ApiResponse, successResponse } from "@/lib/api-response";
import { normalizeArtistCategoryValue } from "@/lib/artist-category-utils";
import { NextRequest } from "next/server";

type SubTypesResponse = ApiResponse<{ subTypes: string[] }>;

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
      FROM artist_categories
      WHERE id = ${candidate}
         OR lower(value) = lower(${candidate})
         OR lower(label) = lower(${candidate})
         OR lower(value) = lower(replace(${candidate}, '-', ' '))
         OR lower(label) = lower(replace(${candidate}, '-', ' '))
         OR lower(replace(value, '-', ' ')) = lower(replace(${candidate}, '-', ' '))
         OR lower(replace(value, ' ', '-')) = lower(replace(${candidate}, ' ', '-'))
      LIMIT 1
    `;

    if (rows[0]?.id) return rows[0].id;
  }

  return null;
}

async function fetchSubTypesByCategoryId(categoryId: string) {
  const rows = await prisma.$queryRaw<Array<{ sub_category_label: string }>>`
    SELECT sub_category_label
    FROM artists_sub_categories
    WHERE category_id = ${categoryId}
    ORDER BY sub_category_label ASC
  `;

  return sortAndDedupeCaseInsensitive(rows.map((r) => r.sub_category_label));
}

async function fetchAllDistinctSubTypes() {
  const rows = await prisma.$queryRaw<Array<{ sub_category_label: string }>>`
    SELECT DISTINCT sub_category_label
    FROM artists_sub_categories
    ORDER BY sub_category_label ASC
  `;

  return sortAndDedupeCaseInsensitive(rows.map((r) => r.sub_category_label));
}

export async function GET(req: NextRequest): Promise<SubTypesResponse> {
  try {
    const categoryValue = req.nextUrl.searchParams.get("category") || "";

    if (categoryValue.trim()) {
      try {
        const categoryId = await resolveCategoryIdFromValue(categoryValue);
        if (!categoryId) return successResponse({ subTypes: [] });
        const subTypes = await fetchSubTypesByCategoryId(categoryId);
        return successResponse({ subTypes });
      } catch (error) {
        console.error("[sub-types] category query failed:", error);
        return successResponse({ subTypes: [] });
      }
    }

    try {
      const subTypes = await fetchAllDistinctSubTypes();
      return successResponse({ subTypes });
    } catch (error) {
      console.error("[sub-types] query failed:", error);
      return successResponse({ subTypes: [] });
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
      FROM artists_sub_categories
      WHERE category_id = ${categoryId}
        AND lower(sub_category_label) = lower(${trimmedLabel})
      LIMIT 1
    `;
    const existing = existingRows[0];

    if (existing) {
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
      INSERT INTO artists_sub_categories (category_id, sub_category_label, created_at, updated_at)
      VALUES (${categoryId}, ${trimmedLabel}, NOW(), NOW())
      RETURNING id, category_id, sub_category_label
    `;
    const created = insertedRows[0];
    if (!created) return ApiErrors.internalError("Failed to create sub-type");

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
