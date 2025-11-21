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
  soloChargesFrom: number | null;
  soloChargesTo: number | null;
  performingDurationFrom: number | null;
  performingDurationTo: number | null;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatar: string | null;
    city: string | null;
  };
};

export function transformArtist(raw: RawArtistFromAPI): Artist {
  const fullName =
    `${raw.user.firstName || ""} ${raw.user.lastName || ""}`.trim() ||
    raw.stageName ||
    "Unknown Artist";

  return {
    id: raw.id,
    name: fullName,
    category: capitalize(raw.artistType || "Artist"),
    location: capitalize(raw.user.city || "") || "Location not set",
    duration: `${raw.performingDurationFrom} - ${raw.performingDurationTo} mins`,
    startingPrice: raw.soloChargesFrom || 0,
    languages:
      raw.performingLanguage?.split(",").map((s) => capitalize(s.trim())) || [],
    image: raw.user.avatar || "",
    // TODO: Implement bookmark logic
    isBookmarked: false,
    yearsOfExperience: raw.yearsOfExperience || undefined,
  };
}

function capitalize(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
