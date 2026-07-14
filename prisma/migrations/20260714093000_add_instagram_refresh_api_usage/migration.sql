CREATE TABLE "instagram_refresh_api_usage" (
    "id" TEXT NOT NULL,
    "windowStartedAt" TIMESTAMP(3) NOT NULL,
    "windowEndsAt" TIMESTAMP(3) NOT NULL,
    "apiCallsCount" INTEGER NOT NULL DEFAULT 0,
    "rateLimitHits" INTEGER NOT NULL DEFAULT 0,
    "lastRateLimitedAt" TIMESTAMP(3),
    "blockedUntil" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instagram_refresh_api_usage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "instagram_refresh_api_usage_windowStartedAt_key"
ON "instagram_refresh_api_usage"("windowStartedAt");

CREATE INDEX "instagram_refresh_api_usage_windowStartedAt_idx"
ON "instagram_refresh_api_usage"("windowStartedAt");

CREATE INDEX "instagram_refresh_api_usage_blockedUntil_idx"
ON "instagram_refresh_api_usage"("blockedUntil");
