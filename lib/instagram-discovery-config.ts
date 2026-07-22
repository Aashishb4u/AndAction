import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const INSTAGRAM_DISCOVERY_CONFIG_ID = "default";
const REFRESH_WINDOW_MS = 5 * 24 * 60 * 60 * 1000;

interface ProspectDiscoveryCategory {
  title: string;
  description: string;
}

interface ProspectDiscoveryLocation {
  city: string | null;
  state: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
}

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
  categories: ProspectDiscoveryCategory[];
  categoryTitles: string[];
  categoryDescriptions: Record<string, string>;
  locations: ProspectDiscoveryLocation[];
  currentLocationIndex: number;
  queries: string[];
  activeCategoryTitle: string;
  activeQuery: string;
  currentCategoryIndex: number;
  currentQueryIndex: number;
  currentStart: number;
  startIncrement: number;
  pagesPerQuery: number;
  locationCity: string | null;
  locationState: string | null;
  locationCountry: string | null;
  locationLatitude: number | null;
  locationLongitude: number | null;
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

function parseOptionalPositiveInteger(
  value: number | string | null | undefined,
): number | null {
  const parsed =
    typeof value === "number"
      ? value
      : value != null && String(value).trim() !== ""
        ? Number(value)
        : NaN;

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return Math.floor(parsed);
}

export function buildProspectDiscoveryQueryFromCategoryTitle(categoryTitle: string) {
  return `site:instagram.com "Instagram photos and videos" "${categoryTitle.trim()}"`;
}

function extractCategoryTitleFromDiscoveryQuery(query?: string | null) {
  const normalizedQuery = normalizeValue(query);
  if (!normalizedQuery) return null;

  const strictMatch = normalizedQuery.match(
    /^site:instagram\.com\s+"Instagram photos and videos"\s+"([^"]+)"$/i,
  );

  if (strictMatch?.[1]) {
    return strictMatch[1].trim();
  }

  const quotedParts = Array.from(normalizedQuery.matchAll(/"([^"]+)"/g))
    .map((match) => match[1]?.trim())
    .filter(Boolean);

  return quotedParts.at(-1) || null;
}

function buildProspectDiscoveryLocation(parts: {
  city?: string | null;
  state?: string | null;
  country?: string | null;
}) {
  const values = [parts.city, parts.state, parts.country]
    .map((value) => normalizeValue(value))
    .filter((value): value is string => Boolean(value));

  return values.join(",+");
}

function normalizeProspectDiscoveryLocation(
  value: unknown,
): ProspectDiscoveryLocation | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const city = normalizeValue((value as Record<string, unknown>).city as string);
  const state = normalizeValue((value as Record<string, unknown>).state as string);
  const country = normalizeValue(
    (value as Record<string, unknown>).country as string,
  );
  const latitude = normalizeCoordinate(
    (value as Record<string, unknown>).latitude,
    90,
  );
  const longitude = normalizeCoordinate(
    (value as Record<string, unknown>).longitude,
    180,
  );

  if (!city && !state && !country) {
    return null;
  }

  return { city, state, country, latitude, longitude };
}

/** Prisma's Json input types reject interfaces (no index signature), so widen. */
function toJsonLocations(
  locations: ProspectDiscoveryLocation[],
): Prisma.InputJsonValue {
  return locations.map((location) => ({
    city: location.city,
    state: location.state,
    country: location.country,
    latitude: location.latitude,
    longitude: location.longitude,
  })) as unknown as Prisma.InputJsonValue;
}

function normalizeCoordinate(value: unknown, max: number): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || Math.abs(parsed) > max) {
    return null;
  }

  return parsed;
}

function resolveRequiredStringConfig(
  dbValue: string | null | undefined,
  envValue: string | null | undefined,
  configName: string,
) {
  const resolved = normalizeValue(dbValue) || normalizeValue(envValue);

  if (!resolved) {
    throw new Error(
      `${configName} is missing in instagram_discovery_configs and env`,
    );
  }

  return resolved;
}

function resolveRequiredPositiveIntegerConfig(
  dbValue: number | null | undefined,
  envValue: number | null | undefined,
  configName: string,
) {
  const resolved =
    parseOptionalPositiveInteger(dbValue) ??
    parseOptionalPositiveInteger(envValue);

  if (resolved == null) {
    throw new Error(
      `${configName} is missing in instagram_discovery_configs and env`,
    );
  }

  return resolved;
}

function buildProspectDiscoveryCategoryDescription(title: string) {
  return `Used in Instagram prospect discovery to find creator or business profiles related to ${title}.`;
}

function parseProspectDiscoveryCategoryTitlesFromEnv() {
  const rawTitles = process.env.PROSPECT_DISCOVERY_CATEGORY_TITLES?.trim();

  if (rawTitles) {
    const titles = rawTitles
      .split("||")
      .map((title) => title.trim())
      .filter(Boolean);

    if (titles.length > 0) {
      return titles;
    }
  }

  const rawQueries = process.env.PROSPECT_DISCOVERY_QUERIES?.trim();

  if (rawQueries) {
    const titles = rawQueries
      .split("||")
      .map((query) => extractCategoryTitleFromDiscoveryQuery(query))
      .filter((title): title is string => Boolean(title));

    if (titles.length > 0) {
      return titles;
    }
  }

  const singleTitle =
    normalizeValue(process.env.PROSPECT_DISCOVERY_CATEGORY_TITLE) ||
    extractCategoryTitleFromDiscoveryQuery(process.env.PROSPECT_DISCOVERY_QUERY) ||
    null;

  return singleTitle ? [singleTitle] : [];
}

function parseProspectDiscoveryLocationsFromEnv() {
  const rawLocations = process.env.PROSPECT_DISCOVERY_LOCATIONS?.trim();

  if (rawLocations) {
    try {
      const parsed = JSON.parse(rawLocations);

      if (Array.isArray(parsed)) {
        const locations = parsed
          .map((location) => normalizeProspectDiscoveryLocation(location))
          .filter(
            (location): location is ProspectDiscoveryLocation =>
              location !== null,
          );

        if (locations.length > 0) {
          return locations;
        }
      }
    } catch (error) {
      console.warn(
        "[INSTAGRAM_DISCOVERY_CONFIG] Failed to parse PROSPECT_DISCOVERY_LOCATIONS:",
        error,
      );
    }
  }

  const legacyLocation = normalizeProspectDiscoveryLocation({
    city: process.env.PROSPECT_DISCOVERY_CITY,
    state: process.env.PROSPECT_DISCOVERY_STATE,
    country:
      process.env.PROSPECT_DISCOVERY_COUNTRY ||
      process.env.PROSPECT_DISCOVERY_LOCATION,
  });

  return legacyLocation ? [legacyLocation] : [];
}

function normalizeProspectDiscoveryCategoryTitles(
  value: Prisma.JsonValue | string[] | null | undefined,
) {
  const list = Array.isArray(value) ? value : [];

  const titles = list
    .map((item) => {
      if (typeof item !== "string") return "";
      return extractCategoryTitleFromDiscoveryQuery(item) || item.trim();
    })
    .filter((title): title is string => Boolean(title));

  return titles;
}

function normalizeProspectDiscoveryLocations(
  value: Prisma.JsonValue | ProspectDiscoveryLocation[] | null | undefined,
) {
  const list = Array.isArray(value) ? value : [];

  return list
    .map((location) => normalizeProspectDiscoveryLocation(location))
    .filter(
      (location): location is ProspectDiscoveryLocation => location !== null,
    );
}

function normalizeProspectDiscoveryCategoryDescriptions(
  value: Prisma.JsonValue | Record<string, string> | null | undefined,
  categoryTitles: string[],
) {
  const descriptions: Record<string, string> = {};

  if (Array.isArray(value)) {
    for (let index = 0; index < categoryTitles.length; index++) {
      const title = categoryTitles[index];
      const description = value[index];

      if (typeof description === "string" && description.trim()) {
        descriptions[title] = description.trim();
      }
    }
  } else if (value && typeof value === "object") {
    for (const title of categoryTitles) {
      const description = (value as Record<string, unknown>)[title];

      if (typeof description === "string" && description.trim()) {
        descriptions[title] = description.trim();
      }
    }
  }

  for (const title of categoryTitles) {
    if (!descriptions[title]) {
      descriptions[title] = buildProspectDiscoveryCategoryDescription(title);
    }
  }

  return descriptions;
}

function getInstagramDiscoveryEnvFallbacks() {
  return {
    appId: normalizeValue(process.env.META_APP_ID),
    appSecret: normalizeValue(process.env.META_APP_SECRET),
    graphVersion: normalizeValue(process.env.INSTAGRAM_GRAPH_VERSION),
    businessAccountId: normalizeValue(process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID),
    accessToken: normalizeValue(process.env.INSTAGRAM_GRAPH_ACCESS_TOKEN),
  };
}

function getProspectDiscoveryEnvFallbacks() {
  const categoryTitles = parseProspectDiscoveryCategoryTitlesFromEnv();
  const locations = parseProspectDiscoveryLocationsFromEnv();
  const primaryLocation = locations[0] || {
    city: null,
    state: null,
    country: null,
    latitude: null,
    longitude: null,
  };

  return {
    categoryTitles,
    categoryDescriptions: normalizeProspectDiscoveryCategoryDescriptions(
      null,
      categoryTitles,
    ),
    locations,
    currentLocationIndex: 0,
    queries: categoryTitles.map(buildProspectDiscoveryQueryFromCategoryTitle),
    locationCity: primaryLocation.city,
    locationState: primaryLocation.state,
    locationCountry: primaryLocation.country,
    locationLatitude: primaryLocation.latitude,
    locationLongitude: primaryLocation.longitude,
    location: buildProspectDiscoveryLocation({
      city: primaryLocation.city,
      state: primaryLocation.state,
      country: primaryLocation.country,
    }),
    googleDomain: normalizeValue(process.env.PROSPECT_DISCOVERY_GOOGLE_DOMAIN),
    hl: normalizeValue(process.env.PROSPECT_DISCOVERY_HL),
    gl: normalizeValue(process.env.PROSPECT_DISCOVERY_GL),
    maxResults: parseOptionalPositiveInteger(
      process.env.PROSPECT_DISCOVERY_MAX_RESULTS,
    ),
    mediaLimit: parseOptionalPositiveInteger(
      process.env.PROSPECT_DISCOVERY_MEDIA_LIMIT,
    ),
    requestDelayMs: parseOptionalPositiveInteger(
      process.env.PROSPECT_DISCOVERY_REQUEST_DELAY_MS,
    ),
    startIncrement: parseOptionalPositiveInteger(
      process.env.PROSPECT_DISCOVERY_START_INCREMENT,
    ),
    pagesPerQuery: parseOptionalPositiveInteger(
      process.env.PROSPECT_DISCOVERY_PAGES_PER_QUERY,
    ),
  };
}

function clampQueryIndex(index: number, queryCount: number) {
  if (queryCount <= 0) return 0;
  if (!Number.isFinite(index) || index < 0) return 0;
  return index % queryCount;
}

function clampLocationIndex(index: number, locationCount: number) {
  if (locationCount <= 0) return 0;
  if (!Number.isFinite(index) || index < 0) return 0;
  return index % locationCount;
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
  const envFallbacks = getProspectDiscoveryEnvFallbacks();
  const dbCategoryTitles = normalizeProspectDiscoveryCategoryTitles(
    dbConfig?.prospectDiscoveryQueries as Prisma.JsonValue | null | undefined,
  );
  const categoryTitles =
    dbCategoryTitles.length > 0
      ? dbCategoryTitles
      : envFallbacks.categoryTitles;

  if (categoryTitles.length === 0) {
    throw new Error(
      "Prospect discovery category titles are missing in instagram_discovery_configs and env",
    );
  }

  const categoryDescriptions = normalizeProspectDiscoveryCategoryDescriptions(
    dbConfig?.prospectDiscoveryCategoryDescriptions as
      | Prisma.JsonValue
      | null
      | undefined,
    categoryTitles,
  );
  const dbLegacyLocation = normalizeProspectDiscoveryLocation({
    city: dbConfig?.prospectDiscoveryCity,
    state: dbConfig?.prospectDiscoveryState,
    country: dbConfig?.prospectDiscoveryCountry,
  });
  const dbLocations = normalizeProspectDiscoveryLocations(
    dbConfig?.prospectDiscoveryLocations as Prisma.JsonValue | null | undefined,
  );
  const locations =
    dbLocations.length > 0
      ? dbLocations
      : dbLegacyLocation
        ? [dbLegacyLocation]
        : envFallbacks.locations;

  if (locations.length === 0) {
    throw new Error(
      "Prospect discovery locations are missing in instagram_discovery_configs and env",
    );
  }

  const currentLocationIndex = clampLocationIndex(
    dbConfig?.prospectDiscoveryCurrentLocationIndex ?? 0,
    locations.length,
  );
  const activeLocation = locations[currentLocationIndex] || locations[0];
  const queries = categoryTitles.map(buildProspectDiscoveryQueryFromCategoryTitle);
  const currentCategoryIndex = clampQueryIndex(
    dbConfig?.prospectDiscoveryCurrentQueryIndex ?? 0,
    categoryTitles.length,
  );
  const startIncrement = resolveRequiredPositiveIntegerConfig(
    dbConfig?.prospectDiscoveryStartIncrement,
    envFallbacks.startIncrement,
    "PROSPECT_DISCOVERY_START_INCREMENT",
  );
  const pagesPerQuery = resolveRequiredPositiveIntegerConfig(
    dbConfig?.prospectDiscoveryPagesPerQuery,
    envFallbacks.pagesPerQuery,
    "PROSPECT_DISCOVERY_PAGES_PER_QUERY",
  );

  return {
    categories: categoryTitles.map((title) => ({
      title,
      description: categoryDescriptions[title],
    })),
    categoryTitles,
    categoryDescriptions,
    locations,
    currentLocationIndex,
    queries,
    activeCategoryTitle: categoryTitles[currentCategoryIndex] || categoryTitles[0],
    activeQuery: queries[currentCategoryIndex] || queries[0],
    currentCategoryIndex,
    currentQueryIndex: currentCategoryIndex,
    currentStart: normalizeCurrentStart(dbConfig?.prospectDiscoveryCurrentStart),
    startIncrement,
    pagesPerQuery,
    locationCity: activeLocation.city,
    locationState: activeLocation.state,
    locationCountry: activeLocation.country,
    locationLatitude: activeLocation.latitude ?? null,
    locationLongitude: activeLocation.longitude ?? null,
    location: buildProspectDiscoveryLocation({
      city: activeLocation.city,
      state: activeLocation.state,
      country: activeLocation.country,
    }),
    googleDomain: resolveRequiredStringConfig(
      dbConfig?.prospectDiscoveryGoogleDomain,
      envFallbacks.googleDomain,
      "PROSPECT_DISCOVERY_GOOGLE_DOMAIN",
    ),
    hl: resolveRequiredStringConfig(
      dbConfig?.prospectDiscoveryHl,
      envFallbacks.hl,
      "PROSPECT_DISCOVERY_HL",
    ),
    gl: resolveRequiredStringConfig(
      dbConfig?.prospectDiscoveryGl,
      envFallbacks.gl,
      "PROSPECT_DISCOVERY_GL",
    ),
    maxResults: resolveRequiredPositiveIntegerConfig(
      dbConfig?.prospectDiscoveryMaxResults,
      envFallbacks.maxResults,
      "PROSPECT_DISCOVERY_MAX_RESULTS",
    ),
    mediaLimit: resolveRequiredPositiveIntegerConfig(
      dbConfig?.prospectDiscoveryMediaLimit,
      envFallbacks.mediaLimit,
      "PROSPECT_DISCOVERY_MEDIA_LIMIT",
    ),
    requestDelayMs: resolveRequiredPositiveIntegerConfig(
      dbConfig?.prospectDiscoveryRequestDelayMs,
      envFallbacks.requestDelayMs,
      "PROSPECT_DISCOVERY_REQUEST_DELAY_MS",
    ),
    lastCursorUpdatedAt: dbConfig?.prospectDiscoveryLastCursorUpdatedAt || null,
  };
}

export async function getInstagramDiscoveryConfig(): Promise<InstagramDiscoveryRuntimeConfig | null> {
  const dbConfig = await getInstagramDiscoveryConfigRecord();
  const envFallbacks = getInstagramDiscoveryEnvFallbacks();

  const businessAccountId =
    normalizeValue(dbConfig?.businessAccountId) || envFallbacks.businessAccountId;
  const accessToken =
    normalizeValue(dbConfig?.accessToken) || envFallbacks.accessToken;

  if (!businessAccountId || !accessToken) {
    return null;
  }

  return {
    appId: normalizeValue(dbConfig?.appId) || envFallbacks.appId,
    appSecret: normalizeValue(dbConfig?.appSecret) || envFallbacks.appSecret,
    graphVersion: resolveRequiredStringConfig(
      dbConfig?.graphVersion,
      envFallbacks.graphVersion,
      "INSTAGRAM_GRAPH_VERSION",
    ),
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
  prospectDiscoveryCategoryTitles?: string[] | null;
  prospectDiscoveryQueries?: string[] | null;
  prospectDiscoveryCategoryDescriptions?: Record<string, string> | null;
  prospectDiscoveryLocations?: ProspectDiscoveryLocation[] | null;
  prospectDiscoveryCity?: string | null;
  prospectDiscoveryState?: string | null;
  prospectDiscoveryCountry?: string | null;
  prospectDiscoveryGoogleDomain?: string | null;
  prospectDiscoveryHl?: string | null;
  prospectDiscoveryGl?: string | null;
  prospectDiscoveryMaxResults?: number | null;
  prospectDiscoveryMediaLimit?: number | null;
  prospectDiscoveryRequestDelayMs?: number | null;
  prospectDiscoveryStartIncrement?: number | null;
  prospectDiscoveryPagesPerQuery?: number | null;
  prospectDiscoveryCurrentLocationIndex?: number | null;
  prospectDiscoveryCurrentQueryIndex?: number | null;
  prospectDiscoveryCurrentStart?: number | null;
  prospectDiscoveryLastCursorUpdatedAt?: Date | null;
}) {
  const normalizedCategoryTitles =
    input.prospectDiscoveryCategoryTitles !== undefined
      ? normalizeProspectDiscoveryCategoryTitles(
          input.prospectDiscoveryCategoryTitles,
        )
      : input.prospectDiscoveryQueries !== undefined
        ? normalizeProspectDiscoveryCategoryTitles(input.prospectDiscoveryQueries)
      : undefined;
  const normalizedCategoryDescriptions =
    input.prospectDiscoveryCategoryDescriptions !== undefined
      ? normalizeProspectDiscoveryCategoryDescriptions(
          input.prospectDiscoveryCategoryDescriptions,
          normalizedCategoryTitles ?? [],
        )
      : undefined;
  const normalizedLocations =
    input.prospectDiscoveryLocations !== undefined
      ? normalizeProspectDiscoveryLocations(input.prospectDiscoveryLocations)
      : undefined;
  const envFallbacks = getProspectDiscoveryEnvFallbacks();
  const instagramEnvFallbacks = getInstagramDiscoveryEnvFallbacks();
  const effectiveLocations =
    normalizedLocations ??
    (envFallbacks.locations.length > 0 ? envFallbacks.locations : []);
  const effectiveCurrentLocationIndex =
    input.prospectDiscoveryCurrentLocationIndex ?? 0;
  const effectiveLocation =
    effectiveLocations[clampLocationIndex(
      effectiveCurrentLocationIndex,
      Math.max(effectiveLocations.length, 1),
    )] || null;

  return prisma.instagramDiscoveryConfig.upsert({
    where: { id: INSTAGRAM_DISCOVERY_CONFIG_ID },
    create: {
      id: INSTAGRAM_DISCOVERY_CONFIG_ID,
      appId: normalizeValue(input.appId),
      appSecret: normalizeValue(input.appSecret),
      graphVersion:
        normalizeValue(input.graphVersion) || instagramEnvFallbacks.graphVersion,
      businessAccountId: normalizeValue(input.businessAccountId),
      accessToken: normalizeValue(input.accessToken),
      tokenExpiresAt: input.tokenExpiresAt ?? null,
      lastRefreshedAt: input.lastRefreshedAt ?? null,
      lastError: input.lastError ?? null,
      prospectDiscoveryQueries:
        normalizedCategoryTitles ??
        (envFallbacks.categoryTitles.length > 0
          ? envFallbacks.categoryTitles
          : undefined),
      prospectDiscoveryCategoryDescriptions:
        normalizedCategoryDescriptions ??
        (envFallbacks.categoryTitles.length > 0
          ? envFallbacks.categoryDescriptions
          : undefined),
      prospectDiscoveryLocations:
        effectiveLocations.length > 0
          ? toJsonLocations(effectiveLocations)
          : undefined,
      prospectDiscoveryCity:
        normalizeValue(input.prospectDiscoveryCity) ?? effectiveLocation?.city,
      prospectDiscoveryState:
        normalizeValue(input.prospectDiscoveryState) ?? effectiveLocation?.state,
      prospectDiscoveryCountry:
        normalizeValue(input.prospectDiscoveryCountry) ??
        effectiveLocation?.country,
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
      prospectDiscoveryCurrentLocationIndex:
        input.prospectDiscoveryCurrentLocationIndex ?? 0,
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
        ? { graphVersion: normalizeValue(input.graphVersion) }
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
      ...(normalizedCategoryTitles !== undefined
        ? { prospectDiscoveryQueries: normalizedCategoryTitles }
        : {}),
      ...(normalizedCategoryDescriptions !== undefined
        ? {
            prospectDiscoveryCategoryDescriptions:
              normalizedCategoryDescriptions,
          }
        : {}),
      ...(normalizedLocations !== undefined
        ? {
            prospectDiscoveryLocations:
              normalizedLocations.length > 0
                ? toJsonLocations(normalizedLocations)
                : Prisma.JsonNull,
          }
        : {}),
      ...(input.prospectDiscoveryCity !== undefined
        ? {
            prospectDiscoveryCity: normalizeValue(
              input.prospectDiscoveryCity,
            ),
          }
        : {}),
      ...(input.prospectDiscoveryState !== undefined
        ? {
            prospectDiscoveryState: normalizeValue(
              input.prospectDiscoveryState,
            ),
          }
        : {}),
      ...(input.prospectDiscoveryCountry !== undefined
        ? {
            prospectDiscoveryCountry: normalizeValue(
              input.prospectDiscoveryCountry,
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
      ...(input.prospectDiscoveryCurrentLocationIndex !== undefined
        ? {
            prospectDiscoveryCurrentLocationIndex:
              input.prospectDiscoveryCurrentLocationIndex,
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
  const categoryTitles = currentConfig.categoryTitles;
  const locations = currentConfig.locations;
  const totalPagesForQuery = Math.max(currentConfig.pagesPerQuery, 1);
  const currentPageIndex = Math.floor(
    Math.max(currentConfig.currentStart, 0) / Math.max(currentConfig.startIncrement, 1),
  );

  const shouldMoveToNextQuery = currentPageIndex + 1 >= totalPagesForQuery;
  const wrappedToNextQuery = shouldMoveToNextQuery
    ? (currentConfig.currentCategoryIndex + 1) % categoryTitles.length
    : currentConfig.currentCategoryIndex;
  const completedLocationCycle =
    shouldMoveToNextQuery &&
    currentConfig.currentCategoryIndex + 1 >= categoryTitles.length;
  const nextLocationIndex = completedLocationCycle
    ? clampLocationIndex(
        currentConfig.currentLocationIndex + 1,
        Math.max(locations.length, 1),
      )
    : currentConfig.currentLocationIndex;
  const nextQueryIndex = completedLocationCycle ? 0 : wrappedToNextQuery;
  const nextStart = shouldMoveToNextQuery
    ? 0
    : currentConfig.currentStart + currentConfig.startIncrement;
  const nextLocation = locations[nextLocationIndex] || currentConfig.locations[0];

  await saveInstagramDiscoveryConfig({
    prospectDiscoveryCategoryTitles: categoryTitles,
    prospectDiscoveryCategoryDescriptions: currentConfig.categoryDescriptions,
    prospectDiscoveryLocations: locations,
    prospectDiscoveryCity: nextLocation?.city ?? null,
    prospectDiscoveryState: nextLocation?.state ?? null,
    prospectDiscoveryCountry: nextLocation?.country ?? null,
    prospectDiscoveryGoogleDomain: currentConfig.googleDomain,
    prospectDiscoveryHl: currentConfig.hl,
    prospectDiscoveryGl: currentConfig.gl,
    prospectDiscoveryMaxResults: currentConfig.maxResults,
    prospectDiscoveryMediaLimit: currentConfig.mediaLimit,
    prospectDiscoveryRequestDelayMs: currentConfig.requestDelayMs,
    prospectDiscoveryStartIncrement: currentConfig.startIncrement,
    prospectDiscoveryPagesPerQuery: currentConfig.pagesPerQuery,
    prospectDiscoveryCurrentLocationIndex: nextLocationIndex,
    prospectDiscoveryCurrentQueryIndex: nextQueryIndex,
    prospectDiscoveryCurrentStart: nextStart,
    prospectDiscoveryLastCursorUpdatedAt: new Date(),
  });

  return {
    nextLocationIndex,
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
