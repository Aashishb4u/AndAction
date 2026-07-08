import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import {
  getMapApiKey,
  getMapProvider,
  fetchPlaceDetails,
} from "@/lib/geocoding";

type AddressComponent = {
  long_name?: unknown;
  short_name?: unknown;
  types?: unknown;
};

type PlaceDetailsItem = {
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

function getComponentValue(
  comp: AddressComponent,
  mode: "long" | "short" = "long",
): string {
  const raw = mode === "short" ? comp?.short_name : comp?.long_name;
  return raw == null ? "" : String(raw).trim();
}

function findFirstComponentValue(
  components: AddressComponent[],
  wantedTypes: string[],
  mode: "long" | "short" = "long",
): string {
  for (const comp of components) {
    const types = getComponentTypes(comp);
    if (wantedTypes.some((type) => types.includes(type))) {
      const value = getComponentValue(comp, mode);
      if (value) return value;
    }
  }
  return "";
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const placeId = searchParams.get("placeId");

    if (!placeId) {
      return errorResponse(
        "placeId parameter is required",
        "MISSING_PARAMS",
        400,
      );
    }

    const provider = getMapProvider();
    const apiKey = getMapApiKey();
    if (!apiKey) {
      return errorResponse(
        "Location service is not configured",
        "MISSING_MAP_API_KEY",
        500,
      );
    }

    if (provider !== "google") {
      return errorResponse(
        "Place details lookup is only available for Google Maps",
        "UNSUPPORTED_PROVIDER",
        400,
      );
    }

    const { results, status, error } = await fetchPlaceDetails(placeId);

    if (results.length === 0) {
      if (error || (status && status !== "OK" && status !== "ZERO_RESULTS")) {
        return errorResponse(
          error || `Location provider error (${status})`,
          status || "GEOCODE_PROVIDER_ERROR",
          502,
        );
      }

      return errorResponse(
        "Could not find details for this place",
        "NOT_FOUND",
        404,
      );
    }

    const bestItem = results[0] as PlaceDetailsItem;
    const components = Array.isArray(bestItem?.address_components)
      ? (bestItem.address_components as AddressComponent[])
      : [];

    const road = findFirstComponentValue(components, ["route"], "long");
    const suburb =
      findFirstComponentValue(components, ["sublocality_level_1"], "long") ||
      findFirstComponentValue(components, ["sublocality"], "long");
    const city =
      findFirstComponentValue(components, ["locality"], "short") ||
      findFirstComponentValue(components, ["postal_town"], "short") ||
      findFirstComponentValue(
        components,
        ["administrative_area_level_2"],
        "short",
      );
    const state = findFirstComponentValue(
      components,
      ["administrative_area_level_1"],
      "long",
    );
    const postcode = findFirstComponentValue(components, ["postal_code"], "long");

    const formattedAddress = String(
      bestItem?.formatted_address ?? bestItem?.name ?? "",
    ).trim();
    const shortAddress = [road, suburb, city].filter(Boolean).join(", ");

    return successResponse(
      {
        formattedAddress,
        displayName: formattedAddress,
        shortAddress: shortAddress || formattedAddress,
        city,
        state,
        postcode,
        lat:
          bestItem?.geometry?.location?.lat != null
            ? String(bestItem.geometry.location.lat)
            : "",
        lon:
          bestItem?.geometry?.location?.lng != null
            ? String(bestItem.geometry.location.lng)
            : "",
      },
      "Location found",
      200,
    );
  } catch (error) {
    console.error("❌ Place details error:", error);
    return errorResponse(
      "Failed to fetch place details",
      "INTERNAL_ERROR",
      500,
    );
  }
}
