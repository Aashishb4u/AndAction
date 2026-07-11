ALTER TABLE "instagram_discovery_configs"
ADD COLUMN "prospectDiscoveryQueries" JSONB,
ADD COLUMN "prospectDiscoveryLocation" TEXT,
ADD COLUMN "prospectDiscoveryGoogleDomain" TEXT,
ADD COLUMN "prospectDiscoveryHl" TEXT,
ADD COLUMN "prospectDiscoveryGl" TEXT,
ADD COLUMN "prospectDiscoveryMaxResults" INTEGER,
ADD COLUMN "prospectDiscoveryMediaLimit" INTEGER,
ADD COLUMN "prospectDiscoveryRequestDelayMs" INTEGER,
ADD COLUMN "prospectDiscoveryStartIncrement" INTEGER,
ADD COLUMN "prospectDiscoveryPagesPerQuery" INTEGER,
ADD COLUMN "prospectDiscoveryCurrentQueryIndex" INTEGER,
ADD COLUMN "prospectDiscoveryCurrentStart" INTEGER,
ADD COLUMN "prospectDiscoveryLastCursorUpdatedAt" TIMESTAMP(3);
