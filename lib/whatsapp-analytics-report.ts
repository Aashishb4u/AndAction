import { prisma } from "@/lib/prisma";
import { getArtistAnalytics } from "@/lib/artist-analytics";
import { sendWhatsappText, toWhatsappRecipient } from "@/lib/whatsapp";
import { acceptedSendRecord } from "@/lib/whatsapp-report-delivery";

const IST = "Asia/Kolkata";
export const WHATSAPP_REPORT_GAP_MS = 5 * 60 * 1000;
export const WHATSAPP_REPORT_CONTROL_ID = "whatsapp_analytics_reports";
const LOCK_PREFIX = "LOCK:";

/** Missing control row keeps the existing cron active. */
export function isWhatsappReportCronPaused(paused: boolean | null | undefined): boolean {
  return paused === true;
}

export function reportIntervalDays(frequency: string): number | null {
  if (frequency === "monthly") return 30;
  if (frequency === "weekly") return 7;
  return null;
}

export function reportTypeForFrequency(frequency: string): "WEEKLY" | "MONTHLY" | null {
  if (frequency === "monthly") return "MONTHLY";
  if (frequency === "weekly") return "WEEKLY";
  return null;
}

/** Eligible when no successful send exists, or the interval has fully elapsed. */
export function isReportDue(
  lastSentAt: Date | null,
  intervalDays: number,
  now: Date = new Date(),
): boolean {
  if (!lastSentAt) return true;
  return now.getTime() - lastSentAt.getTime() >= intervalDays * 24 * 60 * 60 * 1000;
}

function kolkataDateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: IST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function shiftDateKey(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  utc.setUTCDate(utc.getUTCDate() + days);
  const y = utc.getUTCFullYear();
  const m = String(utc.getUTCMonth() + 1).padStart(2, "0");
  const d = String(utc.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function reportPeriod(intervalDays: number, now: Date = new Date()) {
  const endKey = kolkataDateKey(now);
  const startKey = shiftDateKey(endKey, -intervalDays);
  return {
    periodStart: new Date(`${startKey}T00:00:00+05:30`),
    periodEnd: new Date(`${endKey}T23:59:59.999+05:30`),
    label: `${formatPeriodLabel(startKey)} → ${formatPeriodLabel(endKey)}`,
    from: startKey,
    to: endKey,
  };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatPeriodLabel(dateKey: string): string {
  const [, month, day] = dateKey.split("-");
  return `${day} ${MONTHS[Number(month) - 1]}`;
}

export function formatWhatsappAnalyticsMessage(input: {
  periodLabel: string;
  profileViews: number;
  whatsappClicks: number;
  callClicks: number;
  platformUsers: number;
  visitors: number;
}): string {
  const n = (value: number) => value.toLocaleString("en-IN");
  return [
    "Artist Analytics Report",
    `Period: ${input.periodLabel}`,
    "",
    `Profile Views: ${n(input.profileViews)}`,
    `WhatsApp Clicks: ${n(input.whatsappClicks)}`,
    `Call Clicks: ${n(input.callClicks)}`,
    `Platform Users: ${n(input.platformUsers)}`,
    `Visitors: ${n(input.visitors)}`,
  ].join("\n");
}

export async function runWhatsappAnalyticsReportTick(now: Date = new Date()) {
  const control = await prisma.whatsappReportControl.findUnique({
    where: { id: WHATSAPP_REPORT_CONTROL_ID },
    select: { paused: true },
  });
  if (isWhatsappReportCronPaused(control?.paused)) {
    return {
      enqueued: 0,
      sent: 0,
      failed: 0,
      skipped: "paused by admin",
    };
  }

  const enqueued = await enqueueDueReports(now);
  const latestSent = await prisma.whatsappReport.findFirst({
    where: { status: "SENT", sentAt: { not: null } },
    orderBy: { sentAt: "desc" },
    select: { sentAt: true },
  });

  if (
    latestSent?.sentAt &&
    now.getTime() - latestSent.sentAt.getTime() < WHATSAPP_REPORT_GAP_MS
  ) {
    return {
      enqueued,
      sent: 0,
      failed: 0,
      skipped: "waiting for the 5 minute gap since the last successful send",
    };
  }

  const staleLockBefore = new Date(now.getTime() - WHATSAPP_REPORT_GAP_MS);
  const next = await prisma.whatsappReport.findFirst({
    where: {
      status: "PENDING",
      OR: [
        { message: null },
        { message: { startsWith: LOCK_PREFIX }, updatedAt: { lt: staleLockBefore } },
      ],
    },
    orderBy: { createdAt: "asc" },
    include: {
      artist: {
        select: {
          id: true,
          stageName: true,
          whatsappNumber: true,
          contactNumber: true,
          user: { select: { countryCode: true } },
        },
      },
    },
  });

  if (!next) {
    return { enqueued, sent: 0, failed: 0, skipped: "no pending reports" };
  }

  const lock = `${LOCK_PREFIX}${now.getTime()}`;
  const claimed = await prisma.whatsappReport.updateMany({
    where: {
      id: next.id,
      status: "PENDING",
      OR: [
        { message: null },
        { message: { startsWith: LOCK_PREFIX }, updatedAt: { lt: staleLockBefore } },
      ],
    },
    data: { message: lock },
  });

  if (claimed.count !== 1) {
    return { enqueued, sent: 0, failed: 0, skipped: "report already claimed" };
  }

  const periodLabel = `${formatPeriodLabel(kolkataDateKey(next.periodStart))} → ${formatPeriodLabel(kolkataDateKey(next.periodEnd))}`;
  const analytics = await getArtistAnalytics({
    artistId: next.artistId,
    range: "custom",
    from: kolkataDateKey(next.periodStart),
    to: kolkataDateKey(next.periodEnd),
  });
  const text = formatWhatsappAnalyticsMessage({
    periodLabel,
    profileViews: analytics.counts.profileViews,
    whatsappClicks: analytics.counts.whatsappClicks,
    callClicks: analytics.counts.callClicks,
    platformUsers: analytics.counts.platformUsers,
    visitors: analytics.counts.visitors,
  });

  const to = toWhatsappRecipient(
    next.artist.whatsappNumber || next.artist.contactNumber,
    next.artist.user?.countryCode,
  );

  if (!to) {
    await prisma.whatsappReport.update({
      where: { id: next.id },
      data: {
        status: "FAILED",
        message: `${text}\n\nSend failed: No valid Indian WhatsApp number`,
      },
    });
    return { enqueued, sent: 0, failed: 1, reportId: next.id };
  }

  const result = await sendWhatsappText({ to, body: text });
  if (result.success) {
    const sentAt = new Date();
    await prisma.whatsappReport.update({
      where: { id: next.id },
      data: acceptedSendRecord({
        message: text,
        messageId: result.messageId || "",
        sentAt,
      }),
    });
    return { enqueued, sent: 1, failed: 0, reportId: next.id };
  }

  await prisma.whatsappReport.update({
    where: { id: next.id },
    data: {
      status: "FAILED",
      message: `${text}\n\nSend failed: ${result.error || "Unknown WhatsApp error"}`,
    },
  });
  return { enqueued, sent: 0, failed: 1, reportId: next.id, error: result.error };
}

async function enqueueDueReports(now: Date) {
  const artists = await prisma.artist.findMany({
    where: {
      analyticsReportFrequency: { in: ["weekly", "monthly"] },
      OR: [{ whatsappNumber: { not: null } }, { contactNumber: { not: null } }],
    },
    select: { id: true, analyticsReportFrequency: true },
    orderBy: { createdAt: "asc" },
  });

  let created = 0;
  for (const artist of artists) {
    const intervalDays = reportIntervalDays(artist.analyticsReportFrequency);
    const type = reportTypeForFrequency(artist.analyticsReportFrequency);
    if (!intervalDays || !type) continue;

    const lastSent = await prisma.whatsappReport.findFirst({
      where: { artistId: artist.id, type, status: "SENT" },
      orderBy: { sentAt: "desc" },
      select: { sentAt: true },
    });
    if (!isReportDue(lastSent?.sentAt ?? null, intervalDays, now)) continue;

    const period = reportPeriod(intervalDays, now);
    const existing = await prisma.whatsappReport.findUnique({
      where: {
        artistId_type_periodStart_periodEnd: {
          artistId: artist.id,
          type,
          periodStart: period.periodStart,
          periodEnd: period.periodEnd,
        },
      },
      select: { id: true, status: true },
    });
    if (existing) continue;

    try {
      await prisma.whatsappReport.create({
        data: {
          artistId: artist.id,
          type,
          periodStart: period.periodStart,
          periodEnd: period.periodEnd,
          status: "PENDING",
        },
      });
      created++;
    } catch (error) {
      const code =
        error && typeof error === "object" && "code" in error
          ? String(error.code)
          : "";
      if (code !== "P2002") throw error;
    }
  }
  return created;
}
