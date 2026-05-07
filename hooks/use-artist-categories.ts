"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ArtistCategoryOption } from "@/lib/artist-category-utils";

const CATEGORY_QUERY_KEY = ["artist-categories"] as const;

async function fetchArtistCategories(): Promise<ArtistCategoryOption[]> {
  const response = await fetch("/api/artist-categories", { cache: "no-store" });
  if (!response.ok) return [];

  const json = await response.json();
  return json?.data?.categories || [];
}

export function useArtistCategories() {
  const query = useQuery({
    queryKey: CATEGORY_QUERY_KEY,
    queryFn: fetchArtistCategories,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const categories = useMemo(() => query.data || [], [query.data]);

  const categoriesWithAll = useMemo(
    () => [{ value: "all", label: "All" }, ...categories],
    [categories],
  );

  return {
    ...query,
    categories,
    categoriesWithAll,
  };
}
