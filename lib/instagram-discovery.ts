/**
 * Instagram Business Discovery helper.
 *
 * Uses a single app-level IG Business account + long-lived access token to look
 * up ANY public Instagram Business/Creator account by username (no per-artist
 * OAuth required). This mirrors how we connect YouTube channels by handle/ID.
 *
 * Docs: https://developers.facebook.com/docs/instagram-api/guides/business-discovery
 */

const GRAPH_VERSION = process.env.INSTAGRAM_GRAPH_VERSION || "v24.0";
const IG_BUSINESS_ACCOUNT_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
const IG_GRAPH_ACCESS_TOKEN = process.env.INSTAGRAM_GRAPH_ACCESS_TOKEN;

export interface InstagramDiscoveryMedia {
  id: string;
  caption?: string;
  permalink: string;
  thumbnail_url?: string;
  media_type: string;
  media_url?: string;
  media_product_type?: string;
  timestamp: string;
}

export interface InstagramDiscoveryAccount {
  id: string;
  username: string;
  name?: string;
  profile_picture_url?: string;
  biography?: string;
  website?: string;
  followers_count?: number;
  follows_count?: number;
  media_count?: number;
  media?: {
    data: InstagramDiscoveryMedia[];
  };
}

export function isInstagramDiscoveryConfigured(): boolean {
  return !!(IG_BUSINESS_ACCOUNT_ID && IG_GRAPH_ACCESS_TOKEN);
}

/**
 * Fetch a public Instagram account (profile + recent media) by username.
 * Returns null if the account can't be found / isn't discoverable.
 */
export async function fetchInstagramAccountByUsername(
  username: string,
  mediaLimit = 50,
): Promise<InstagramDiscoveryAccount | null> {
  if (!isInstagramDiscoveryConfigured()) {
    throw new Error("Instagram Business Discovery is not configured");
  }

  const cleaned = username.trim().replace(/^@/, "");
  if (!cleaned) return null;

  const fields =
    `business_discovery.username(${cleaned})` +
    `{id,username,name,profile_picture_url,biography,website,` +
    `followers_count,follows_count,media_count,` +
    `media.limit(${mediaLimit})` +
    `{id,caption,permalink,thumbnail_url,media_type,media_url,media_product_type,timestamp}}`;

  const url =
    `https://graph.facebook.com/${GRAPH_VERSION}/${IG_BUSINESS_ACCOUNT_ID}` +
    `?fields=${encodeURIComponent(fields)}` +
    `&access_token=${IG_GRAPH_ACCESS_TOKEN}`;

  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok || data.error) {
    // Business discovery returns error code 24 when the username isn't found /
    // isn't a business account we can discover.
    const message: string = data?.error?.message || "";
    if (
      response.status === 404 ||
      data?.error?.code === 24 ||
      /does not exist|cannot be found|Invalid user/i.test(message)
    ) {
      return null;
    }
    throw new Error(message || "Failed to fetch Instagram account");
  }

  return (data.business_discovery as InstagramDiscoveryAccount) || null;
}
