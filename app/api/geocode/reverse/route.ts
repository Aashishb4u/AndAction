import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";

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

    const apiKey = process.env.OLA_MAPS_API_KEY;
    if (!apiKey) {
      return errorResponse(
        "Location service is not configured",
        "MISSING_OLA_MAPS_API_KEY",
        500
      );
    }

    const url = `https://api.olamaps.io/places/v1/reverse-geocode?latlng=${encodeURIComponent(
      `${lat},${lon}`
    )}`;

    const response = await fetch(url, {
      headers: {
        "X-API-Key": apiKey,
      },
    });

    const data = await response.json().catch(() => null);
    const results = Array.isArray(data?.results)
      ? data.results
      : Array.isArray(data?.geocodingResults)
        ? data.geocodingResults
        : [];

    if (results.length === 0) {
      return errorResponse(
        "Could not find address for this location",
        "NOT_FOUND",
        404
      );
    }

    const item = results[0];

    let city = "";
    let state = "";
    let postcode = "";
    let road = "";
    let suburb = "";

    const components = Array.isArray(item?.address_components)
      ? item.address_components
      : [];
    for (const comp of components) {
      const types: string[] = Array.isArray(comp?.types) ? comp.types : [];
      if (!city && types.includes("locality")) city = String(comp.short_name ?? "");
      if (!state && types.includes("administrative_area_level_1"))
        state = String(comp.long_name ?? "");
      if (!postcode && types.includes("postal_code"))
        postcode = String(comp.long_name ?? comp.short_name ?? "");
      if (!road && types.includes("route")) road = String(comp.long_name ?? "");
      if (!suburb && types.includes("sublocality"))
        suburb = String(comp.long_name ?? comp.short_name ?? "");
    }

    // Build readable address
    const parts = [road, suburb, city, state].filter(Boolean);
    const formattedAddress = parts.join(", ");

    const displayName = String(item?.formatted_address ?? item?.name ?? "");
    const resolvedAddress = formattedAddress || displayName;

    return successResponse(
      {
        formattedAddress: resolvedAddress,
        displayName: displayName || resolvedAddress,
        city,
        state,
        postcode,
        lat:
          item?.geometry?.location?.lat != null
            ? String(item.geometry.location.lat)
            : String(lat),
        lon:
          item?.geometry?.location?.lng != null
            ? String(item.geometry.location.lng)
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
