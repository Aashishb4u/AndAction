import { NextRequest } from "next/server";
import { ApiErrors, successResponse } from "@/lib/api-response";
import { INDIAN_STATES } from "@/lib/constants";

function normalizeIndianStateName(state: string): string {
  const s = state.trim();
  if (!s) return s;

  const map: Record<string, string> = {
    "National Capital Territory of Delhi": "Delhi",
    "NCT of Delhi": "Delhi",
    Pondicherry: "Puducherry",
    Orissa: "Odisha",
    "Jammu & Kashmir": "Jammu and Kashmir",
  };

  return map[s] ?? s;
}

function resolveStateLabel(state: string): string {
  const trimmed = state.trim();
  if (!trimmed) return trimmed;

  const bySlug = INDIAN_STATES.find((s) => s.value === trimmed)?.label;
  return bySlug ?? trimmed;
}

async function fetchCitiesFromCountriesNow(state: string): Promise<string[]> {
  const response = await fetch(
    "https://countriesnow.space/api/v0.1/countries/state/cities",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ country: "India", state }),
      next: { revalidate: 60 * 60 * 24 * 30 },
    },
  );

  if (!response.ok) return [];

  const json = await response.json().catch(() => null);
  const cities = json && typeof json === "object" ? (json.data as unknown) : null;
  if (!Array.isArray(cities)) return [];

  const unique = new Set<string>();
  for (const c of cities) {
    if (typeof c !== "string") continue;
    const trimmed = c.trim();
    if (!trimmed) continue;
    unique.add(trimmed);
  }

  return Array.from(unique);
}

export async function GET(request: NextRequest) {
  try {
    const stateParam = request.nextUrl.searchParams.get("state") ?? "";
    const resolved = resolveStateLabel(stateParam);
    const normalized = normalizeIndianStateName(resolved);

    if (!normalized) {
      return ApiErrors.badRequest('Query param "state" is required.');
    }

    const reverseMap: Record<string, string> = {
      Delhi: "National Capital Territory of Delhi",
      Puducherry: "Pondicherry",
      Odisha: "Orissa",
      "Jammu and Kashmir": "Jammu & Kashmir",
    };

    const candidates = [
      normalized,
      resolved !== normalized ? resolved : null,
      reverseMap[normalized] ?? null,
    ]
      .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
      .map((v) => v.trim());

    const uniqueCandidates = Array.from(new Set(candidates));

    for (const candidate of uniqueCandidates) {
      const cities = await fetchCitiesFromCountriesNow(candidate);
      if (cities.length === 0) continue;

      cities.sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
      return successResponse({ cities }, "Cities loaded successfully.", 200);
    }

    return successResponse({ cities: [] as string[] }, "No cities found.", 200);
  } catch (error) {
    console.error("Failed to fetch Indian cities", error);
    return ApiErrors.internalError("Failed to fetch cities.");
  }
}
