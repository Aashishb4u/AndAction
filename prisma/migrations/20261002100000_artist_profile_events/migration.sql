ALTER TABLE "artists" ADD COLUMN IF NOT EXISTS "analyticsReportFrequency" TEXT NOT NULL DEFAULT 'weekly';

CREATE TABLE IF NOT EXISTS "artist_profile_events" (
    "id" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "userId" TEXT,
    "visitorKey" TEXT,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "artist_profile_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "artist_profile_events_artistId_type_createdAt_idx" ON "artist_profile_events"("artistId", "type", "createdAt");
CREATE INDEX IF NOT EXISTS "artist_profile_events_userId_idx" ON "artist_profile_events"("userId");

DO $$ BEGIN
  ALTER TABLE "artist_profile_events" ADD CONSTRAINT "artist_profile_events_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "artists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "artist_profile_events" ADD CONSTRAINT "artist_profile_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
