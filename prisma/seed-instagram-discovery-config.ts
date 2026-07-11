import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { DISCOVERY_TITLE_VALUES } from "@/lib/artistCategories";

const prisma = new PrismaClient();
const INSTAGRAM_DISCOVERY_CONFIG_ID = "default";
const DEFAULT_GRAPH_VERSION = "v24.0";

function extractCategoryTitleFromDiscoveryQuery(query?: string | null) {
  const normalizedQuery = query?.trim();
  if (!normalizedQuery) return null;

  const strictMatch = normalizedQuery.match(
    /^site:instagram\.com\s+"Instagram photos and videos"\s+"([^"]+)"$/i,
  );

  if (strictMatch?.[1]) {
    return strictMatch[1].trim();
  }

  const quotedParts = Array.from(normalizedQuery.matchAll(/"([^"]+)"/g))
    .map((match) => match[1]?.trim())
    .filter((value): value is string => Boolean(value));

  return quotedParts.at(-1) || null;
}

function parseCategoryTitleList(value?: string) {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  const titles = trimmed
    .split("||")
    .map((title) => title.trim())
    .filter(Boolean);

  return titles.length > 0 ? titles : null;
}

function parseCategoryTitlesFromLegacyQueryEnv() {
  const multiQueryTitles = parseCategoryTitleList(
    process.env.PROSPECT_DISCOVERY_QUERIES
      ?.split("||")
      .map((query) => extractCategoryTitleFromDiscoveryQuery(query) || "")
      .filter(Boolean)
      .join("||"),
  );

  if (multiQueryTitles && multiQueryTitles.length > 0) {
    return multiQueryTitles;
  }

  const singleTitle = extractCategoryTitleFromDiscoveryQuery(
    process.env.PROSPECT_DISCOVERY_QUERY,
  );

  return singleTitle ? [singleTitle] : null;
}

function optionalInt(name: string) {
  const raw = process.env[name]?.trim();
  if (!raw) return null;

  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid integer env: ${name}`);
  }

  return Math.floor(parsed);
}

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }

  return value;
}

function optionalEnv(name: string) {
  const value = process.env[name]?.trim();
  return value || null;
}

function maskToken(token: string) {
  if (token.length <= 14) return token;
  return `${token.slice(0, 8)}...${token.slice(-6)}`;
}

async function main() {
  const appId = requiredEnv("META_APP_ID");
  const appSecret = requiredEnv("META_APP_SECRET");
  const businessAccountId = requiredEnv("INSTAGRAM_BUSINESS_ACCOUNT_ID");
  const accessToken = requiredEnv("INSTAGRAM_GRAPH_ACCESS_TOKEN");
  const graphVersion =
    process.env.INSTAGRAM_GRAPH_VERSION?.trim() || DEFAULT_GRAPH_VERSION;
  const prospectDiscoveryCategoryTitles =
    parseCategoryTitleList(process.env.PROSPECT_DISCOVERY_CATEGORY_TITLES) ||
    parseCategoryTitleList(process.env.PROSPECT_DISCOVERY_CATEGORY_TITLE) ||
    parseCategoryTitlesFromLegacyQueryEnv() ||
    [...DISCOVERY_TITLE_VALUES];
  const prospectDiscoveryCity = optionalEnv("PROSPECT_DISCOVERY_CITY");
  const prospectDiscoveryState = optionalEnv("PROSPECT_DISCOVERY_STATE");
  const prospectDiscoveryCountry =
    optionalEnv("PROSPECT_DISCOVERY_COUNTRY");
  const prospectDiscoveryGoogleDomain =
    process.env.PROSPECT_DISCOVERY_GOOGLE_DOMAIN?.trim() || null;
  const prospectDiscoveryHl = process.env.PROSPECT_DISCOVERY_HL?.trim() || null;
  const prospectDiscoveryGl = process.env.PROSPECT_DISCOVERY_GL?.trim() || null;
  const prospectDiscoveryMaxResults = optionalInt(
    "PROSPECT_DISCOVERY_MAX_RESULTS",
  );
  const prospectDiscoveryMediaLimit = optionalInt(
    "PROSPECT_DISCOVERY_MEDIA_LIMIT",
  );
  const prospectDiscoveryRequestDelayMs = optionalInt(
    "PROSPECT_DISCOVERY_REQUEST_DELAY_MS",
  );
  const prospectDiscoveryStartIncrement = optionalInt(
    "PROSPECT_DISCOVERY_START_INCREMENT",
  );
  const prospectDiscoveryPagesPerQuery = optionalInt(
    "PROSPECT_DISCOVERY_PAGES_PER_QUERY",
  );

  const record = await prisma.instagramDiscoveryConfig.upsert({
    where: { id: INSTAGRAM_DISCOVERY_CONFIG_ID },
    create: {
      id: INSTAGRAM_DISCOVERY_CONFIG_ID,
      appId,
      appSecret,
      graphVersion,
      businessAccountId,
      accessToken,
      lastError: null,
      prospectDiscoveryQueries: prospectDiscoveryCategoryTitles ?? undefined,
      prospectDiscoveryCity,
      prospectDiscoveryState,
      prospectDiscoveryCountry,
      prospectDiscoveryGoogleDomain,
      prospectDiscoveryHl,
      prospectDiscoveryGl,
      prospectDiscoveryMaxResults,
      prospectDiscoveryMediaLimit,
      prospectDiscoveryRequestDelayMs,
      prospectDiscoveryStartIncrement,
      prospectDiscoveryPagesPerQuery,
      prospectDiscoveryCurrentQueryIndex: 0,
      prospectDiscoveryCurrentStart: 0,
    },
    update: {
      appId,
      appSecret,
      graphVersion,
      businessAccountId,
      accessToken,
      lastError: null,
      ...(prospectDiscoveryCategoryTitles
        ? { prospectDiscoveryQueries: prospectDiscoveryCategoryTitles }
        : {}),
      ...(prospectDiscoveryCity ? { prospectDiscoveryCity } : {}),
      ...(prospectDiscoveryState ? { prospectDiscoveryState } : {}),
      ...(prospectDiscoveryCountry
        ? { prospectDiscoveryCountry }
        : {}),
      ...(prospectDiscoveryGoogleDomain
        ? { prospectDiscoveryGoogleDomain }
        : {}),
      ...(prospectDiscoveryHl ? { prospectDiscoveryHl } : {}),
      ...(prospectDiscoveryGl ? { prospectDiscoveryGl } : {}),
      ...(prospectDiscoveryMaxResults !== null
        ? { prospectDiscoveryMaxResults }
        : {}),
      ...(prospectDiscoveryMediaLimit !== null
        ? { prospectDiscoveryMediaLimit }
        : {}),
      ...(prospectDiscoveryRequestDelayMs !== null
        ? { prospectDiscoveryRequestDelayMs }
        : {}),
      ...(prospectDiscoveryStartIncrement !== null
        ? { prospectDiscoveryStartIncrement }
        : {}),
      ...(prospectDiscoveryPagesPerQuery !== null
        ? { prospectDiscoveryPagesPerQuery }
        : {}),
    },
  });

  console.log("Instagram discovery config seeded successfully");
  console.log({
    id: record.id,
    graphVersion: record.graphVersion,
    businessAccountId: record.businessAccountId,
    accessToken: maskToken(record.accessToken || ""),
    prospectDiscoveryCategoryTitles: record.prospectDiscoveryQueries,
    prospectDiscoveryCurrentQueryIndex:
      record.prospectDiscoveryCurrentQueryIndex,
    prospectDiscoveryCurrentStart: record.prospectDiscoveryCurrentStart,
  });
}

main()
  .catch((error) => {
    console.error("Failed to seed Instagram discovery config:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
