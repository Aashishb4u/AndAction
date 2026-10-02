import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ApiErrors, successResponse } from "@/lib/api-response";
import {
  ANALYTICS_EVENT_TYPES,
  AnalyticsEventType,
  AnalyticsRange,
  formatAnalyticsReport,
  getArtistAnalytics,
} from "@/lib/artist-analytics";

const RANGES: AnalyticsRange[] = ["today", "week", "month", "custom"];

async function ownedArtist(userId: string, artistId: string | null) {
  const artists = await prisma.artist.findMany({
    where: { userId },
    select: { id: true, analyticsReportFrequency: true, whatsappNumber: true, stageName: true },
    orderBy: { profileOrder: "asc" },
  });
  if (!artists.length) return null;
  if (!artistId) return artists[0];
  return artists.find((artist) => artist.id === artistId) ?? null;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) return ApiErrors.unauthorized();

    const { searchParams } = new URL(request.url);
    const artist = await ownedArtist(session.user.id, searchParams.get("artistId"));
    if (!artist) return ApiErrors.forbidden();

    const rangeParam = searchParams.get("range") as AnalyticsRange;
    const range = RANGES.includes(rangeParam) ? rangeParam : "month";
    const typeParam = searchParams.get("type") as AnalyticsEventType | null;
    const type = typeParam && ANALYTICS_EVENT_TYPES.includes(typeParam) ? typeParam : null;
    const audienceParam = searchParams.get("audience");
    const audience = audienceParam === "platform" || audienceParam === "visitor" ? audienceParam : null;

    const analytics = await getArtistAnalytics({
      artistId: artist.id,
      range,
      from: searchParams.get("from"),
      to: searchParams.get("to"),
      type,
      audience,
      page: Number(searchParams.get("page") || 1),
    });

    return successResponse({
      artistId: artist.id,
      frequency: artist.analyticsReportFrequency,
      report: formatAnalyticsReport(analytics.counts),
      ...analytics,
    });
  } catch (error) {
    console.error("GET artist analytics error:", error);
    return ApiErrors.internalError("Could not load analytics");
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) return ApiErrors.unauthorized();
    const body = await request.json().catch(() => null);
    const frequency = body?.frequency;
    if (frequency !== "weekly" && frequency !== "monthly") {
      return ApiErrors.badRequest("Frequency must be weekly or monthly");
    }
    const artist = await ownedArtist(session.user.id, body?.artistId ?? null);
    if (!artist) return ApiErrors.forbidden();

    await prisma.artist.update({
      where: { id: artist.id },
      data: { analyticsReportFrequency: frequency },
    });
    return successResponse({ frequency });
  } catch (error) {
    console.error("PATCH artist analytics frequency error:", error);
    return ApiErrors.internalError("Could not update report frequency");
  }
}
