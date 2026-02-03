interface GeocodeResult {
  lat: number;
  lng: number;
  formattedAddress?: string;
}

interface CityCoordinates {
  [key: string]: GeocodeResult;
}


const INDIAN_CITY_COORDINATES: CityCoordinates = {
  // Metropolitan cities
  "mumbai": { lat: 19.0760, lng: 72.8777 },
  "delhi": { lat: 28.7041, lng: 77.1025 },
  "bangalore": { lat: 12.9716, lng: 77.5946 },
  "bengaluru": { lat: 12.9716, lng: 77.5946 },
  "hyderabad": { lat: 17.3850, lng: 78.4867 },
  "chennai": { lat: 13.0827, lng: 80.2707 },
  "kolkata": { lat: 22.5726, lng: 88.3639 },
  "ahmedabad": { lat: 23.0225, lng: 72.5714 },
  "pune": { lat: 18.5204, lng: 73.8567 },
  "surat": { lat: 21.1702, lng: 72.8311 },
  
  // Tier 2 cities
  "jaipur": { lat: 26.9124, lng: 75.7873 },
  "lucknow": { lat: 26.8467, lng: 80.9462 },
  "kanpur": { lat: 26.4499, lng: 80.3319 },
  "nagpur": { lat: 21.1458, lng: 79.0882 },
  "indore": { lat: 22.7196, lng: 75.8577 },
  "thane": { lat: 19.2183, lng: 72.9781 },
  "bhopal": { lat: 23.2599, lng: 77.4126 },
  "visakhapatnam": { lat: 17.6868, lng: 83.2185 },
  "pimpri-chinchwad": { lat: 18.6298, lng: 73.7997 },
  "patna": { lat: 25.5941, lng: 85.1376 },
  "vadodara": { lat: 22.3072, lng: 73.1812 },
  "ghaziabad": { lat: 28.6692, lng: 77.4538 },
  "ludhiana": { lat: 30.9010, lng: 75.8573 },
  "agra": { lat: 27.1767, lng: 78.0081 },
  "nashik": { lat: 19.9975, lng: 73.7898 },
  "faridabad": { lat: 28.4089, lng: 77.3178 },
  "meerut": { lat: 28.9845, lng: 77.7064 },
  "rajkot": { lat: 22.3039, lng: 70.8022 },
  "kalyan-dombivali": { lat: 19.2403, lng: 73.1305 },
  "vasai-virar": { lat: 19.4612, lng: 72.7988 },
  "varanasi": { lat: 25.3176, lng: 82.9739 },
  "srinagar": { lat: 34.0837, lng: 74.7973 },
  "aurangabad": { lat: 19.8762, lng: 75.3433 },
  "dhanbad": { lat: 23.7957, lng: 86.4304 },
  "amritsar": { lat: 31.6340, lng: 74.8723 },
  "navi mumbai": { lat: 19.0330, lng: 73.0297 },
  "allahabad": { lat: 25.4358, lng: 81.8463 },
  "prayagraj": { lat: 25.4358, lng: 81.8463 },
  "ranchi": { lat: 23.3441, lng: 85.3096 },
  "howrah": { lat: 22.5958, lng: 88.2636 },
  "coimbatore": { lat: 11.0168, lng: 76.9558 },
  "jabalpur": { lat: 23.1815, lng: 79.9864 },
  "gwalior": { lat: 26.2183, lng: 78.1828 },
  "vijayawada": { lat: 16.5062, lng: 80.6480 },
  "jodhpur": { lat: 26.2389, lng: 73.0243 },
  "madurai": { lat: 9.9252, lng: 78.1198 },
  "raipur": { lat: 21.2514, lng: 81.6296 },
  "kota": { lat: 25.2138, lng: 75.8648 },
  "chandigarh": { lat: 30.7333, lng: 76.7794 },
  "guwahati": { lat: 26.1445, lng: 91.7362 },
  "goa": { lat: 15.2993, lng: 74.1240 },
  "panaji": { lat: 15.4909, lng: 73.8278 },
  "mysore": { lat: 12.2958, lng: 76.6394 },
  "mysuru": { lat: 12.2958, lng: 76.6394 },
  "bhubaneswar": { lat: 20.2961, lng: 85.8245 },
  "dehradun": { lat: 30.3165, lng: 78.0322 },
  "kochi": { lat: 9.9312, lng: 76.2673 },
  "cochin": { lat: 9.9312, lng: 76.2673 },
  "thiruvananthapuram": { lat: 8.5241, lng: 76.9366 },
  "trivandrum": { lat: 8.5241, lng: 76.9366 },
};

/**
 * Geocode an address using Google Maps Geocoding API
 * Falls back to local database if API fails
 */
export async function geocodeAddress(
  city: string,
  state?: string
): Promise<GeocodeResult | null> {
  if (!city) {
    return null;
  }

  const normalizedCity = city.toLowerCase().trim();

  if (INDIAN_CITY_COORDINATES[normalizedCity]) {
    console.log(`✅ Using cached coordinates for ${city}`);
    return INDIAN_CITY_COORDINATES[normalizedCity];
  }

  if (process.env.GOOGLE_MAPS_API_KEY) {
    try {
      const address = state ? `${city}, ${state}, India` : `${city}, India`;
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=${process.env.GOOGLE_MAPS_API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "OK" && data.results[0]) {
        const location = data.results[0].geometry.location;
        console.log(`✅ Geocoded ${city} via Google Maps API`);
        return {
          lat: location.lat,
          lng: location.lng,
          formattedAddress: data.results[0].formatted_address,
        };
      } else {
        console.warn(`⚠️ Google Maps geocoding failed for ${city}: ${data.status}`);
      }
    } catch (error) {
      console.error(`❌ Error geocoding ${city}:`, error);
    }
  }

  try {
    const address = state ? `${city}, ${state}, India` : `${city}, India`;
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      address
    )}&format=json&limit=1`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "AndAction-App/1.0", // Required by Nominatim
      },
    });

    const data = await response.json();

    if (data && data.length > 0) {
      console.log(`✅ Geocoded ${city} via Nominatim`);
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        formattedAddress: data[0].display_name,
      };
    }
  } catch (error) {
    console.error(`❌ Error with Nominatim geocoding for ${city}:`, error);
  }

  // No results from any service
  console.warn(`⚠️ Could not geocode ${city}`);
  return null;
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

export function getCachedCityCoordinates(city: string): GeocodeResult | null {
  const normalizedCity = city.toLowerCase().trim();
  return INDIAN_CITY_COORDINATES[normalizedCity] || null;
}
