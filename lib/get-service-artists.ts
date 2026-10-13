import { prisma } from "@/lib/prisma";
import { getArtishName } from "@/lib/utils";

export type ServiceArtistCard = {
  id: string;
  name: string;
  image: string | null;
  city: string | null;
  state: string | null;
  category: string | null;
  yearsOfExperience: number | null;
  chargesFrom: number | null;
  languages: string | null;
  durationLabel: string | null;
  members: string | null;
  /** City, state, or performing states mention Delhi NCR. Bios are not used. */
  servesNcr: boolean;
  matched: boolean;
};

const NCR_TOKENS = [
  "delhi",
  "noida",
  "gurugram",
  "gurgaon",
  "ghaziabad",
  "faridabad",
  "greater noida",
  "ncr",
];

function toNumber(value: unknown): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function servesNcr(city: string | null, state: string | null, performingStates: string | null): boolean {
  const text = [city, state, performingStates].filter(Boolean).join(" ").toLowerCase();
  if (!text.trim()) return false;
  return NCR_TOKENS.some((token) => text.includes(token));
}

function durationLabel(from: string | null, to: string | null): string | null {
  const start = from?.trim() || "";
  const end = to?.trim() || "";
  if (start && end && start !== end) return `${start}–${end}`;
  return start || end || null;
}

/**
 * Public artist cards for a service page.
 * A profile is "matched" only when a service keyword appears in the artist's
 * name, bio, category, or event type — not in the city field.
 * Delhi NCR is decided only from city, state, and performing states.
 */
export async function getServiceArtists(
  keywords: string[],
): Promise<{ matched: ServiceArtistCard[]; related: ServiceArtistCard[] }> {
  const empty = { matched: [] as ServiceArtistCard[], related: [] as ServiceArtistCard[] };
  if (!keywords.length) return empty;

  try {
    const or = keywords.flatMap((keyword) => [
      { stageName: { contains: keyword, mode: "insensitive" as const } },
      { shortBio: { contains: keyword, mode: "insensitive" as const } },
      { subArtistType: { contains: keyword, mode: "insensitive" as const } },
      { performingEventType: { contains: keyword, mode: "insensitive" as const } },
      { artistType: { contains: keyword, mode: "insensitive" as const } },
    ]);

    const select = {
      id: true,
      stageName: true,
      artistType: true,
      subArtistType: true,
      yearsOfExperience: true,
      soloChargesFrom: true,
      profileImage: true,
      performingLanguage: true,
      performingDurationFrom: true,
      performingDurationTo: true,
      performingMembers: true,
      performingStates: true,
      user: {
        select: {
          firstName: true,
          lastName: true,
          city: true,
          state: true,
          avatar: true,
          image: true,
        },
      },
    } as const;

    const matchedRows = await prisma.artist.findMany({
      where: { OR: or },
      select,
      take: 12,
      orderBy: { updatedAt: "desc" },
    });

    const matchedIds = matchedRows.map((row) => row.id);

    const relatedRows = await prisma.artist.findMany({
      where: {
        id: { notIn: matchedIds },
        OR: [
          { artistType: { contains: "spiritual", mode: "insensitive" } },
          { artistType: { contains: "devotional", mode: "insensitive" } },
          { subArtistType: { contains: "bhajan", mode: "insensitive" } },
          { subArtistType: { contains: "devotional", mode: "insensitive" } },
        ],
      },
      select,
      take: 6,
      orderBy: { updatedAt: "desc" },
    });

    const mapRow = (
      row: (typeof matchedRows)[number],
      matched: boolean,
    ): ServiceArtistCard => ({
      id: row.id,
      name: getArtishName(row.stageName, row.user.firstName, row.user.lastName),
      image: row.profileImage || row.user.avatar || row.user.image || null,
      city: row.user.city,
      state: row.user.state,
      category: row.subArtistType || row.artistType,
      yearsOfExperience: row.yearsOfExperience,
      chargesFrom: toNumber(row.soloChargesFrom),
      languages: row.performingLanguage?.trim() || null,
      durationLabel: durationLabel(row.performingDurationFrom, row.performingDurationTo),
      members: row.performingMembers?.trim() || null,
      servesNcr: servesNcr(row.user.city, row.user.state, row.performingStates),
      matched,
    });

    const matched = matchedRows
      .map((row) => mapRow(row, true))
      .sort((a, b) => Number(b.servesNcr) - Number(a.servesNcr));

    return {
      matched,
      related: relatedRows.map((row) => mapRow(row, false)),
    };
  } catch (error) {
    console.error("getServiceArtists failed", error);
    return empty;
  }
}
