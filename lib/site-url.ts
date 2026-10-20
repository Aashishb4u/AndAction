const PUBLIC_SITE_URL = "https://andaction.in";

function isLocalHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".local");
}

/** Public canonical origin. Local auth URLs are not used in metadata or sitemaps. */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || PUBLIC_SITE_URL;
  try {
    const url = new URL(raw);
    if (isLocalHost(url.hostname)) return PUBLIC_SITE_URL;
    return url.toString().replace(/\/$/, "");
  } catch {
    return PUBLIC_SITE_URL;
  }
}
