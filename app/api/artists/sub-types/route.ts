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
  const normalizedValue = normalizeArtistCategoryValue(rawValue);
  if (!normalizedValue) return null;

  const category = await prisma.artist_categories.findFirst({
    where: {
      OR: [
        { value: { equals: normalizedValue, mode: "insensitive" } },
        { label: { equals: normalizedValue, mode: "insensitive" } },
      ],
    },
    select: { id: true },
  });

  return category?.id ?? null;
}

function hasSubCategoriesModel() {
  const client = prisma as unknown as Record<string, unknown>;
  const model = client["artists_sub_categories"] as
    | { findMany?: unknown; findFirst?: unknown; create?: unknown }
    | undefined;

  return (
    !!model &&
    typeof model.findMany === "function" &&
    typeof model.findFirst === "function" &&
    typeof model.create === "function"
  );
}

async function getDerivedSubTypesFromArtists(categoryValue?: string) {
  const normalized = categoryValue ? normalizeArtistCategoryValue(categoryValue) : "";

  const artists = await prisma.artist.findMany({
    where: {
      subArtistType: { not: null },
      ...(normalized
        ? { artistType: { equals: normalized, mode: "insensitive" } }
        : {}),
    },
    select: { subArtistType: true },
  });

  const derived: string[] = [];
  for (const artist of artists) {
    if (!artist.subArtistType) continue;
    derived.push(
      ...artist.subArtistType
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    );
  }

  return sortAndDedupeCaseInsensitive(derived);
}

export async function GET(req: NextRequest): Promise<SubTypesResponse> {
  try {
    const categoryValue = req.nextUrl.searchParams.get("category") || "";

    if (categoryValue.trim()) {
      if (!hasSubCategoriesModel()) {
        const subTypes = await getDerivedSubTypesFromArtists(categoryValue);
        return successResponse({ subTypes });
      }

      try {
        const categoryId = await resolveCategoryIdFromValue(categoryValue);
        if (!categoryId) return successResponse({ subTypes: [] });

        const rows = await prisma.artists_sub_categories.findMany({
          where: { categoryId },
          select: { subCategoryLabel: true },
          orderBy: { subCategoryLabel: "asc" },
        });

        return successResponse({
          subTypes: sortAndDedupeCaseInsensitive(
            rows.map((r) => r.subCategoryLabel),
          ),
        });
      } catch (error) {
        console.error("[sub-types] category query failed, falling back to artists:", error);
        const subTypes = await getDerivedSubTypesFromArtists(categoryValue);
        return successResponse({ subTypes });
      }
    }

    const derivedFromArtistsPromise = getDerivedSubTypesFromArtists();

    if (!hasSubCategoriesModel()) {
      const subTypes = await derivedFromArtistsPromise;
      return successResponse({ subTypes });
    }

    try {
      const [rows, derivedFromArtists] = await Promise.all([
        prisma.artists_sub_categories.findMany({
          select: { subCategoryLabel: true },
          distinct: ["subCategoryLabel"],
          orderBy: { subCategoryLabel: "asc" },
        }),
        derivedFromArtistsPromise,
      ]);

      const subTypes = sortAndDedupeCaseInsensitive([
        ...rows.map((r) => r.subCategoryLabel),
        ...derivedFromArtists,
      ]);

      return successResponse({ subTypes });
    } catch (error) {
      console.error("[sub-types] query failed, falling back to artists:", error);
      const subTypes = await derivedFromArtistsPromise;
      return successResponse({ subTypes });
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
    if (!hasSubCategoriesModel()) {
      return ApiErrors.internalError(
        "Sub-categories table is not available. Please run DB migrations.",
      );
    }

    const categoryId = await resolveCategoryIdFromValue(trimmedCategoryValue);
    if (!categoryId) return ApiErrors.badRequest("Invalid category");

    const existing = await prisma.artists_sub_categories.findFirst({
      where: {
        categoryId,
        subCategoryLabel: { equals: trimmedLabel, mode: "insensitive" },
      },
      select: { id: true, categoryId: true, subCategoryLabel: true },
    });

    if (existing) {
      return successResponse({
        created: false,
        subType: {
          id: existing.id,
          label: existing.subCategoryLabel,
          categoryId: existing.categoryId,
        },
      });
    }

    const created = await prisma.artists_sub_categories.create({
      data: {
        categoryId,
        subCategoryLabel: trimmedLabel,
      },
      select: { id: true, categoryId: true, subCategoryLabel: true },
    });

    return successResponse({
      created: true,
      subType: {
        id: created.id,
        label: created.subCategoryLabel,
        categoryId: created.categoryId,
      },
    });
  } catch (error) {
    console.error("[sub-types] create failed:", error);
    return ApiErrors.internalError("Failed to create sub-type");
  }
}
