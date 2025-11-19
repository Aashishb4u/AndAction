import type { Artist } from "@/types";

type RawArtistFromAPI = {
  id: string;
  stageName: string | null;
  artistType: string | null;
  subArtistType: string | null;
  shortBio: string | null;
  performingLanguage: string | null;
  performingEventType: string | null;
  performingStates: string | null;
  yearsOfExperience: number | null;
  soloChargesFrom: string | null;
  soloChargesTo: string | null;
  performingDurationFrom: number | null;
  performingDurationTo: number | null;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatar: string | null;
    city: string | null;
    phoneNumber: string | null;
  };
  whatsappNumber: string | null
  achievements: string[] | null;
  performingMembers: string | null;
  offStageMembers: string | null;
  chargesWithBacklineFrom: string | null;
  chargesWithBacklineTo: string | null;
};

export function transformArtist(raw: RawArtistFromAPI): Artist {
  const fullName =
    `${raw.user.firstName || ""} ${raw.user.lastName || ""}`.trim() ||
    raw.stageName ||
    "Unknown Artist";

  return {
    id: raw.id,
    name: fullName,
    stageName: raw.stageName || undefined,
    category: capitalize(raw.artistType || "Artist"),
    location: capitalize(raw.user.city || "") || "Location not set",
    duration: `${raw.performingDurationFrom} - ${raw.performingDurationTo} mins`,
    startingPrice: Number(raw.soloChargesFrom) || 0,
    languages:
      raw.performingLanguage?.split(",").map((s) => capitalize(s.trim())) || [],
    image: raw.user.avatar || "",
    phone: raw.user.phoneNumber || undefined,
    whatsapp: raw.whatsappNumber || undefined,
    // TODO: Implement bookmark logic
    isBookmarked: false,
    performingStates: raw.performingStates?.split(",").map((s) => capitalize(s.trim())) || undefined,
    yearsOfExperience: raw.yearsOfExperience || undefined,
    bio: raw.shortBio || undefined,
    subArtistTypes: raw.subArtistType?.split(',').map((s) => capitalize(s.trim())) || undefined,
    achievements: raw.achievements || undefined,
    performingMembers: Number(raw.performingMembers).toLocaleString() || undefined,
    soloChargesFrom: Number(raw.soloChargesFrom).toLocaleString() || undefined,
    soloChargesTo: Number(raw.soloChargesTo).toLocaleString() || undefined,
    backlineChargesFrom: Number(raw.chargesWithBacklineFrom).toLocaleString() || undefined,
    backlineChargesTo: Number(raw.chargesWithBacklineTo).toLocaleString() || undefined,
    offStageMembers: Number(raw.offStageMembers).toLocaleString() || undefined,
    performingEventType: raw.performingEventType?.split(',').map((s) => capitalize(s.trim())) || undefined,
  };
}

function capitalize(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}