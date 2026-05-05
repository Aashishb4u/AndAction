import { Artist } from "@/types";
import { normalizeArtistCategoryValue } from "@/lib/artist-category-utils";

export type AboutDraft = {
  stageName: string;
  artistType: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  pinCode: string;
  state: string;
  city: string;
  contactNumber: string;
  whatsappNumber: string;
  email: string;
  achievements: string;
  yearsOfExperience: string;
  shortBio: string;
  subArtistTypes: string[];
};

export type PerformanceDraft = {
  performingLanguages: string[];
  eventTypes: string[];
  performingStates: string[];
  minDuration: string;
  maxDuration: string;
  performingMembers: string;
  offStageMembers: string;
  soloChargesFrom: string;
  soloChargesDescription: string;
  chargesWithBacklineFrom: string;
  chargesWithBacklineDescription: string;
};

const parseCSV = (value: string | undefined | null): string[] => {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
};

export function createAboutDraft(artist: Artist): AboutDraft {
  const extendedArtist = artist as any;
  const rawArtistType =
    (extendedArtist?.tags?.[0] as string | undefined) || artist.category || "";

  const rawSubArtistType = (extendedArtist?.subArtistType as string | undefined) || "";
  const subArtistTypes = rawSubArtistType
    ? rawSubArtistType
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  return {
    stageName: artist.name || "",
    artistType: normalizeArtistCategoryValue(rawArtistType),
    firstName: extendedArtist.firstName || "",
    lastName: extendedArtist.lastName || "",
    dateOfBirth: extendedArtist.dateOfBirth || "",
    gender: (artist.gender || "").toLowerCase(),
    address: extendedArtist.address || "",
    pinCode: extendedArtist.pinCode || "",
    state: (extendedArtist.state || "").toLowerCase(),
    city: (extendedArtist.city || "").toLowerCase(),
    contactNumber: extendedArtist.contactNumber || extendedArtist.phone || "",
    whatsappNumber:
      extendedArtist.whatsappNumber ||
      extendedArtist.contactNumber ||
      extendedArtist.whatsapp ||
      extendedArtist.phone ||
      "",
    email: extendedArtist.contactEmail || extendedArtist.email || "",
    achievements: Array.isArray(artist.achievements)
      ? artist.achievements.join(", ")
      : artist.achievements || "",
    yearsOfExperience: artist.yearsOfExperience?.toString() || "4",
    shortBio: artist.bio || "",
    subArtistTypes,
  };
}

export function createPerformanceDraft(artist: Artist): PerformanceDraft {
  return {
    performingLanguages: parseCSV((artist as any).performingLanguage),
    eventTypes: parseCSV((artist as any).performingEventType),
    performingStates: parseCSV((artist as any).performingStates),
    minDuration: (artist as any).performingDurationFrom || "",
    maxDuration: (artist as any).performingDurationTo || "",
    performingMembers: (artist as any).performingMembers || "",
    offStageMembers: (artist as any).offStageMembers || "",
    soloChargesFrom: (artist as any).soloChargesFrom?.toString() || "",
    soloChargesDescription: (artist as any).soloChargesDescription || "",
    chargesWithBacklineFrom:
      (artist as any).chargesWithBacklineFrom?.toString() || "",
    chargesWithBacklineDescription:
      (artist as any).chargesWithBacklineDescription || "",
  };
}
