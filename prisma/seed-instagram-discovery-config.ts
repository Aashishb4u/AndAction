import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const INSTAGRAM_DISCOVERY_CONFIG_ID = "default";
const DEFAULT_GRAPH_VERSION = "v24.0";

function parseQueryList(value?: string) {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  const queries = trimmed
    .split("||")
    .map((query) => query.trim())
    .filter(Boolean);

  return queries.length > 0 ? queries : null;
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
  const prospectDiscoveryQueries =
    parseQueryList(process.env.PROSPECT_DISCOVERY_QUERIES) ||
    parseQueryList(process.env.PROSPECT_DISCOVERY_QUERY);
  const prospectDiscoveryLocation =
    process.env.PROSPECT_DISCOVERY_LOCATION?.trim() || null;
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
      prospectDiscoveryQueries,
      prospectDiscoveryLocation,
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
      ...(prospectDiscoveryQueries
        ? { prospectDiscoveryQueries }
        : {}),
      ...(prospectDiscoveryLocation
        ? { prospectDiscoveryLocation }
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
    prospectDiscoveryQueries: record.prospectDiscoveryQueries,
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
