ALTER TABLE "artists"
ADD COLUMN "instagramMediaLastRefreshedAt" TIMESTAMP(3),
ADD COLUMN "instagramMediaLastRefreshAttemptAt" TIMESTAMP(3),
ADD COLUMN "instagramMediaLastRefreshError" TEXT;

CREATE INDEX "artists_instagramMediaLastRefreshedAt_idx"
ON "artists"("instagramMediaLastRefreshedAt");

CREATE INDEX "artists_instagramMediaLastRefreshAttemptAt_idx"
ON "artists"("instagramMediaLastRefreshAttemptAt");
