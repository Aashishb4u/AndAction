interface GeocodeResult {
  lat: number;
  lng: number;
  formattedAddress?: string;
}

export type MapProvider = "google" | "ola";

/**
 * Which map provider to use, controlled by the MAP_CONFIG env flag.
 * MAP_CONFIG=google -> Google Maps, otherwise defaults to Ola Maps.
 */
export function getMapProvider(): MapProvider {
  const cfg = String(process.env.MAP_CONFIG || "ola").trim().toLowerCase();
  return cfg === "google" ? "google" : "ola";
}

/**
 * API key for the currently selected map provider.
 */
export function getMapApiKey(): string {
  return getMapProvider() === "google"
    ? String(process.env.GOOGLE_MAPS_API_KEY || "").trim()
    : String(process.env.OLA_MAPS_API_KEY || "").trim();
}

export interface GeocodeFetchResult {
  results: any[];
  /** Provider status, e.g. Google's "OK" | "REQUEST_DENIED" | "ZERO_RESULTS". */
  status?: string;
  /** Human-readable provider error, e.g. Google's error_message. */
  error?: string;
}

/**
 * Fetch geocoding results from the active map provider, along with the raw
 * provider status/error so callers can surface real failures (bad key, quota,
 * referer restriction) instead of masking them as "no results".
 * Both Ola Maps and Google Maps return the same address_components/geometry
 * shape, so callers can parse `results` identically.
 * Pass `address` for forward geocoding or `latlng` ("lat,lng") for reverse.
 */
export async function fetchGeocode(opts: {
  address?: string;
  latlng?: string;
}): Promise<GeocodeFetchResult> {
  const provider = getMapProvider();
  const apiKey = getMapApiKey();
  if (!apiKey) {
    return {
      results: [],
      status: "NOT_CONFIGURED",
      error: `${provider} map API key is not set`,
    };
  }

  let url = "";
  let headers: Record<string, string> = {};

  if (provider === "google") {
    const param = opts.latlng
      ? `latlng=${encodeURIComponent(opts.latlng)}`
      : `address=${encodeURIComponent(opts.address || "")}`;
    url = `https://maps.googleapis.com/maps/api/geocode/json?${param}&key=${encodeURIComponent(
      apiKey,
    )}`;
  } else {
    url = opts.latlng
      ? `https://api.olamaps.io/places/v1/reverse-geocode?latlng=${encodeURIComponent(
          opts.latlng,
        )}`
      : `https://api.olamaps.io/places/v1/geocode?address=${encodeURIComponent(
          opts.address || "",
        )}`;
    headers = { "X-API-Key": apiKey };
  }

  const response = await fetch(url, { headers });
  const data = await response.json().catch(() => null);

  const results = Array.isArray(data?.results)
    ? data.results
    : Array.isArray(data?.geocodingResults)
      ? data.geocodingResults
      : [];

  const status: string | undefined = data?.status;
  const error: string | undefined = data?.error_message ?? data?.message;

  if (
    results.length === 0 &&
    (error || (status && status !== "OK" && status !== "ZERO_RESULTS"))
  ) {
    console.warn(
      `[geocode:${provider}] status=${status ?? "?"} error=${error ?? "?"}`,
    );
  }

  return { results, status, error };
}

/**
 * Convenience wrapper that returns only the results array.
 */
export async function fetchGeocodeResults(opts: {
  address?: string;
  latlng?: string;
}): Promise<any[]> {
  const { results } = await fetchGeocode(opts);
  return results;
}

/**
 * Multi-suggestion search for autocomplete UIs.
 *
 * Ola's geocode endpoint already returns several candidates, so we reuse it.
 * Google's Geocoding API only returns the single best match, so for Google we
 * use Places Autocomplete to get the candidate list and Place Details to fill
 * each one's coordinates/address_components. Both paths return items in the
 * same address_components/geometry shape, so callers parse them identically.
 */
export async function fetchGeocodeSuggestions(
  query: string,
  limit = 6,
): Promise<GeocodeFetchResult> {
  const provider = getMapProvider();
  const apiKey = getMapApiKey();
  if (!apiKey) {
    return {
      results: [],
      status: "NOT_CONFIGURED",
      error: `${provider} map API key is not set`,
    };
  }

  if (provider !== "google") {
    return fetchGeocode({ address: query });
  }

  // 1) Places Autocomplete -> candidate list
  const acUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
    query,
  )}&components=country:in&key=${encodeURIComponent(apiKey)}`;
  const acResp = await fetch(acUrl);
  const acData = await acResp.json().catch(() => null);
  const acStatus: string | undefined = acData?.status;
  const acError: string | undefined = acData?.error_message;
  const predictions = Array.isArray(acData?.predictions)
    ? acData.predictions
    : [];

  if (predictions.length === 0) {
    if (acError || (acStatus && acStatus !== "OK" && acStatus !== "ZERO_RESULTS")) {
      console.warn(
        `[geocode:google:autocomplete] status=${acStatus ?? "?"} error=${acError ?? "?"}`,
      );
    }
    return { results: [], status: acStatus, error: acError };
  }

  const placeIds: string[] = predictions
    .slice(0, limit)
    .map((p: any) => String(p?.place_id || ""))
    .filter(Boolean);

  // 2) Place Details -> coordinates + address_components (same shape as geocode)
  const detailResults = await Promise.all(
    placeIds.map(async (pid) => {
      const dUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(
        pid,
      )}&fields=formatted_address,name,geometry,address_components&key=${encodeURIComponent(
        apiKey,
      )}`;
      const dResp = await fetch(dUrl);
      const dData = await dResp.json().catch(() => null);
      return dData?.result ?? null;
    }),
  );

  const results = detailResults.filter(Boolean);
  return { results, status: "OK" };
}

/**
 * Geocode a free-form address/query using Ola Maps Geocoding API.
 * This is intentionally NOT backed by any static city coordinate table.
 */
export async function geocodeQuery(query: string): Promise<GeocodeResult | null> {
  const normalizedQuery = String(query || "").trim();
  if (!normalizedQuery) {
    return null;
  }

  try {
    const apiKey = getMapApiKey();
    if (!apiKey) {
      console.warn("Map API key not set, skipping external geocoding");
      return null;
    }

    const geocodingResults = await fetchGeocodeResults({ address: normalizedQuery });

    if (geocodingResults.length > 0) {
      const first = geocodingResults[0];
      const lat =
        first?.geometry?.location?.lat ?? first?.geometry?.viewport?.southwest?.lat;
      const lng =
        first?.geometry?.location?.lng ?? first?.geometry?.viewport?.southwest?.lng;

      if (lat == null || lng == null) {
        console.warn(`Ola Maps geocoding returned no coordinates for query: ${normalizedQuery}`);
        return null;
      }

      return {
        lat: Number(lat),
        lng: Number(lng),
        formattedAddress: String(first?.formatted_address ?? first?.name ?? ""),
      };
    }
  } catch (error) {
    console.error(`Error with Ola Maps geocoding for query: ${normalizedQuery}`, error);
  }

  console.warn(`Could not geocode query: ${normalizedQuery}`);
  return null;
}

export async function geocodeFullAddress(input: {
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pinCode?: string | null;
  country?: string | null;
}): Promise<GeocodeResult | null> {
  const address = String(input.address || "").trim();
  const city = String(input.city || "").trim();
  const state = String(input.state || "").trim();
  const pinCode = String(input.pinCode || "").trim();
  const country = String(input.country || "India").trim() || "India";

  const parts = [address, city, state, pinCode, country].filter(
    (p) => p && p.toLowerCase() !== "null",
  );
  const query = parts.join(", ");
  return geocodeQuery(query);
}

/**
 * Backwards-compatible helper (legacy signature).
 * Note: this does NOT use any static city coordinate cache.
 */
export async function geocodeAddress(
  city: string,
  state?: string,
): Promise<GeocodeResult | null> {
  const normalizedCity = String(city || "").trim();
  if (!normalizedCity) return null;

  const query = state
    ? `${normalizedCity}, ${String(state).trim()}, India`
    : `${normalizedCity}, India`;

  return geocodeQuery(query);
}

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers

  const toRadians = (degrees: number) => degrees * (Math.PI / 180);

  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}


export async function batchGeocode(
  locations: Array<{ city: string; state?: string }>,
  delayMs: number = 200
): Promise<Map<string, GeocodeResult>> {
  const results = new Map<string, GeocodeResult>();

  for (const location of locations) {
    const key = `${location.city}, ${location.state || ""}`.toLowerCase();
    
    if (!results.has(key)) {
      const result = await geocodeAddress(location.city, location.state);
      if (result) {
        results.set(key, result);
      }
      
      // Rate limiting delay
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  return results;
}
