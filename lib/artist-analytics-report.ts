import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  formatAnalyticsReport,
  getArtistAnalytics,
} from "@/lib/artist-analytics";

const JOB_NAME = "artist-analytics-whatsapp-report";

function isDue(frequency: string, lastRun: Date | null) {
  if (!lastRun) return true;
  const days = frequency === "monthly" ? 28 : 7;
  return Date.now() - lastRun.getTime() >= days * 24 * 60 * 60 * 1000;
}

/**
 * Builds the same counts as the artist dashboard and stores the text report
 * on the existing cron_jobs row. Names and phone numbers are not included.
 */
export async function runArtistAnalyticsReports() {
  const artists = await prisma.artist.findMany({
    where: { whatsappNumber: { not: null } },
    select: { id: true, analyticsReportFrequency: true, stageName: true },
    take: 50,
  });

  const sent: string[] = [];
  for (const artist of artists) {
    const last = await prisma.cronJob.findFirst({
      where: { jobName: `${JOB_NAME}:${artist.id}`, status: "completed" },
      orderBy: { startedAt: "desc" },
      select: { startedAt: true },
    });
    if (!isDue(artist.analyticsReportFrequency, last?.startedAt ?? null)) continue;

    const range = artist.analyticsReportFrequency === "monthly" ? "month" : "week";
    const analytics = await getArtistAnalytics({ artistId: artist.id, range });
    const report = formatAnalyticsReport(analytics.counts);
    await prisma.cronJob.create({
      data: {
        jobName: `${JOB_NAME}:${artist.id}`,
        status: "completed",
        completedAt: new Date(),
        metadata: {
          artistId: artist.id,
          stageName: artist.stageName,
          frequency: artist.analyticsReportFrequency,
          report,
          counts: analytics.counts,
        } as Prisma.InputJsonValue,
      },
    });
    sent.push(artist.id);
  }
  return { prepared: sent.length, artistIds: sent };
}
