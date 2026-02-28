import { useState, useEffect } from "react";

const defaultSubTypes = [
  "Classical",
  "Contemporary",
  "Folk",
  "Bollywood",
  "Western",
  "Fusion",
  "Devotional",
];

/**
 * Fetches all unique sub-artist types from the API and merges with defaults.
 * Returns a sorted, deduplicated list.
 */
export function useSubArtistTypes() {
  const [subTypes, setSubTypes] = useState<string[]>(defaultSubTypes);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchSubTypes() {
      try {
        const res = await fetch("/api/artists/sub-types");
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        const fetched: string[] = json.data?.subTypes || [];

        if (!cancelled) {
          // Merge API results with defaults (case-insensitive dedup)
          const seen = new Set<string>();
          const merged: string[] = [];

          for (const item of [...fetched, ...defaultSubTypes]) {
            const key = item.toLowerCase();
            if (!seen.has(key)) {
              seen.add(key);
              merged.push(item);
            }
          }

          merged.sort((a, b) =>
            a.localeCompare(b, undefined, { sensitivity: "base" }),
          );

          setSubTypes(merged);
        }
      } catch {
        // keep defaults on error
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchSubTypes();
    return () => {
      cancelled = true;
    };
  }, []);

  return { subTypes, loading };
}
