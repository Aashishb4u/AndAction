ALTER TABLE "artists"
ADD COLUMN "instagramRefreshNextRunAt" TIMESTAMP(3);

UPDATE "artists"
SET "instagramRefreshNextRunAt" = COALESCE("instagramConnectedAt", "createdAt") + INTERVAL '22 hours'
WHERE "instagramId" IS NOT NULL
  AND "instagramUsername" IS NOT NULL
  AND "instagramRefreshNextRunAt" IS NULL;
