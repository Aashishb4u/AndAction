import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getMapApiKey, fetchGeocode } from "@/lib/geocoding";

/**
 * GET /api/geocode/pincode?pin=<pincode>
 * Fetches location details (city, district, state) from Indian PIN code
 * Uses Ola Maps
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const pincode = searchParams.get("pin");

    if (!pincode) {
      return errorResponse("PIN code is required", "MISSING_PIN", 400);
    }

    // Validate PIN code format (6 digits for India)
    if (!/^\d{6}$/.test(pincode)) {
      return errorResponse(
        "Invalid PIN code format. Must be 6 digits.",
        "INVALID_PIN",
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

    const { results: geocodingResults, status, error } = await fetchGeocode({
      address: `${pincode}, India`,
    });

    if (geocodingResults.length > 0) {
      const item = geocodingResults[0];

      let city = "";
      let state = "";
      let district = "";

      const components = Array.isArray(item?.address_components)
        ? item.address_components
        : [];
      for (const comp of components) {
        const types: string[] = Array.isArray(comp?.types) ? comp.types : [];
        if (!city && types.includes("locality")) city = String(comp.short_name ?? "");
        if (!state && types.includes("administrative_area_level_1"))
          state = String(comp.long_name ?? "");
        if (!district && types.includes("administrative_area_level_2"))
          district = String(comp.long_name ?? "");
      }

      if (!city) {
        const parts = String(item?.formatted_address ?? item?.name ?? "")
          .split(",")
          .map((p: string) => p.trim())
          .filter(Boolean);
        if (parts.length >= 3) {
          city = parts[0] ?? "";
          state = state || (parts[1] ?? "");
        } else if (parts.length > 0) {
          city = parts[0] ?? "";
        }
      }

      return successResponse(
        {
          pincode,
          city: city || district || String(item?.name ?? ""),
          district: district || city,
          state,
          country: "India",
          region: "",
          division: "",
          postOffice: "",
        },
        "Location fetched successfully",
        200
      );
    }

    if (error || (status && status !== "OK" && status !== "ZERO_RESULTS")) {
      return errorResponse(
        error || `Location provider error (${status})`,
        status || "GEOCODE_PROVIDER_ERROR",
        502
      );
    }

    return errorResponse(
      "Could not fetch location for this PIN code. Please enter manually.",
      "LOCATION_NOT_FOUND",
      404
    );
  } catch (error) {
    console.error("❌ Geocode PIN code error:", error);
    return errorResponse(
      "Failed to fetch location details",
      "INTERNAL_ERROR",
      500
    );
  }
}
