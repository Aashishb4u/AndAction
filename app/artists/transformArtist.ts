import type { Artist } from "@/types";

type RawArtistFromAPI = {
  id: string;
  profileImage?: string | null;
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
  performingDurationFrom: string | number | null;
  performingDurationTo: string | number | null;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatar: string | null;
    city: string | null;
    state?: string | null;
  };
};

export function transformArtist(raw: RawArtistFromAPI): Artist {
  const fullName =
    (raw.stageName || "").trim() ||
    `${raw.user.firstName || ""} ${raw.user.lastName || ""}`.trim() ||
    "Unknown Artist";

  let duration = "N/A";

  let fromNum: number | null = null;
  let toNum: number | null = null;

  if (raw.performingDurationFrom) {
    if (typeof raw.performingDurationFrom === "number") {
      fromNum = raw.performingDurationFrom;
    } else if (typeof raw.performingDurationFrom === "string") {
      // Check if it's a range string like "120-150"
      if (raw.performingDurationFrom.includes("-")) {
        const parts = raw.performingDurationFrom.split("-");
        fromNum = parseInt(parts[0].trim(), 10);
        // Extract the second value as toNum if not already set
        if (parts[1]) {
          const secondNum = parseInt(parts[1].trim(), 10);
          if (!isNaN(secondNum)) toNum = secondNum;
        }
      } else {
        fromNum = parseInt(raw.performingDurationFrom, 10);
      }
      if (isNaN(fromNum)) fromNum = null;
    }
  }

  if (!toNum && raw.performingDurationTo) {
    if (typeof raw.performingDurationTo === "number") {
      toNum = raw.performingDurationTo;
    } else if (typeof raw.performingDurationTo === "string") {
      toNum = parseInt(raw.performingDurationTo, 10);
      if (isNaN(toNum)) toNum = null;
    }
  }

  // Build duration string
  if (fromNum && toNum) {
    if (toNum > fromNum) {
      duration = `${fromNum} - ${toNum} mins`;
    } else if (fromNum === toNum) {
      duration = `${fromNum} mins`;
    }
  } else if (fromNum) {
    duration = `${fromNum} mins`;
  }

  return {
    userId: raw.user.id,
    id: raw.id,
    name: fullName,
    category: capitalize(raw.artistType || "Artist"),
    location: capitalize(raw.user.state || ""),
    duration,
    startingPrice: raw.soloChargesFrom || 0,
    languages:
      raw.performingLanguage?.split(",").map((s) => capitalize(s.trim())) || [],
    image: raw.profileImage || raw.user.avatar || "/avatars/default.jpg",
    // TODO: Implement bookmark logic
    isBookmarked: false,
    yearsOfExperience: raw.yearsOfExperience || undefined,
  };
}

function capitalize(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
