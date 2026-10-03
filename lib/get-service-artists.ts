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
  matched: boolean;
};

function toNumber(value: unknown): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Public artist cards for a service page.
 * `keywords` must appear in profile text. Broader devotional profiles are
 * returned separately and labelled as related, not as confirmed providers
 * of this exact programme.
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
      take: 8,
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
      matched,
    });

    return {
      matched: matchedRows.map((row) => mapRow(row, true)),
      related: relatedRows.map((row) => mapRow(row, false)),
    };
  } catch (error) {
    console.error("getServiceArtists failed", error);
    return empty;
  }
}
