ALTER TABLE "artists"
ADD COLUMN IF NOT EXISTS "profileOrder" INTEGER NOT NULL DEFAULT 0;

DROP INDEX IF EXISTS "artists_userId_key";

CREATE UNIQUE INDEX IF NOT EXISTS "artists_userId_profileOrder_key"
ON "artists" ("userId", "profileOrder");
