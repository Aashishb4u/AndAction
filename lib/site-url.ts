export function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    "https://andaction.in";
  try {
    return new URL(raw).toString().replace(/\/$/, "");
  } catch {
    return "https://andaction.in";
  }
}
