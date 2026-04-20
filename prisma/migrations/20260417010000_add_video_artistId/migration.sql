ALTER TABLE "videos"
ADD COLUMN IF NOT EXISTS "artistId" TEXT;

CREATE INDEX IF NOT EXISTS "videos_artistId_idx" ON "videos"("artistId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'videos_artistId_fkey'
      AND table_name = 'videos'
  ) THEN
    ALTER TABLE "videos"
    ADD CONSTRAINT "videos_artistId_fkey"
    FOREIGN KEY ("artistId") REFERENCES "artists"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

UPDATE "videos" v
SET "artistId" = a."id"
FROM "artists" a
WHERE a."userId" = v."userId"
  AND a."profileOrder" = 0
  AND v."artistId" IS NULL;

