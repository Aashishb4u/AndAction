import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { InstagramDiscoveryAccount } from "@/lib/instagram-discovery";
import { buildProspectStageName, sanitizeText } from "@/lib/prospect-discovery";
import { getArtistTypeMatches } from "@/lib/artist-type-mapping";

interface UpsertProspectInput {
  username: string;
  account: InstagramDiscoveryAccount;
  sourceQuery: string;
  sourceTitle?: string | null;
  sourceSnippet?: string | null;
  sourceLink?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
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

  const contactNumbers = extractPhoneNumbers(input.account.biography || "");
  const artistType = getArtistTypeFromDiscoveryQuery(input.sourceQuery);

  const existingArtist = await prisma.artist.findFirst({
    where: {
      OR: existingArtistFilters,
    },
    select: { id: true },
  });

  if (existingArtist) {
    return {
      skippedBecauseArtistExists: true as const,
      skippedBecauseProspectExists: false as const,
      prospect: null,
    };
  }

  const existingProspectFilters: Prisma.ProspectWhereInput[] = [
    { instagramUsername: normalizedUsername },
  ];

  if (input.account.id) {
    existingProspectFilters.push({ instagramId: input.account.id });
  }

  const existingProspect = await prisma.prospect.findFirst({
    where: {
      OR: existingProspectFilters,
    },
    select: { id: true },
  });

  if (existingProspect) {
    return {
      skippedBecauseArtistExists: false as const,
      skippedBecauseProspectExists: true as const,
      prospect: null,
    };
  }

  const prospect = await prisma.prospect.create({
    data: {
      stageName: buildProspectStageName({
        account: input.account,
        title: input.sourceTitle,
        username: normalizedUsername,
      }),
      shortBio: sanitizeText(input.account.biography),
      biography: sanitizeText(input.account.biography),
      artistType,
      instagramId: input.account.id,
      instagramUsername: normalizedUsername,
      contactNumber: contactNumbers.length > 0 ? contactNumbers[0] || null : null,
      countryCode: "+91",
      profileImage: input.account.profile_picture_url || null,
      website: sanitizeText(input.account.website),
      followersCount: input.account.followers_count ?? null,
      followsCount: input.account.follows_count ?? null,
      mediaCount: input.account.media_count ?? null,
      sourceQuery: sanitizeText(input.sourceQuery),
      sourceTitle: sanitizeText(input.sourceTitle),
      sourceSnippet: sanitizeText(input.sourceSnippet),
      sourceLink: input.sourceLink || null,
      city: sanitizeText(input.city),
      state: sanitizeText(input.state),
      country: sanitizeText(input.country),
      lastEnrichedAt: new Date(),
    },
  });

  return {
    skippedBecauseArtistExists: false as const,
    skippedBecauseProspectExists: false as const,
    prospect,
  };
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
        city: sanitizeText(prospect.city),
        state: sanitizeText(prospect.state),
        avatar: prospect.profileImage || null,
        image: prospect.profileImage || null,
        role: "artist",
        isAccountVerified: true,
        isArtistVerified: true,
      },
    });

    const hasInstagramAccount =
      Boolean(prospect.instagramId) && Boolean(prospect.instagramUsername);
    const connectedAt = prospect.lastEnrichedAt || new Date();

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
        instagramConnectedAt: hasInstagramAccount ? connectedAt : null,
        instagramRefreshNextRunAt: hasInstagramAccount
          ? connectedAt
          : null,
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

function getArtistTypeFromDiscoveryQuery(query?: string | null): string | null {
  const normalizedQuery = sanitizeText(query);
  if (!normalizedQuery) return null;

  const strictMatch = normalizedQuery.match(
    /^site:instagram\.com\s+"Instagram photos and videos"\s+"([^"]+)"$/i,
  );
  const rawType =
    strictMatch?.[1]?.trim() ||
    Array.from(normalizedQuery.matchAll(/"([^"]+)"/g))
      .map((match) => match[1]?.trim())
      .filter(Boolean)
      .at(-1) ||
    "";

  if (!rawType) {
    return null;
  }

  return getArtistTypeMatches(rawType)[0] || rawType;
}

const MATHEMATICAL_BOLD_DIGITS = "𝟎𝟏𝟐𝟑𝟒𝟓𝟔𝟕𝟖𝟗";

function extractPhoneNumbers(text: string): string[] {
  if (!text) return [];

  // Convert fancy unicode digits (𝟘𝟙𝟚...) to normal digits
  const normalized = Array.from(text, (char) => {
    const digitIndex = MATHEMATICAL_BOLD_DIGITS.indexOf(char);
    return digitIndex >= 0 ? String(digitIndex) : char;
  }).join("");

  // Match phone-like strings
  const matches =
    normalized.match(/(?:\+?\d[\d\s().-]{8,}\d)/g) || [];

  const numbers = [];

  for (let phone of matches) {
    // Keep only digits
    phone = phone.replace(/\D/g, "");

    // Remove country code 91
    if (phone.length === 12 && phone.startsWith("91")) {
      phone = phone.substring(2);
    }

    // Sometimes people write 091xxxxxxxxxx
    if (phone.length === 11 && phone.startsWith("0")) {
      phone = phone.substring(1);
    }

    // Validate Indian mobile number
    if (/^[6-9]\d{9}$/.test(phone)) {
      numbers.push(phone);
    }
  }

  return [...new Set(numbers)];
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
