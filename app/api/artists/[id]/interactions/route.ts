import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { ApiErrors, successResponse } from "@/lib/api-response";
import {
  ANALYTICS_EVENT_TYPES,
  AnalyticsEventType,
  recordArtistEvent,
} from "@/lib/artist-analytics";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    const type = body?.type as AnalyticsEventType;
    if (!ANALYTICS_EVENT_TYPES.includes(type)) {
      return ApiErrors.badRequest("Invalid event type");
    }

    const session = await auth();
    const event = await recordArtistEvent({
      artistId: id,
      type,
      userId: session?.user?.id ?? null,
      visitorKey: typeof body?.visitorKey === "string" ? body.visitorKey.slice(0, 80) : null,
    });

    if (!event) return ApiErrors.notFound("Artist not found");
    return successResponse({ id: event.id }, "Event recorded", 201);
  } catch (error) {
    console.error("POST artist interaction error:", error);
    return ApiErrors.internalError("Could not record event");
  }
}
