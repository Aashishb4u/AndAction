ALTER TABLE "instagram_discovery_configs"
ADD COLUMN "prospectDiscoveryLocations" JSONB,
ADD COLUMN "prospectDiscoveryCurrentLocationIndex" INTEGER;

UPDATE "instagram_discovery_configs"
SET
  "prospectDiscoveryLocations" = CASE
    WHEN "prospectDiscoveryCity" IS NOT NULL
      OR "prospectDiscoveryState" IS NOT NULL
      OR "prospectDiscoveryCountry" IS NOT NULL
    THEN jsonb_build_array(
      jsonb_build_object(
        'city', "prospectDiscoveryCity",
        'state', "prospectDiscoveryState",
        'country', "prospectDiscoveryCountry"
      )
    )
    ELSE NULL
  END,
  "prospectDiscoveryCurrentLocationIndex" = 0
WHERE "prospectDiscoveryCurrentLocationIndex" IS NULL;
