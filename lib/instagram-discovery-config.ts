import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const INSTAGRAM_DISCOVERY_CONFIG_ID = "default";
const DEFAULT_GRAPH_VERSION = "v24.0";
const REFRESH_WINDOW_MS = 5 * 24 * 60 * 60 * 1000;
const DEFAULT_PROSPECT_DISCOVERY_QUERY =
  'site:instagram.com "Instagram photos and videos" "spiritual singer"';
const DEFAULT_PROSPECT_DISCOVERY_LOCATION = "India";
const DEFAULT_PROSPECT_DISCOVERY_GOOGLE_DOMAIN = "google.co.in";
const DEFAULT_PROSPECT_DISCOVERY_HL = "hi";
const DEFAULT_PROSPECT_DISCOVERY_GL = "in";
const DEFAULT_PROSPECT_DISCOVERY_MAX_RESULTS = 10;
const DEFAULT_PROSPECT_DISCOVERY_MEDIA_LIMIT = 12;
const DEFAULT_PROSPECT_DISCOVERY_REQUEST_DELAY_MS = 1000;
const DEFAULT_PROSPECT_DISCOVERY_START_INCREMENT = 10;
const DEFAULT_PROSPECT_DISCOVERY_PAGES_PER_QUERY = 10;

export interface InstagramDiscoveryRuntimeConfig {
  appId: string | null;
  appSecret: string | null;
  graphVersion: string;
  businessAccountId: string | null;
  accessToken: string | null;
  tokenExpiresAt: Date | null;
  lastRefreshedAt: Date | null;
  lastError: string | null;
  prospectDiscovery: InstagramProspectDiscoveryRuntimeConfig;
}

export interface InstagramProspectDiscoveryRuntimeConfig {
  queries: string[];
  activeQuery: string;
  currentQueryIndex: number;
  currentStart: number;
  startIncrement: number;
  pagesPerQuery: number;
  location: string;
  googleDomain: string;
  hl: string;
  gl: string;
  maxResults: number;
  mediaLimit: number;
  requestDelayMs: number;
  lastCursorUpdatedAt: Date | null;
}

function normalizeValue(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizePositiveInteger(
  value: number | string | null | undefined,
  fallback: number,
) {
  const parsed =
    typeof value === "number"
      ? value
      : value != null && String(value).trim() !== ""
        ? Number(value)
        : NaN;

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

function parseProspectDiscoveryQueriesFromEnv() {
  const rawQueries = process.env.PROSPECT_DISCOVERY_QUERIES?.trim();

  if (rawQueries) {
    const queries = rawQueries
      .split("||")
      .map((query) => query.trim())
      .filter(Boolean);

    if (queries.length > 0) {
      return queries;
    }
  }

  return [
    normalizeValue(process.env.PROSPECT_DISCOVERY_QUERY) ||
      DEFAULT_PROSPECT_DISCOVERY_QUERY,
  ];
}

function normalizeProspectDiscoveryQueries(
  value: Prisma.JsonValue | string[] | null | undefined,
) {
  const list = Array.isArray(value) ? value : [];

  const queries = list
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);

  return queries.length > 0 ? queries : parseProspectDiscoveryQueriesFromEnv();
}

function getProspectDiscoveryEnvDefaults() {
  return {
    queries: parseProspectDiscoveryQueriesFromEnv(),
    location:
      normalizeValue(process.env.PROSPECT_DISCOVERY_LOCATION) ||
      DEFAULT_PROSPECT_DISCOVERY_LOCATION,
    googleDomain:
      normalizeValue(process.env.PROSPECT_DISCOVERY_GOOGLE_DOMAIN) ||
      DEFAULT_PROSPECT_DISCOVERY_GOOGLE_DOMAIN,
    hl:
      normalizeValue(process.env.PROSPECT_DISCOVERY_HL) ||
      DEFAULT_PROSPECT_DISCOVERY_HL,
    gl:
      normalizeValue(process.env.PROSPECT_DISCOVERY_GL) ||
      DEFAULT_PROSPECT_DISCOVERY_GL,
    maxResults: normalizePositiveInteger(
      process.env.PROSPECT_DISCOVERY_MAX_RESULTS,
      DEFAULT_PROSPECT_DISCOVERY_MAX_RESULTS,
    ),
    mediaLimit: normalizePositiveInteger(
      process.env.PROSPECT_DISCOVERY_MEDIA_LIMIT,
      DEFAULT_PROSPECT_DISCOVERY_MEDIA_LIMIT,
    ),
    requestDelayMs: normalizePositiveInteger(
      process.env.PROSPECT_DISCOVERY_REQUEST_DELAY_MS,
      DEFAULT_PROSPECT_DISCOVERY_REQUEST_DELAY_MS,
    ),
    startIncrement: normalizePositiveInteger(
      process.env.PROSPECT_DISCOVERY_START_INCREMENT,
      DEFAULT_PROSPECT_DISCOVERY_START_INCREMENT,
    ),
    pagesPerQuery: normalizePositiveInteger(
      process.env.PROSPECT_DISCOVERY_PAGES_PER_QUERY,
      DEFAULT_PROSPECT_DISCOVERY_PAGES_PER_QUERY,
    ),
  };
}

function clampQueryIndex(index: number, queryCount: number) {
  if (queryCount <= 0) return 0;
  if (!Number.isFinite(index) || index < 0) return 0;
  return index % queryCount;
}

function normalizeCurrentStart(value: number | null | undefined) {
  if (!Number.isFinite(value as number) || (value as number) < 0) {
    return 0;
  }

  return Math.floor(value as number);
}

async function getInstagramDiscoveryConfigRecord() {
  return prisma.instagramDiscoveryConfig.findUnique({
    where: { id: INSTAGRAM_DISCOVERY_CONFIG_ID },
  });
}

export async function getInstagramProspectDiscoveryConfig(): Promise<InstagramProspectDiscoveryRuntimeConfig> {
  const dbConfig = await getInstagramDiscoveryConfigRecord();
  const defaults = getProspectDiscoveryEnvDefaults();
  const queries = normalizeProspectDiscoveryQueries(
    dbConfig?.prospectDiscoveryQueries as Prisma.JsonValue | null | undefined,
  );
  const currentQueryIndex = clampQueryIndex(
    dbConfig?.prospectDiscoveryCurrentQueryIndex ?? 0,
    queries.length,
  );
  const startIncrement = normalizePositiveInteger(
    dbConfig?.prospectDiscoveryStartIncrement,
    defaults.startIncrement,
  );
  const pagesPerQuery = normalizePositiveInteger(
    dbConfig?.prospectDiscoveryPagesPerQuery,
    defaults.pagesPerQuery,
  );

  return {
    queries,
    activeQuery: queries[currentQueryIndex] || defaults.queries[0],
    currentQueryIndex,
    currentStart: normalizeCurrentStart(dbConfig?.prospectDiscoveryCurrentStart),
    startIncrement,
    pagesPerQuery,
    location:
      normalizeValue(dbConfig?.prospectDiscoveryLocation) || defaults.location,
    googleDomain:
      normalizeValue(dbConfig?.prospectDiscoveryGoogleDomain) ||
      defaults.googleDomain,
    hl: normalizeValue(dbConfig?.prospectDiscoveryHl) || defaults.hl,
    gl: normalizeValue(dbConfig?.prospectDiscoveryGl) || defaults.gl,
    maxResults: normalizePositiveInteger(
      dbConfig?.prospectDiscoveryMaxResults,
      defaults.maxResults,
    ),
    mediaLimit: normalizePositiveInteger(
      dbConfig?.prospectDiscoveryMediaLimit,
      defaults.mediaLimit,
    ),
    requestDelayMs: normalizePositiveInteger(
      dbConfig?.prospectDiscoveryRequestDelayMs,
      defaults.requestDelayMs,
    ),
    lastCursorUpdatedAt: dbConfig?.prospectDiscoveryLastCursorUpdatedAt || null,
  };
}

export async function getInstagramDiscoveryConfig(): Promise<InstagramDiscoveryRuntimeConfig | null> {
  const dbConfig = await getInstagramDiscoveryConfigRecord();

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
    prospectDiscovery: await getInstagramProspectDiscoveryConfig(),
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
  prospectDiscoveryQueries?: string[] | null;
  prospectDiscoveryLocation?: string | null;
  prospectDiscoveryGoogleDomain?: string | null;
  prospectDiscoveryHl?: string | null;
  prospectDiscoveryGl?: string | null;
  prospectDiscoveryMaxResults?: number | null;
  prospectDiscoveryMediaLimit?: number | null;
  prospectDiscoveryRequestDelayMs?: number | null;
  prospectDiscoveryStartIncrement?: number | null;
  prospectDiscoveryPagesPerQuery?: number | null;
  prospectDiscoveryCurrentQueryIndex?: number | null;
  prospectDiscoveryCurrentStart?: number | null;
  prospectDiscoveryLastCursorUpdatedAt?: Date | null;
}) {
  const normalizedProspectQueries =
    input.prospectDiscoveryQueries !== undefined
      ? normalizeProspectDiscoveryQueries(input.prospectDiscoveryQueries)
      : undefined;

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
      prospectDiscoveryQueries:
        normalizedProspectQueries ?? getProspectDiscoveryEnvDefaults().queries,
      prospectDiscoveryLocation: normalizeValue(input.prospectDiscoveryLocation),
      prospectDiscoveryGoogleDomain: normalizeValue(
        input.prospectDiscoveryGoogleDomain,
      ),
      prospectDiscoveryHl: normalizeValue(input.prospectDiscoveryHl),
      prospectDiscoveryGl: normalizeValue(input.prospectDiscoveryGl),
      prospectDiscoveryMaxResults: input.prospectDiscoveryMaxResults ?? null,
      prospectDiscoveryMediaLimit: input.prospectDiscoveryMediaLimit ?? null,
      prospectDiscoveryRequestDelayMs:
        input.prospectDiscoveryRequestDelayMs ?? null,
      prospectDiscoveryStartIncrement:
        input.prospectDiscoveryStartIncrement ?? null,
      prospectDiscoveryPagesPerQuery:
        input.prospectDiscoveryPagesPerQuery ?? null,
      prospectDiscoveryCurrentQueryIndex:
        input.prospectDiscoveryCurrentQueryIndex ?? null,
      prospectDiscoveryCurrentStart: input.prospectDiscoveryCurrentStart ?? null,
      prospectDiscoveryLastCursorUpdatedAt:
        input.prospectDiscoveryLastCursorUpdatedAt ?? null,
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
      ...(normalizedProspectQueries !== undefined
        ? { prospectDiscoveryQueries: normalizedProspectQueries }
        : {}),
      ...(input.prospectDiscoveryLocation !== undefined
        ? {
            prospectDiscoveryLocation: normalizeValue(
              input.prospectDiscoveryLocation,
            ),
          }
        : {}),
      ...(input.prospectDiscoveryGoogleDomain !== undefined
        ? {
            prospectDiscoveryGoogleDomain: normalizeValue(
              input.prospectDiscoveryGoogleDomain,
            ),
          }
        : {}),
      ...(input.prospectDiscoveryHl !== undefined
        ? { prospectDiscoveryHl: normalizeValue(input.prospectDiscoveryHl) }
        : {}),
      ...(input.prospectDiscoveryGl !== undefined
        ? { prospectDiscoveryGl: normalizeValue(input.prospectDiscoveryGl) }
        : {}),
      ...(input.prospectDiscoveryMaxResults !== undefined
        ? {
            prospectDiscoveryMaxResults: input.prospectDiscoveryMaxResults,
          }
        : {}),
      ...(input.prospectDiscoveryMediaLimit !== undefined
        ? {
            prospectDiscoveryMediaLimit: input.prospectDiscoveryMediaLimit,
          }
        : {}),
      ...(input.prospectDiscoveryRequestDelayMs !== undefined
        ? {
            prospectDiscoveryRequestDelayMs:
              input.prospectDiscoveryRequestDelayMs,
          }
        : {}),
      ...(input.prospectDiscoveryStartIncrement !== undefined
        ? {
            prospectDiscoveryStartIncrement:
              input.prospectDiscoveryStartIncrement,
          }
        : {}),
      ...(input.prospectDiscoveryPagesPerQuery !== undefined
        ? {
            prospectDiscoveryPagesPerQuery:
              input.prospectDiscoveryPagesPerQuery,
          }
        : {}),
      ...(input.prospectDiscoveryCurrentQueryIndex !== undefined
        ? {
            prospectDiscoveryCurrentQueryIndex:
              input.prospectDiscoveryCurrentQueryIndex,
          }
        : {}),
      ...(input.prospectDiscoveryCurrentStart !== undefined
        ? {
            prospectDiscoveryCurrentStart: input.prospectDiscoveryCurrentStart,
          }
        : {}),
      ...(input.prospectDiscoveryLastCursorUpdatedAt !== undefined
        ? {
            prospectDiscoveryLastCursorUpdatedAt:
              input.prospectDiscoveryLastCursorUpdatedAt,
          }
        : {}),
    },
  });
}

export async function advanceInstagramProspectDiscoveryCursor(
  config?: InstagramProspectDiscoveryRuntimeConfig,
) {
  const currentConfig =
    config || (await getInstagramProspectDiscoveryConfig());
  const queries =
    currentConfig.queries.length > 0
      ? currentConfig.queries
      : getProspectDiscoveryEnvDefaults().queries;
  const totalPagesForQuery = Math.max(currentConfig.pagesPerQuery, 1);
  const currentPageIndex = Math.floor(
    Math.max(currentConfig.currentStart, 0) / Math.max(currentConfig.startIncrement, 1),
  );

  const shouldMoveToNextQuery = currentPageIndex + 1 >= totalPagesForQuery;
  const nextQueryIndex = shouldMoveToNextQuery
    ? (currentConfig.currentQueryIndex + 1) % queries.length
    : currentConfig.currentQueryIndex;
  const nextStart = shouldMoveToNextQuery
    ? 0
    : currentConfig.currentStart + currentConfig.startIncrement;

  await saveInstagramDiscoveryConfig({
    prospectDiscoveryQueries: queries,
    prospectDiscoveryLocation: currentConfig.location,
    prospectDiscoveryGoogleDomain: currentConfig.googleDomain,
    prospectDiscoveryHl: currentConfig.hl,
    prospectDiscoveryGl: currentConfig.gl,
    prospectDiscoveryMaxResults: currentConfig.maxResults,
    prospectDiscoveryMediaLimit: currentConfig.mediaLimit,
    prospectDiscoveryRequestDelayMs: currentConfig.requestDelayMs,
    prospectDiscoveryStartIncrement: currentConfig.startIncrement,
    prospectDiscoveryPagesPerQuery: currentConfig.pagesPerQuery,
    prospectDiscoveryCurrentQueryIndex: nextQueryIndex,
    prospectDiscoveryCurrentStart: nextStart,
    prospectDiscoveryLastCursorUpdatedAt: new Date(),
  });

  return {
    nextQueryIndex,
    nextStart,
  };
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
