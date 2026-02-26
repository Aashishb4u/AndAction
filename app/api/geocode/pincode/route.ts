import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";

/**
 * GET /api/geocode/pincode?pin=<pincode>
 * Fetches location details (city, district, state) from Indian PIN code
 * Uses India Post API for accurate location data
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

    // Try India Post API first
    try {
      const indiaPostUrl = `https://api.postalpincode.in/pincode/${pincode}`;
      const response = await fetch(indiaPostUrl);
      const data = await response.json();

      if (
        data &&
        data[0] &&
        data[0].Status === "Success" &&
        data[0].PostOffice &&
        data[0].PostOffice.length > 0
      ) {
        const postOffice = data[0].PostOffice[0];
        
        return successResponse(
          {
            pincode: pincode,
            city: postOffice.District || postOffice.Block || "",
            district: postOffice.District || "",
            state: postOffice.State || "",
            country: postOffice.Country || "India",
            region: postOffice.Region || "",
            division: postOffice.Division || "",
            postOffice: postOffice.Name || "",
          },
          "Location fetched successfully",
          200
        );
      }
    } catch (apiError) {
      console.error("India Post API error:", apiError);
    }

    // If India Post API fails, try alternate API
    try {
      const alternateUrl = `https://api.data.gov.in/resource/5c2f62fe-5afa-4119-a499-fec9d604d5bd?api-key=579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b&format=json&filters[pincode]=${pincode}`;
      const response = await fetch(alternateUrl);
      const data = await response.json();

      if (data && data.records && data.records.length > 0) {
        const record = data.records[0];
        
        return successResponse(
          {
            pincode: pincode,
            city: record.districtname || record.Taluk || "",
            district: record.districtname || "",
            state: record.statename || "",
            country: "India",
            region: record.regionname || "",
            postOffice: record.officename || "",
          },
          "Location fetched successfully",
          200
        );
      }
    } catch (apiError) {
      console.error("Alternate API error:", apiError);
    }

    // If both APIs fail, return error
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
