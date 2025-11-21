import { ApiErrors, successResponse } from "@/lib/api-response";
import prisma from "@/lib/prisma";
import { startOfDay } from "date-fns";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET route to fetch all bookings for a given artist
 * where the status is APPROVED.
 *
 * Query Params:
 *  - artistId (required)
 *
 * Returns:
 *  - List of bookings for the artist where the status is:
 *      APPROVED
 *    (these are used to disable booked dates in the calendar)
 */
export async function GET(request: NextRequest): Promise<NextResponse<any>> {
  try {
    // Parse query params
    const url = new URL(request.url);
    const artistId = url.searchParams.get("artistId");

    // artistId is REQUIRED
    if (!artistId) {
      return ApiErrors.badRequest("Missing required query parameter: artistId");
    }
    const todayStart = startOfDay(new Date());
    // Fetch bookings whose status is APPROVED (these dates must be disabled)
    const bookings = await prisma.booking.findMany({
      where: {
        artistId,
        eventDate: {
          gte: todayStart,
        },
        status: "APPROVED",
      },
      orderBy: { eventDate: "asc" },
      select: {
        id: true,
        eventDate: true,
        eventType: true,
        status: true,
        notes: true,
        createdAt: true,
        eventLocation: true,
      },
    });

    return successResponse(
      { bookings },
      "Approved bookings fetched successfully",
      200
    );
  } catch (error) {
    console.error("GET Approved Artist Bookings Error:", error);
    return ApiErrors.internalError(
      "An error occurred while fetching approved bookings."
    );
  }
}
