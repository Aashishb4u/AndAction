CREATE TABLE "prospects" (
    "id" TEXT NOT NULL,
    "stageName" TEXT,
    "artistType" TEXT,
    "subArtistType" TEXT,
    "achievements" TEXT,
    "yearsOfExperience" INTEGER,
    "shortBio" TEXT,
    "biography" TEXT,
    "performingLanguage" TEXT,
    "performingEventType" TEXT,
    "performingStates" TEXT,
    "performingDurationFrom" TEXT,
    "performingDurationTo" TEXT,
    "performingMembers" TEXT,
    "offStageMembers" TEXT,
    "contactNumber" TEXT,
    "whatsappNumber" TEXT,
    "contactEmail" TEXT,
    "countryCode" TEXT,
    "soloChargesFrom" DECIMAL(10,2),
    "soloChargesTo" DECIMAL(10,2),
    "soloChargesDescription" TEXT,
    "chargesWithBacklineFrom" DECIMAL(10,2),
    "chargesWithBacklineTo" DECIMAL(10,2),
    "chargesWithBacklineDescription" TEXT,
    "instagramId" TEXT,
    "instagramUsername" TEXT,
    "profileImage" TEXT,
    "website" TEXT,
    "followersCount" INTEGER,
    "followsCount" INTEGER,
    "mediaCount" INTEGER,
    "source" TEXT NOT NULL DEFAULT 'serpapi_instagram_discovery',
    "sourceQuery" TEXT,
    "sourceTitle" TEXT,
    "sourceSnippet" TEXT,
    "sourceLink" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastEnrichedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "convertedUserId" TEXT,
    "convertedArtistId" TEXT,
    "acceptedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prospects_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "prospects_instagramId_key" ON "prospects"("instagramId");
CREATE UNIQUE INDEX "prospects_instagramUsername_key" ON "prospects"("instagramUsername");
CREATE UNIQUE INDEX "prospects_convertedUserId_key" ON "prospects"("convertedUserId");
CREATE UNIQUE INDEX "prospects_convertedArtistId_key" ON "prospects"("convertedArtistId");
CREATE INDEX "prospects_status_idx" ON "prospects"("status");
CREATE INDEX "prospects_instagramUsername_idx" ON "prospects"("instagramUsername");
CREATE INDEX "prospects_discoveredAt_idx" ON "prospects"("discoveredAt");

ALTER TABLE "prospects"
ADD CONSTRAINT "prospects_acceptedByUserId_fkey"
FOREIGN KEY ("acceptedByUserId") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "prospects"
ADD CONSTRAINT "prospects_convertedUserId_fkey"
FOREIGN KEY ("convertedUserId") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "prospects"
ADD CONSTRAINT "prospects_convertedArtistId_fkey"
FOREIGN KEY ("convertedArtistId") REFERENCES "artists"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
