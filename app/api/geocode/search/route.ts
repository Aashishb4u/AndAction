import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";

/**
 * GET /api/geocode/search?q=<query>
 * Search for addresses in India using Nominatim (OpenStreetMap)
 * Returns structured location suggestions for autocomplete
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get("q");

    if (!query || query.trim().length < 3) {
      return successResponse([], "Query too short", 200);
    }

    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      query + ", India"
    )}&format=json&addressdetails=1&limit=6&countrycodes=in`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "AndAction-App/1.0",
      },
    });

    const data = await response.json();

    if (!data || !Array.isArray(data)) {
      return successResponse([], "No results found", 200);
    }

    const results = data.map((item: any) => {
      const addr = item.address || {};
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

      // Build a readable short address
      const parts = [road, suburb, city].filter(Boolean);
      const shortAddress = parts.join(", ");

      return {
        displayName: item.display_name,
        shortAddress: shortAddress || item.display_name,
        city,
        state,
        postcode,
        lat: item.lat,
        lon: item.lon,
      };
    });

    return successResponse(results, "Locations found", 200);
  } catch (error) {
    console.error("❌ Geocode search error:", error);
    return errorResponse(
      "Failed to search locations",
      "INTERNAL_ERROR",
      500
    );
  }
}
