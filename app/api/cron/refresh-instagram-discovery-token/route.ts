import { NextRequest, NextResponse } from "next/server";
import {
  getInstagramDiscoveryConfig,
  refreshInstagramDiscoveryAccessToken,
} from "@/lib/instagram-discovery-config";

async function handleRefresh(request: NextRequest, force = true) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  const bearerMatch = authHeader?.match(/^Bearer\s+(.+)$/i);
  const headerToken = bearerMatch?.[1] ?? null;
  const queryToken =
    request.nextUrl.searchParams.get("token") ||
    request.nextUrl.searchParams.get("secret");
  const providedSecret =
    headerToken || request.headers.get("x-cron-secret") || queryToken;

  if (cronSecret && providedSecret !== cronSecret) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const before = await getInstagramDiscoveryConfig();
  const result = await refreshInstagramDiscoveryAccessToken({ force });
  const after = await getInstagramDiscoveryConfig();

  return NextResponse.json({
    success: true,
    refreshed: result.refreshed,
    tokenExpiresAt: result.tokenExpiresAt,
    businessAccountId: after?.businessAccountId,
    lastRefreshedAt: after?.lastRefreshedAt,
    previousTokenPreview: before?.accessToken
      ? `${before.accessToken.slice(0, 8)}...${before.accessToken.slice(-6)}`
      : null,
    currentTokenPreview: result.accessToken
      ? `${result.accessToken.slice(0, 8)}...${result.accessToken.slice(-6)}`
      : null,
  });
}

export async function GET(request: NextRequest) {
  try {
    const force = request.nextUrl.searchParams.get("force") !== "false";
    return await handleRefresh(request, force);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to refresh Instagram discovery token",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const force = body?.force !== false;
    return await handleRefresh(request, force);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to refresh Instagram discovery token",
      },
      { status: 500 },
    );
  }
}
