import { prisma } from "@/lib/prisma";

const TTL_MS = 60 * 60 * 1000;
const MAX_SUBS_PER_CATEGORY = 14;

type Taxonomy = { categories: { type: string; subs: string[] }[] };

let cache: { at: number; value: Taxonomy } | null = null;

/**
 * Real categories (artistType) and their most common sub-categories (subArtistType), read from the DB,
 * so Andy uses the exact words stored there instead of guessing.
 */
export async function getTaxonomy(): Promise<Taxonomy> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.value;

  const empty: Taxonomy = { categories: [] };
  try {
    const rows = await prisma.artist.findMany({ select: { artistType: true, subArtistType: true } });
    const byType = new Map<string, Map<string, { label: string; n: number }>>();

    for (const row of rows) {
      const type = (row.artistType || "").trim();
      if (!type) continue;
      const subs = byType.get(type) ?? new Map();
      for (const raw of (row.subArtistType || "").split(",")) {
        const label = raw.trim();
        if (!label) continue;
        const key = label.toLowerCase();
        subs.set(key, { label: subs.get(key)?.label ?? label, n: (subs.get(key)?.n ?? 0) + 1 });
      }
      byType.set(type, subs);
    }

    const value: Taxonomy = {
      categories: [...byType.entries()]
        .map(([type, subs]) => ({
          type,
          total: [...subs.values()].reduce((a, b) => a + b.n, 0),
          subs: [...subs.values()]
            .sort((a, b) => b.n - a.n)
            .slice(0, MAX_SUBS_PER_CATEGORY)
            .map((s) => s.label),
        }))
        .filter((c) => c.subs.length > 0)
        .sort((a, b) => b.total - a.total)
        .slice(0, 12)
        .map(({ type, subs }) => ({ type, subs })),
    };
    cache = { at: Date.now(), value };
    return value;
  } catch (error) {
    console.error("Andy taxonomy failed:", error);
    return empty;
  }
}

export function formatTaxonomy(t: Taxonomy): string {
  if (!t.categories.length) return "";
  return t.categories.map((c) => `- ${c.type}: ${c.subs.join("; ")}`).join("\n");
}
