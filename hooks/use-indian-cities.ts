"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { INDIAN_STATES } from "@/lib/constants";

export function canonicalizeCityValue(
  currentCity: string,
  cityOptions: Array<{ value: string; label: string }>,
): string {
  const current = (currentCity || "").trim();
  if (!current) return "";

  if (cityOptions.some((o) => o.value === current)) return current;

  const normalize = (v: string) =>
    v
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, "");

  const currentKey = normalize(current);
  const match = cityOptions.find(
    (o) => normalize(o.value) === currentKey || normalize(o.label) === currentKey,
  );

  return match?.value ?? current;
}

function resolveStateLabel(stateValue: string): string {
  const trimmed = (stateValue || "").trim();
  if (!trimmed) return "";

  const match = INDIAN_STATES.find((s) => s.value === trimmed);
  return (match?.label ?? trimmed).trim();
}

async function fetchIndianCitiesByStateLabel(
  stateLabel: string,
): Promise<string[]> {
  const response = await fetch(
    `/api/locations/india/cities?state=${encodeURIComponent(stateLabel)}`,
    { cache: "no-store" },
  );

  if (!response.ok) return [];

  const json = await response.json().catch(() => null);
  const cities = json?.data?.cities;
  return Array.isArray(cities) ? cities.filter((c: any) => typeof c === "string") : [];
}

export const indianLocationKeys = {
  all: ["india-locations"] as const,
  cities: () => [...indianLocationKeys.all, "cities"] as const,
  citiesByState: (stateValue: string) =>
    [...indianLocationKeys.cities(), (stateValue || "").trim()] as const,
};

export function useIndianCitiesByState(stateValue: string) {
  const stateLabel = useMemo(() => resolveStateLabel(stateValue), [stateValue]);

  const query = useQuery({
    queryKey: indianLocationKeys.citiesByState(stateLabel),
    queryFn: () => fetchIndianCitiesByStateLabel(stateLabel),
    enabled: stateLabel.length > 0,
    staleTime: 1000 * 60 * 60 * 24 * 7,
  });

  const cityOptions = useMemo(() => {
    const list = Array.isArray(query.data) ? query.data : [];
    return list.map((city) => ({ value: city, label: city }));
  }, [query.data]);

  return {
    ...query,
    stateLabel,
    cityOptions,
  };
}
