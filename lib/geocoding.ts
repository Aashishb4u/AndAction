interface GeocodeResult {
  lat: number;
  lng: number;
  formattedAddress?: string;
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
    const apiKey = process.env.OLA_MAPS_API_KEY;
    if (!apiKey) {
      console.warn("OLA_MAPS_API_KEY not set, skipping external geocoding");
      return null;
    }

    const url = `https://api.olamaps.io/places/v1/geocode?address=${encodeURIComponent(normalizedQuery)}`;

    const response = await fetch(url, {
      headers: {
        "X-API-Key": apiKey,
      },
    });

    const data = await response.json().catch(() => null);
    const geocodingResults = Array.isArray(data?.geocodingResults)
      ? data.geocodingResults
      : [];

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
