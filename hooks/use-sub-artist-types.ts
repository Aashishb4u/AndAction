import { useState, useEffect } from "react";

/**
 * Fetches sub-artist types from the API.
 * - If categoryValue is provided, returns sub-types for that category only.
 * - If categoryValue is not provided, returns all available sub-types.
 */
export function useSubArtistTypes(categoryValue?: string) {
  const [subTypes, setSubTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchSubTypes() {
      setLoading(true);
      try {
        const category = (categoryValue || "").trim();
        const url = category
          ? `/api/artists/sub-types?category=${encodeURIComponent(category)}`
          : "/api/artists/sub-types";

        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        const fetched: string[] = json.data?.subTypes || [];
        if (!cancelled) setSubTypes(fetched);
      } catch {
        if (!cancelled) setSubTypes([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchSubTypes();
    return () => {
      cancelled = true;
    };
  }, [categoryValue, refreshKey]);

  return { subTypes, loading, refetch: () => setRefreshKey((k) => k + 1) };
}
