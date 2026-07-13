const DEFAULT_INSTAGRAM_REFRESH_INTERVAL_HOURS = 22;

export function getInstagramRefreshIntervalHours(): number {
  const configured = Number(
    process.env.INSTAGRAM_MEDIA_REFRESH_INTERVAL_HOURS ||
      DEFAULT_INSTAGRAM_REFRESH_INTERVAL_HOURS,
  );

  if (!Number.isFinite(configured) || configured <= 0) {
    return DEFAULT_INSTAGRAM_REFRESH_INTERVAL_HOURS;
  }

  return configured;
}

export function getInstagramRefreshIntervalMs(): number {
  return getInstagramRefreshIntervalHours() * 60 * 60 * 1000;
}

export function scheduleNextInstagramRefresh(
  from: Date = new Date(),
): Date {
  return new Date(from.getTime() + getInstagramRefreshIntervalMs());
}
