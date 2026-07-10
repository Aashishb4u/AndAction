import type { InstagramDiscoveryAccount } from "@/lib/instagram-discovery";

const DEFAULT_ENGINE = "google_light";
const RESERVED_INSTAGRAM_PATH_SEGMENTS = new Set([
  "about",
  "accounts",
  "developer",
  "directory",
  "explore",
  "legal",
  "p",
  "popular",
  "press",
  "reel",
  "reels",
  "stories",
  "tv",
]);
const BLOCKED_INSTAGRAM_USERNAMES = new Set([
  "instagram",
  "meta",
  "threads",
]);
const BLOCKED_GENERIC_TITLES = new Set([
  "instagram photos and videos",
  "instagram",
]);

interface SerpApiOrganicResult {
  position?: number;
  title?: string;
  link?: string;
  displayed_link?: string;
  snippet?: string;
}

interface SerpApiSearchResponse {
  search_metadata?: {
    id?: string;
    status?: string;
    total_time_taken?: number;
  };
  organic_results?: SerpApiOrganicResult[];
}

export interface ProspectDiscoveryCandidate {
  username: string;
  title: string | null;
  snippet: string | null;
  link: string | null;
  position: number | null;
}

export interface ProspectDiscoverySearchParams {
  apiKey: string;
  query: string;
  start: number;
  location: string;
  googleDomain: string;
  hl: string;
  gl: string;
  maxResults: number;
  debug?: boolean;
}

export interface ProspectDiscoveryDebugEntry {
  position: number | null;
  title: string | null;
  link: string | null;
  username: string | null;
  accepted: boolean;
  rejectionReason: string | null;
  snippet: string | null;
}

export interface ProspectDiscoverySearchResult {
  metadata: {
    searchId: string | null;
    status: string | null;
    totalTimeTaken: number | null;
    candidatesFound: number;
    start: number;
  };
  candidates: ProspectDiscoveryCandidate[];
  debug?: {
    rawOrganicResultsCount: number;
    inspectedResultsCount: number;
    decisions: ProspectDiscoveryDebugEntry[];
  };
}

export async function discoverInstagramProspectsFromSerpApi(
  params: ProspectDiscoverySearchParams,
): Promise<ProspectDiscoverySearchResult> {
  const {
    apiKey,
    query,
    start,
    location,
    googleDomain,
    hl,
    gl,
    maxResults,
    debug,
  } = params;

  const searchParams = new URLSearchParams({
    engine: DEFAULT_ENGINE,
    q: query,
    start: String(Math.max(start, 0)),
    location,
    google_domain: googleDomain,
    hl,
    gl,
    api_key: apiKey,
  });

  const response = await fetch(`https://serpapi.com/search?${searchParams.toString()}`);
  const data = (await response.json().catch(() => ({}))) as SerpApiSearchResponse & {
    error?: string;
  };

  if (!response.ok || data.error) {
    throw new Error(data.error || "Failed to fetch prospect discovery results");
  }

  const inspectedResults = (data.organic_results || []).slice(
    0,
    Math.max(maxResults, 1),
  );
  const debugDecisions: ProspectDiscoveryDebugEntry[] = [];

  const candidates = dedupeCandidatesByUsername(
    inspectedResults
      .map((result): ProspectDiscoveryCandidate | null => {
        const title = sanitizeText(result.title);
        const snippet = sanitizeText(result.snippet);
        const username = extractInstagramUsernameFromUrl(result.link);
        const rejectionReason = getProspectCandidateRejectionReason({
          username,
          title,
          snippet,
        });

        if (debug) {
          debugDecisions.push({
            position:
              typeof result.position === "number" ? result.position : null,
            title,
            link: result.link || null,
            username,
            accepted: !rejectionReason,
            rejectionReason,
            snippet,
          });
        }

        if (!username || rejectionReason) return null;

        return {
          username,
          title,
          snippet,
          link: result.link || null,
          position:
            typeof result.position === "number" ? result.position : null,
        };
      })
      .filter((candidate): candidate is ProspectDiscoveryCandidate => !!candidate),
  );

  const result: ProspectDiscoverySearchResult = {
    metadata: {
      searchId: data.search_metadata?.id || null,
      status: data.search_metadata?.status || null,
      totalTimeTaken:
        typeof data.search_metadata?.total_time_taken === "number"
          ? data.search_metadata.total_time_taken
          : null,
      candidatesFound: candidates.length,
      start: Math.max(start, 0),
    },
    candidates,
  };

  if (debug) {
    result.debug = {
      rawOrganicResultsCount: data.organic_results?.length || 0,
      inspectedResultsCount: inspectedResults.length,
      decisions: debugDecisions,
    };
  }

  return result;
}

export function extractInstagramUsernameFromUrl(url?: string | null): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace(/^www\./i, "").toLowerCase();
    if (hostname !== "instagram.com") {
      return null;
    }

    const segments = parsed.pathname
      .split("/")
      .map((segment) => segment.trim())
      .filter(Boolean);

    if (segments.length === 0) {
      return null;
    }

    const username = segments[0].replace(/^@/, "");
    if (!username) {
      return null;
    }

    if (RESERVED_INSTAGRAM_PATH_SEGMENTS.has(username.toLowerCase())) {
      return null;
    }

    if (!/^[A-Za-z0-9._]+$/.test(username)) {
      return null;
    }

    return username;
  } catch {
    return null;
  }
}

export function buildProspectStageName(args: {
  account: InstagramDiscoveryAccount | null;
  title?: string | null;
  username: string;
}): string {
  const accountName = sanitizeText(args.account?.name);
  if (accountName) {
    return accountName;
  }

  const rawTitle = sanitizeText(args.title);
  if (rawTitle) {
    const cleanedTitle = rawTitle
      .replace(/\s*\(@[^)]+\).*/i, "")
      .replace(/\s*[•|-]\s*Instagram photos and videos.*$/i, "")
      .trim();

    if (cleanedTitle) {
      return cleanedTitle;
    }
  }

  return args.username;
}

export function sanitizeText(value?: string | null): string | null {
  if (!value) return null;

  const cleaned = value
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
    .trim();

  return cleaned || null;
}

function getProspectCandidateRejectionReason(candidate: {
  username: string | null;
  title: string | null;
  snippet: string | null;
}) {
  if (!candidate.username) {
    return "missing_or_invalid_instagram_username";
  }

  const normalizedUsername = candidate.username.trim().toLowerCase();
  if (BLOCKED_INSTAGRAM_USERNAMES.has(normalizedUsername)) {
    return "blocked_instagram_username";
  }

  const normalizedTitle = candidate.title?.trim().toLowerCase() || "";
  if (BLOCKED_GENERIC_TITLES.has(normalizedTitle)) {
    return "blocked_generic_title";
  }

  const normalizedSnippet = candidate.snippet?.trim().toLowerCase() || "";
  if (
    normalizedSnippet.includes("@instagram:") ||
    normalizedSnippet.includes("discover what's new on instagram")
  ) {
    return "blocked_generic_snippet";
  }

  return null;
}

function dedupeCandidatesByUsername(
  candidates: ProspectDiscoveryCandidate[],
): ProspectDiscoveryCandidate[] {
  const seen = new Set<string>();

  return candidates.filter((candidate) => {
    const key = candidate.username.toLowerCase();
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}
