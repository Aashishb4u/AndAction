ALTER TABLE "artists"
ADD COLUMN IF NOT EXISTS "profileOrder" INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS "artists_userId_profileOrder_key"
ON "artists" ("userId", "profileOrder");
