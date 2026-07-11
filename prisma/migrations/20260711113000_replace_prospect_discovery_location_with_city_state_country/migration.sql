ALTER TABLE "instagram_discovery_configs"
ADD COLUMN "prospectDiscoveryCity" TEXT,
ADD COLUMN "prospectDiscoveryState" TEXT,
ADD COLUMN "prospectDiscoveryCountry" TEXT;

UPDATE "instagram_discovery_configs"
SET
  "prospectDiscoveryCity" = CASE
    WHEN "prospectDiscoveryLocation" IS NULL THEN NULL
    WHEN "prospectDiscoveryLocation" LIKE '%,%' THEN NULLIF(
      BTRIM(REPLACE(split_part("prospectDiscoveryLocation", ',', 1), '+', ' ')),
      ''
    )
    ELSE NULL
  END,
  "prospectDiscoveryState" = CASE
    WHEN "prospectDiscoveryLocation" IS NULL THEN NULL
    WHEN "prospectDiscoveryLocation" LIKE '%,%' THEN NULLIF(
      BTRIM(REPLACE(split_part("prospectDiscoveryLocation", ',', 2), '+', ' ')),
      ''
    )
    ELSE NULL
  END,
  "prospectDiscoveryCountry" = CASE
    WHEN "prospectDiscoveryLocation" IS NULL THEN NULL
    WHEN "prospectDiscoveryLocation" LIKE '%,%' THEN NULLIF(
      BTRIM(REPLACE(split_part("prospectDiscoveryLocation", ',', 3), '+', ' ')),
      ''
    )
    ELSE NULLIF(BTRIM("prospectDiscoveryLocation"), '')
  END;

ALTER TABLE "instagram_discovery_configs"
DROP COLUMN "prospectDiscoveryLocation";
