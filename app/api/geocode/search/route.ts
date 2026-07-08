import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import {
  getMapApiKey,
  getMapProvider,
  fetchGeocodeSuggestions,
} from "@/lib/geocoding";

/**
 * GET /api/geocode/search?q=<query>
 * Search for addresses in India using the active map provider
 * Returns structured location suggestions for autocomplete
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get("q");

    if (!query || query.trim().length < 3) {
      return successResponse([], "Query too short", 200);
    }

    const apiKey = getMapApiKey();
    if (!apiKey) {
      return errorResponse(
        "Location service is not configured",
        "MISSING_OLA_MAPS_API_KEY",
        500
      );
    }

    const provider = getMapProvider();
    const { results: geocodingResults, status, error } =
      await fetchGeocodeSuggestions(query);

    if (geocodingResults.length === 0) {
      if (error || (status && status !== "OK" && status !== "ZERO_RESULTS")) {
        return errorResponse(
          error || `Location provider error (${status})`,
          status || "GEOCODE_PROVIDER_ERROR",
          502
        );
      }
      return successResponse([], "No results found", 200);
    }

    const results = geocodingResults.slice(0, 6).map((item: any) => {
      if (provider === "google") {
        const displayName = String(item?.description ?? "").trim();
        const shortAddress = String(
          item?.structured_formatting?.secondary_text ?? displayName,
        ).trim();
        const terms = Array.isArray(item?.terms)
          ? item.terms
              .map((term: any) => String(term?.value ?? "").trim())
              .filter(Boolean)
          : [];
        const nonCountryTerms = terms.filter(
          (term: string) => term.toLowerCase() !== "india",
        );
        const state = nonCountryTerms.at(-1) ?? "";
        const city = nonCountryTerms.at(-2) ?? "";
        const postcodeMatch = displayName.match(/\b\d{6}\b/);

        return {
          displayName,
          shortAddress: shortAddress || displayName,
          city,
          state,
          postcode: postcodeMatch?.[0] ?? "",
          lat: "",
          lon: "",
          placeId: String(item?.place_id ?? ""),
        };
      }

      const formattedAddress = String(
        item?.formatted_address ?? item?.name ?? ""
      );

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

      const shortParts = [road, suburb, city].filter(Boolean);
      const shortAddress = shortParts.join(", ");

      const lat =
        item?.geometry?.location?.lat ?? item?.geometry?.viewport?.southwest?.lat;
      const lon =
        item?.geometry?.location?.lng ?? item?.geometry?.viewport?.southwest?.lng;

      return {
        displayName: formattedAddress,
        shortAddress: shortAddress || formattedAddress,
        city,
        state,
        postcode,
        lat: lat != null ? String(lat) : "",
        lon: lon != null ? String(lon) : "",
        placeId: "",
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
