import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";

/**
 * GET /api/geocode/reverse?lat=<lat>&lon=<lon>
 * Reverse geocode coordinates to get address components
 * Uses Nominatim (OpenStreetMap)
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

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "AndAction-App/1.0",
      },
    });

    const data = await response.json();

    if (!data || data.error) {
      return errorResponse(
        "Could not find address for this location",
        "NOT_FOUND",
        404
      );
    }

    const addr = data.address || {};
    const city =
      addr.city ||
      addr.town ||
      addr.village ||
      addr.county ||
      addr.state_district ||
      "";
    const state = addr.state || "";
    const postcode = addr.postcode || "";
    const suburb = addr.suburb || addr.neighbourhood || "";
    const road = addr.road || "";

    // Build readable address
    const parts = [road, suburb, city, state].filter(Boolean);
    const formattedAddress = parts.join(", ");

    return successResponse(
      {
        formattedAddress,
        displayName: data.display_name,
        city,
        state,
        postcode,
        lat: data.lat,
        lon: data.lon,
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
