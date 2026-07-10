import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { InstagramDiscoveryAccount } from "@/lib/instagram-discovery";
import { buildProspectStageName, sanitizeText } from "@/lib/prospect-discovery";

interface UpsertProspectInput {
  username: string;
  account: InstagramDiscoveryAccount;
  sourceQuery: string;
  sourceTitle?: string | null;
  sourceSnippet?: string | null;
  sourceLink?: string | null;
}

interface AcceptProspectInput {
  prospectId: string;
  acceptedByUserId?: string | null;
}

export async function upsertProspectFromInstagramDiscovery(
  input: UpsertProspectInput,
) {
  const normalizedUsername = normalizeInstagramUsername(input.username);
  const existingArtistFilters: Prisma.ArtistWhereInput[] = [
    { instagramUsername: normalizedUsername },
  ];

  if (input.account.id) {
    existingArtistFilters.push({ instagramId: input.account.id });
  }

  const existingArtist = await prisma.artist.findFirst({
    where: {
      OR: existingArtistFilters,
    },
    select: { id: true },
  });

  if (existingArtist) {
    return { skippedBecauseArtistExists: true as const, prospect: null };
  }

  const prospect = await prisma.prospect.upsert({
    where: { instagramUsername: normalizedUsername },
    update: {
      stageName: buildProspectStageName({
        account: input.account,
        title: input.sourceTitle,
        username: normalizedUsername,
      }),
      shortBio: sanitizeText(input.account.biography),
      biography: sanitizeText(input.account.biography),
      instagramId: input.account.id,
      instagramUsername: normalizedUsername,
      profileImage: input.account.profile_picture_url || null,
      website: sanitizeText(input.account.website),
      followersCount: input.account.followers_count ?? null,
      followsCount: input.account.follows_count ?? null,
      mediaCount: input.account.media_count ?? null,
      sourceQuery: sanitizeText(input.sourceQuery),
      sourceTitle: sanitizeText(input.sourceTitle),
      sourceSnippet: sanitizeText(input.sourceSnippet),
      sourceLink: input.sourceLink || null,
      lastEnrichedAt: new Date(),
    },
    create: {
      stageName: buildProspectStageName({
        account: input.account,
        title: input.sourceTitle,
        username: normalizedUsername,
      }),
      shortBio: sanitizeText(input.account.biography),
      biography: sanitizeText(input.account.biography),
      instagramId: input.account.id,
      instagramUsername: normalizedUsername,
      profileImage: input.account.profile_picture_url || null,
      website: sanitizeText(input.account.website),
      followersCount: input.account.followers_count ?? null,
      followsCount: input.account.follows_count ?? null,
      mediaCount: input.account.media_count ?? null,
      sourceQuery: sanitizeText(input.sourceQuery),
      sourceTitle: sanitizeText(input.sourceTitle),
      sourceSnippet: sanitizeText(input.sourceSnippet),
      sourceLink: input.sourceLink || null,
      lastEnrichedAt: new Date(),
    },
  });

  return { skippedBecauseArtistExists: false as const, prospect };
}

export async function acceptProspectAndConvertToArtist(
  input: AcceptProspectInput,
) {
  return prisma.$transaction(async (tx) => {
    const prospect = await tx.prospect.findUnique({
      where: { id: input.prospectId },
    });

    if (!prospect) {
      throw new Error("PROSPECT_NOT_FOUND");
    }

    if (prospect.status === "accepted" && prospect.convertedArtistId) {
      throw new Error("PROSPECT_ALREADY_ACCEPTED");
    }

    const duplicateArtistFilters: Prisma.ArtistWhereInput[] = [];

    if (prospect.instagramUsername) {
      duplicateArtistFilters.push({
        instagramUsername: prospect.instagramUsername,
      });
    }

    if (prospect.instagramId) {
      duplicateArtistFilters.push({ instagramId: prospect.instagramId });
    }

    const duplicateArtist =
      duplicateArtistFilters.length > 0
        ? await tx.artist.findFirst({
            where: {
              OR: duplicateArtistFilters,
            },
            select: { id: true },
          })
        : null;

    if (duplicateArtist) {
      throw new Error("ARTIST_ALREADY_EXISTS");
    }

    const normalizedEmail = normalizeEmail(prospect.contactEmail);
    const normalizedPhone = normalizePhone(prospect.contactNumber);

    if (normalizedEmail) {
      const existingUserByEmail = await tx.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true },
      });
      if (existingUserByEmail) {
        throw new Error("USER_EMAIL_ALREADY_EXISTS");
      }
    }

    if (normalizedPhone) {
      const existingUserByPhone = await tx.user.findFirst({
        where: { phoneNumber: normalizedPhone },
        select: { id: true },
      });
      if (existingUserByPhone) {
        throw new Error("USER_PHONE_ALREADY_EXISTS");
      }
    }

    const displayName =
      sanitizeText(prospect.stageName) ||
      sanitizeText(prospect.instagramUsername) ||
      "Instagram Prospect";
    const { firstName, lastName } = splitName(displayName);

    const user = await tx.user.create({
      data: {
        name: displayName,
        firstName,
        lastName,
        email: normalizedEmail,
        phoneNumber: normalizedPhone,
        countryCode: prospect.countryCode || (normalizedPhone ? "+91" : null),
        avatar: prospect.profileImage || null,
        image: prospect.profileImage || null,
        role: "artist",
        isAccountVerified: true,
        isArtistVerified: true,
      },
    });

    const artist = await tx.artist.create({
      data: {
        userId: user.id,
        profileOrder: 0,
        stageName: displayName,
        artistType: prospect.artistType,
        subArtistType: prospect.subArtistType,
        achievements: prospect.achievements,
        yearsOfExperience: prospect.yearsOfExperience,
        shortBio: prospect.shortBio || prospect.biography,
        performingLanguage: prospect.performingLanguage,
        performingEventType: prospect.performingEventType,
        performingStates: prospect.performingStates,
        performingDurationFrom: prospect.performingDurationFrom,
        performingDurationTo: prospect.performingDurationTo,
        performingMembers: prospect.performingMembers,
        offStageMembers: prospect.offStageMembers,
        contactNumber: normalizedPhone,
        whatsappNumber: normalizePhone(prospect.whatsappNumber),
        contactEmail: normalizedEmail,
        soloChargesFrom: prospect.soloChargesFrom,
        soloChargesTo: prospect.soloChargesTo,
        soloChargesDescription: prospect.soloChargesDescription,
        chargesWithBacklineFrom: prospect.chargesWithBacklineFrom,
        chargesWithBacklineTo: prospect.chargesWithBacklineTo,
        chargesWithBacklineDescription: prospect.chargesWithBacklineDescription,
        instagramId: prospect.instagramId,
        instagramUsername: prospect.instagramUsername,
        instagramConnectedAt: prospect.lastEnrichedAt || new Date(),
        profileImage: prospect.profileImage,
      },
    });

    const updatedProspect = await tx.prospect.update({
      where: { id: prospect.id },
      data: {
        status: "accepted",
        acceptedAt: new Date(),
        rejectedAt: null,
        acceptedByUserId: input.acceptedByUserId || null,
        convertedUserId: user.id,
        convertedArtistId: artist.id,
      },
    });

    return {
      prospect: updatedProspect,
      user,
      artist,
    };
  });
}

function splitName(displayName: string): { firstName: string; lastName: string | null } {
  const trimmed = displayName.trim();
  const parts = trimmed.split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return { firstName: "Artist", lastName: null };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: null };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

function normalizeInstagramUsername(value: string): string {
  return value.trim().replace(/^@/, "").toLowerCase();
}

function normalizeEmail(value?: string | null): string | null {
  const cleaned = sanitizeText(value);
  return cleaned ? cleaned.toLowerCase() : null;
}

function normalizePhone(value?: string | null): string | null {
  if (!value) return null;

  const digits = value.replace(/\D/g, "");
  return digits || null;
}
