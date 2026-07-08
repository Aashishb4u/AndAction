import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getMapApiKey, fetchGeocode } from "@/lib/geocoding";

type AddressComponent = {
  long_name?: unknown;
  short_name?: unknown;
  types?: unknown;
};

type ReverseGeocodeItem = {
  formatted_address?: unknown;
  name?: unknown;
  address_components?: unknown;
  geometry?: {
    location?: { lat?: unknown; lng?: unknown };
  };
};

function getComponentTypes(comp: AddressComponent): string[] {
  return Array.isArray(comp?.types) ? (comp.types as string[]) : [];
}

function getCompValue(
  comp: AddressComponent,
  mode: "long" | "short" = "long",
): string {
  const raw = mode === "short" ? comp?.short_name : comp?.long_name;
  if (raw == null) return "";
  return String(raw).trim();
}

function findFirstComponentValue(
  components: AddressComponent[],
  wantedTypes: string[],
  mode: "long" | "short" = "long",
): string {
  for (const comp of components) {
    const types = getComponentTypes(comp);
    if (wantedTypes.some((t) => types.includes(t))) {
      const value = getCompValue(comp, mode);
      if (value) return value;
    }
  }
  return "";
}

function scoreReverseResult(item: ReverseGeocodeItem): number {
  const components = Array.isArray(item?.address_components)
    ? (item.address_components as AddressComponent[])
    : [];

  const has = (t: string) =>
    components.some((c) => getComponentTypes(c).includes(t));

  const formatted = String(item?.formatted_address ?? "").trim();

  const score =
    (has("street_number") ? 6 : 0) +
    (has("route") ? 5 : 0) +
    (has("premise") ? 3 : 0) +
    (has("subpremise") ? 3 : 0) +
    (has("neighborhood") ? 2 : 0) +
    (has("sublocality") || has("sublocality_level_1") ? 2 : 0) +
    (has("postal_code") ? 2 : 0) +
    Math.min(4, Math.floor(formatted.length / 25));

  return score;
}

function pickBestReverseResult(results: ReverseGeocodeItem[]): ReverseGeocodeItem {
  let best = results[0];
  let bestScore = -1;
  let bestLen = 0;

  for (const item of results) {
    const score = scoreReverseResult(item);
    const formattedLen = String(item?.formatted_address ?? "").trim().length;
    if (score > bestScore || (score === bestScore && formattedLen > bestLen)) {
      best = item;
      bestScore = score;
      bestLen = formattedLen;
    }
  }

  return best;
}

/**
 * GET /api/geocode/reverse?lat=<lat>&lon=<lon>
 * Reverse geocode coordinates to get address components
 * Uses Ola Maps
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const lat = searchParams.get("lat");
    const lon = searchParams.get("lon");

    if (!lat || !lon) {
      return errorResponse(
        "lat and lon parameters are required",
        "MISSING_PARAMS",
        400
      );
    }

    const apiKey = getMapApiKey();
    if (!apiKey) {
      return errorResponse(
        "Location service is not configured",
        "MISSING_OLA_MAPS_API_KEY",
        500
      );
    }

    const { results, status, error } = await fetchGeocode({
      latlng: `${lat},${lon}`,
    });

    if (results.length === 0) {
      if (error || (status && status !== "OK" && status !== "ZERO_RESULTS")) {
        return errorResponse(
          error || `Location provider error (${status})`,
          status || "GEOCODE_PROVIDER_ERROR",
          502
        );
      }
      return errorResponse(
        "Could not find address for this location",
        "NOT_FOUND",
        404
      );
    }

    const bestItem = pickBestReverseResult(results as ReverseGeocodeItem[]);

    const components = Array.isArray(bestItem?.address_components)
      ? (bestItem.address_components as AddressComponent[])
      : [];

    const streetNumber = findFirstComponentValue(components, ["street_number"], "short");
    const road = findFirstComponentValue(components, ["route"], "long");
    const premise = findFirstComponentValue(components, ["premise"], "long");
    const subpremise = findFirstComponentValue(components, ["subpremise"], "long");
    const neighborhood = findFirstComponentValue(components, ["neighborhood"], "long");
    const suburb =
      findFirstComponentValue(components, ["sublocality_level_1"], "long") ||
      findFirstComponentValue(components, ["sublocality"], "long");
    const city =
      findFirstComponentValue(components, ["locality"], "short") ||
      findFirstComponentValue(components, ["postal_town"], "short") ||
      findFirstComponentValue(components, ["administrative_area_level_2"], "short");
    const district = findFirstComponentValue(
      components,
      ["administrative_area_level_2"],
      "long",
    );
    const state = findFirstComponentValue(
      components,
      ["administrative_area_level_1"],
      "long",
    );
    const postcode = findFirstComponentValue(components, ["postal_code"], "long");
    const country = findFirstComponentValue(components, ["country"], "long");

    const formattedFromApi = String(bestItem?.formatted_address ?? "").trim();
    const displayName = String(bestItem?.name ?? bestItem?.formatted_address ?? "").trim();

    const formattedFromParts = [
      [streetNumber, road].filter(Boolean).join(" "),
      premise,
      subpremise,
      neighborhood,
      suburb,
      city,
      district && district !== city ? district : "",
      state,
      postcode,
      country,
    ]
      .filter(Boolean)
      .join(", ");

    const resolvedAddress = formattedFromApi || formattedFromParts || displayName;

    return successResponse(
      {
        formattedAddress: resolvedAddress,
        displayName: displayName || resolvedAddress,
        city,
        state,
        postcode,
        district,
        country,
        road,
        suburb,
        streetNumber,
        premise,
        subpremise,
        neighborhood,
        lat:
          bestItem?.geometry?.location?.lat != null
            ? String(bestItem.geometry.location.lat)
            : String(lat),
        lon:
          bestItem?.geometry?.location?.lng != null
            ? String(bestItem.geometry.location.lng)
            : String(lon),
      },
      "Location found",
      200
    );
  } catch (error) {
    console.error("❌ Reverse geocode error:", error);
    return errorResponse(
      "Failed to reverse geocode",
      "INTERNAL_ERROR",
      500
    );
  }
}
