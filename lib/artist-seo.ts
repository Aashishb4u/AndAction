import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { formatDisplayLabel, getArtishName } from "@/lib/utils";

export type ArtistSeo = {
  id: string;
  name: string;
  category: string | null;
  city: string | null;
  state: string | null;
  bio: string | null;
  image: string | null;
};

/** Public SEO fields for one artist. Returns null when missing or the DB is unreachable. */
export const getArtistSeo = cache(async (id: string): Promise<ArtistSeo | null> => {
  try {
    const row = await prisma.artist.findUnique({
      where: { id },
      select: {
        id: true,
        stageName: true,
        artistType: true,
        subArtistType: true,
        shortBio: true,
        profileImage: true,
        user: {
          select: { firstName: true, lastName: true, city: true, state: true, avatar: true, image: true },
        },
      },
    });
    if (!row) return null;
    const category = row.subArtistType || row.artistType;
    return {
      id: row.id,
      name: getArtishName(row.stageName, row.user?.firstName ?? null, row.user?.lastName ?? null),
      category: category ? formatDisplayLabel(category.split(/[,/]+/)[0]) : null,
      city: row.user?.city ?? null,
      state: row.user?.state ?? null,
      bio: row.shortBio?.replace(/\s+/g, " ").trim() || null,
      image: row.profileImage || row.user?.avatar || row.user?.image || null,
    };
  } catch {
    return null;
  }
});
