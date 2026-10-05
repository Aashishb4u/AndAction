import { prisma } from "@/lib/prisma";

export const PROFILE_VIEW = "PROFILE_VIEW";
export const WHATSAPP_CLICK = "WHATSAPP_CLICK";
export const CALL_CLICK = "CALL_CLICK";

export const ANALYTICS_EVENT_TYPES = [
  PROFILE_VIEW,
  WHATSAPP_CLICK,
  CALL_CLICK,
] as const;

export type AnalyticsEventType = (typeof ANALYTICS_EVENT_TYPES)[number];
export type AnalyticsRange = "today" | "week" | "month" | "custom";

const PAGE_SIZE = 20;

export function resolveDateRange(input: {
  range: AnalyticsRange;
  from?: string | null;
  to?: string | null;
}): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  if (input.range === "custom" && input.from && input.to) {
    const start = new Date(input.from);
    const customEnd = new Date(input.to);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(customEnd.getTime())) {
      start.setHours(0, 0, 0, 0);
      customEnd.setHours(23, 59, 59, 999);
      return { start, end: customEnd };
    }
  }

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (input.range === "week") {
    const day = start.getDay();
    const diff = day === 0 ? 6 : day - 1;
    start.setDate(start.getDate() - diff);
  } else if (input.range === "month") {
    start.setDate(1);
  }
  return { start, end };
}

function displayPhone(phone: string | null | undefined): string | null {
  const value = phone?.trim();
  return value ? value : null;
}

function contactFromUser(user: {
  phoneNumber: string | null;
  artists: { whatsappNumber: string | null; contactNumber: string | null }[];
} | null): string | null {
  if (!user) return null;
  if (user.phoneNumber?.trim()) return user.phoneNumber;
  const profile = user.artists[0];
  return profile?.whatsappNumber?.trim() || profile?.contactNumber?.trim() || null;
}

export async function recordArtistEvent(input: {
  artistId: string;
  type: AnalyticsEventType;
  userId?: string | null;
  visitorKey?: string | null;
}) {
  const artist = await prisma.artist.findUnique({
    where: { id: input.artistId },
    select: { id: true },
  });
  if (!artist) return null;

  return prisma.artistProfileEvent.create({
    data: {
      artistId: input.artistId,
      type: input.type,
      userId: input.userId || null,
      visitorKey: input.userId ? null : input.visitorKey || null,
    },
    select: { id: true },
  });
}

export async function getArtistAnalytics(input: {
  artistId: string;
  range: AnalyticsRange;
  from?: string | null;
  to?: string | null;
  type?: AnalyticsEventType | null;
  audience?: "platform" | "visitor" | null;
  page?: number;
}) {
  const { start, end } = resolveDateRange(input);
  const where = {
    artistId: input.artistId,
    createdAt: { gte: start, lte: end },
  };

  const splitFor = async (type: AnalyticsEventType, uniqueVisitors: boolean) => {
    const [platform, visitors] = await Promise.all([
      prisma.artistProfileEvent.count({
        where: { ...where, type, userId: { not: null } },
      }),
      uniqueVisitors
        ? prisma.artistProfileEvent.groupBy({
            by: ["visitorKey"],
            where: { ...where, type, userId: null, visitorKey: { not: null } },
          }).then((rows) => rows.length)
        : prisma.artistProfileEvent.count({
            where: { ...where, type, userId: null, visitorKey: { not: null } },
          }),
    ]);
    return { platform, visitors, total: platform + visitors };
  };

  const [profileSplit, whatsappSplit, callSplit, platformUsers, visitors, anonymousInteractions] =
    await Promise.all([
      splitFor(PROFILE_VIEW, true),
      splitFor(WHATSAPP_CLICK, false),
      splitFor(CALL_CLICK, false),
      prisma.artistProfileEvent.groupBy({
        by: ["userId"],
        where: { ...where, userId: { not: null } },
      }).then((rows) => rows.length),
      prisma.artistProfileEvent.groupBy({
        by: ["visitorKey"],
        where: { ...where, userId: null, visitorKey: { not: null } },
      }).then((rows) => rows.length),
      prisma.artistProfileEvent.count({ where: { ...where, userId: null } }),
    ]);

  const profileViews = profileSplit.total;
  const whatsappClicks = whatsappSplit.total;
  const callClicks = callSplit.total;

  const loggedInUsers = platformUsers;

  const page = Math.max(1, input.page || 1);
  const type = input.type && ANALYTICS_EVENT_TYPES.includes(input.type) ? input.type : null;
  const eventSelect = {
    id: true,
    type: true,
    createdAt: true,
    userId: true,
    user: {
      select: {
        firstName: true,
        lastName: true,
        name: true,
        phoneNumber: true,
        artists: {
          orderBy: { profileOrder: "asc" as const },
          take: 1,
          select: { whatsappNumber: true, contactNumber: true },
        },
      },
    },
  };
  let total = 0;
  let rows: Awaited<ReturnType<typeof prisma.artistProfileEvent.findMany<{ select: typeof eventSelect }>>> = [];

  const eventWhere = {
    ...where,
    ...(type ? { type, userId: { not: null } } : {}),
    ...(!type && input.audience === "platform" ? { userId: { not: null } } : {}),
    ...(!type && input.audience === "visitor" ? { userId: null } : {}),
  };
  const [eventTotal, eventRows] = await Promise.all([
    prisma.artistProfileEvent.count({ where: eventWhere }),
    prisma.artistProfileEvent.findMany({
      where: eventWhere,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: eventSelect,
    }),
  ]);
  total = eventTotal;
  rows = eventRows;

  return {
    range: { start: start.toISOString(), end: end.toISOString(), preset: input.range },
    counts: {
      profileViews,
      whatsappClicks,
      callClicks,
      loggedInUsers,
      anonymousInteractions,
      platformUsers,
      visitors,
      breakdown: {
        PROFILE_VIEW: { platform: profileSplit.platform, visitors: profileSplit.visitors },
        WHATSAPP_CLICK: { platform: whatsappSplit.platform, visitors: whatsappSplit.visitors },
        CALL_CLICK: { platform: callSplit.platform, visitors: callSplit.visitors },
      },
    },
    events: {
      page,
      pageSize: PAGE_SIZE,
      total,
      items: rows.map((row) => {
        const name = row.user
          ? [row.user.firstName, row.user.lastName].filter(Boolean).join(" ") ||
            row.user.name ||
            "User"
          : "Guest";
        return {
          id: row.id,
          type: row.type,
          createdAt: row.createdAt.toISOString(),
          userName: name,
          phone: displayPhone(contactFromUser(row.user)),
        };
      }),
    },
  };
}

export function formatAnalyticsReport(counts: {
  profileViews: number;
  whatsappClicks: number;
  callClicks: number;
  loggedInUsers: number;
  anonymousInteractions: number;
}) {
  const n = (value: number) => value.toLocaleString("en-IN");
  return [
    "Artist Analytics Report",
    "",
    `Profile Views: ${n(counts.profileViews)}`,
    `WhatsApp Clicks: ${n(counts.whatsappClicks)}`,
    `Call Clicks: ${n(counts.callClicks)}`,
    "",
    "Logged-in users:",
    String(counts.loggedInUsers),
    "",
    "Anonymous interactions:",
    String(counts.anonymousInteractions),
  ].join("\n");
}
