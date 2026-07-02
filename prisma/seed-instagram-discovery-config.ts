import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const INSTAGRAM_DISCOVERY_CONFIG_ID = "default";
const DEFAULT_GRAPH_VERSION = "v24.0";

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
    },
    update: {
      appId,
      appSecret,
      graphVersion,
      businessAccountId,
      accessToken,
      lastError: null,
    },
  });

  console.log("Instagram discovery config seeded successfully");
  console.log({
    id: record.id,
    graphVersion: record.graphVersion,
    businessAccountId: record.businessAccountId,
    accessToken: maskToken(record.accessToken || ""),
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
