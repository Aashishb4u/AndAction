CREATE TABLE "instagram_discovery_configs" (
    "id" TEXT NOT NULL,
    "appId" TEXT,
    "appSecret" TEXT,
    "graphVersion" TEXT,
    "businessAccountId" TEXT,
    "accessToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "lastRefreshedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instagram_discovery_configs_pkey" PRIMARY KEY ("id")
);
