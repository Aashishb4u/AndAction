import { prisma } from "@/lib/prisma";

const INSTAGRAM_DISCOVERY_CONFIG_ID = "default";
const DEFAULT_GRAPH_VERSION = "v24.0";
const REFRESH_WINDOW_MS = 5 * 24 * 60 * 60 * 1000;

export interface InstagramDiscoveryRuntimeConfig {
  appId: string | null;
  appSecret: string | null;
  graphVersion: string;
  businessAccountId: string | null;
  accessToken: string | null;
  tokenExpiresAt: Date | null;
  lastRefreshedAt: Date | null;
  lastError: string | null;
}

function normalizeValue(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function getInstagramDiscoveryConfig(): Promise<InstagramDiscoveryRuntimeConfig | null> {
  const dbConfig = await prisma.instagramDiscoveryConfig.findUnique({
    where: { id: INSTAGRAM_DISCOVERY_CONFIG_ID },
  });

  const businessAccountId = dbConfig?.businessAccountId || null;
  const accessToken = dbConfig?.accessToken || null;

  if (!businessAccountId || !accessToken) {
    return null;
  }

  return {
    appId: dbConfig?.appId || null,
    appSecret: dbConfig?.appSecret || null,
    graphVersion: dbConfig?.graphVersion || DEFAULT_GRAPH_VERSION,
    businessAccountId,
    accessToken,
    tokenExpiresAt: dbConfig?.tokenExpiresAt || null,
    lastRefreshedAt: dbConfig?.lastRefreshedAt || null,
    lastError: dbConfig?.lastError || null,
  };
}

export async function isInstagramDiscoveryConfigured(): Promise<boolean> {
  const config = await getInstagramDiscoveryConfig();
  return Boolean(config?.businessAccountId && config?.accessToken);
}

function isTokenExpiringSoon(tokenExpiresAt: Date | null) {
  if (!tokenExpiresAt) return false;
  return tokenExpiresAt.getTime() <= Date.now() + REFRESH_WINDOW_MS;
}

export async function saveInstagramDiscoveryConfig(input: {
  appId?: string | null;
  appSecret?: string | null;
  graphVersion?: string | null;
  businessAccountId?: string | null;
  accessToken?: string | null;
  tokenExpiresAt?: Date | null;
  lastRefreshedAt?: Date | null;
  lastError?: string | null;
}) {
  return prisma.instagramDiscoveryConfig.upsert({
    where: { id: INSTAGRAM_DISCOVERY_CONFIG_ID },
    create: {
      id: INSTAGRAM_DISCOVERY_CONFIG_ID,
      appId: normalizeValue(input.appId),
      appSecret: normalizeValue(input.appSecret),
      graphVersion: normalizeValue(input.graphVersion) || DEFAULT_GRAPH_VERSION,
      businessAccountId: normalizeValue(input.businessAccountId),
      accessToken: normalizeValue(input.accessToken),
      tokenExpiresAt: input.tokenExpiresAt ?? null,
      lastRefreshedAt: input.lastRefreshedAt ?? null,
      lastError: input.lastError ?? null,
    },
    update: {
      ...(input.appId !== undefined ? { appId: normalizeValue(input.appId) } : {}),
      ...(input.appSecret !== undefined
        ? { appSecret: normalizeValue(input.appSecret) }
        : {}),
      ...(input.graphVersion !== undefined
        ? {
            graphVersion:
              normalizeValue(input.graphVersion) || DEFAULT_GRAPH_VERSION,
          }
        : {}),
      ...(input.businessAccountId !== undefined
        ? { businessAccountId: normalizeValue(input.businessAccountId) }
        : {}),
      ...(input.accessToken !== undefined
        ? { accessToken: normalizeValue(input.accessToken) }
        : {}),
      ...(input.tokenExpiresAt !== undefined
        ? { tokenExpiresAt: input.tokenExpiresAt }
        : {}),
      ...(input.lastRefreshedAt !== undefined
        ? { lastRefreshedAt: input.lastRefreshedAt }
        : {}),
      ...(input.lastError !== undefined ? { lastError: input.lastError } : {}),
    },
  });
}

export async function refreshInstagramDiscoveryAccessToken(options?: {
  force?: boolean;
}) {
  const config = await getInstagramDiscoveryConfig();

  if (!config) {
    throw new Error("Instagram Business Discovery is not configured");
  }

  if (
    !options?.force &&
    config.accessToken &&
    !isTokenExpiringSoon(config.tokenExpiresAt)
  ) {
    return {
      accessToken: config.accessToken,
      tokenExpiresAt: config.tokenExpiresAt,
      refreshed: false,
    };
  }

  if (!config.appId || !config.appSecret || !config.accessToken) {
    throw new Error(
      "Instagram Business Discovery refresh requires app ID, app secret, and an access token",
    );
  }

  const refreshUrl = new URL(
    `https://graph.facebook.com/${config.graphVersion}/oauth/access_token`,
  );
  refreshUrl.searchParams.set("grant_type", "fb_exchange_token");
  refreshUrl.searchParams.set("client_id", config.appId);
  refreshUrl.searchParams.set("client_secret", config.appSecret);
  refreshUrl.searchParams.set("fb_exchange_token", config.accessToken);

  const response = await fetch(refreshUrl.toString(), { method: "GET" });
  const data = await response.json().catch(() => null);

  if (!response.ok || data?.error || !data?.access_token) {
    const message =
      data?.error?.message || "Failed to refresh Instagram discovery token";

    await saveInstagramDiscoveryConfig({
      lastError: message,
    });

    throw new Error(message);
  }

  const expiresIn = Number(data.expires_in || 0);
  const tokenExpiresAt =
    expiresIn > 0 ? new Date(Date.now() + expiresIn * 1000) : null;
  const refreshedAt = new Date();

  await saveInstagramDiscoveryConfig({
    appId: config.appId,
    appSecret: config.appSecret,
    graphVersion: config.graphVersion,
    businessAccountId: config.businessAccountId,
    accessToken: data.access_token,
    tokenExpiresAt,
    lastRefreshedAt: refreshedAt,
    lastError: null,
  });

  return {
    accessToken: data.access_token as string,
    tokenExpiresAt,
    refreshed: true,
  };
}

export async function getInstagramDiscoveryAccessToken(options?: {
  refreshIfNeeded?: boolean;
}) {
  const config = await getInstagramDiscoveryConfig();

  if (!config?.accessToken) {
    return null;
  }

  if (options?.refreshIfNeeded !== false && isTokenExpiringSoon(config.tokenExpiresAt)) {
    const refreshed = await refreshInstagramDiscoveryAccessToken();
    return refreshed.accessToken;
  }

  return config.accessToken;
}
