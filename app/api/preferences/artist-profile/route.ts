import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Option = { value: string; label: string };

const DEFAULT_PREFERENCES: {
  languages: Option[];
  eventTypes: Option[];
  memberOptions: Option[];
  experienceYears: Option[];
  states: Option[];
  subArtistSuggestions: string[];
} = {
  languages: [
    { value: "hindi", label: "Hindi" },
    { value: "english", label: "English" },
    { value: "marathi", label: "Marathi" },
    { value: "gujarati", label: "Gujarati" },
    { value: "tamil", label: "Tamil" },
    { value: "telugu", label: "Telugu" },
    { value: "bengali", label: "Bengali" },
    { value: "punjabi", label: "Punjabi" },
    { value: "kannada", label: "Kannada" },
    { value: "malayalam", label: "Malayalam" },
    { value: "odia", label: "Odia" },
    { value: "assamese", label: "Assamese" },
    { value: "kashmiri", label: "Kashmiri" },
    { value: "konkani", label: "Konkani" },
    { value: "sindhi", label: "Sindhi" },
    { value: "nepali", label: "Nepali" },
    { value: "manipuri", label: "Manipuri" },
    { value: "sanskrit", label: "Sanskrit" },
    { value: "bodo", label: "Bodo" },
    { value: "santali", label: "Santali" },
    { value: "dogri", label: "Dogri" },
    { value: "maithili", label: "Maithili" },
  ],
  eventTypes: [
    { value: "wedding", label: "Wedding" },
    { value: "corporate", label: "Corporate Event" },
    { value: "birthday", label: "Birthday Party" },
    { value: "festival", label: "Festival" },
    { value: "concert", label: "Concert" },
    { value: "private-party", label: "Private Party" },
    { value: "cultural", label: "Cultural Event" },
    { value: "religious", label: "Religious Event" },
  ],
  memberOptions: [
    { value: "1", label: "1 Member" },
    { value: "2-5", label: "2-5 Members" },
    { value: "6-10", label: "6-10 Members" },
    { value: "11-20", label: "11-20 Members" },
    { value: "20+", label: "20+ Members" },
  ],
  experienceYears: [
    { value: "1", label: "0-1 years" },
    { value: "2", label: "1-3 years" },
    { value: "3", label: "3-5 years" },
    { value: "4", label: "5-10 years" },
    { value: "5", label: "10+ years" },
  ],
  states: [
    { value: "andhra-pradesh", label: "Andhra Pradesh" },
    { value: "arunachal-pradesh", label: "Arunachal Pradesh" },
    { value: "assam", label: "Assam" },
    { value: "bihar", label: "Bihar" },
    { value: "chhattisgarh", label: "Chhattisgarh" },
    { value: "goa", label: "Goa" },
    { value: "gujarat", label: "Gujarat" },
    { value: "haryana", label: "Haryana" },
    { value: "himachal-pradesh", label: "Himachal Pradesh" },
    { value: "jharkhand", label: "Jharkhand" },
    { value: "karnataka", label: "Karnataka" },
    { value: "kerala", label: "Kerala" },
    { value: "madhya-pradesh", label: "Madhya Pradesh" },
    { value: "maharashtra", label: "Maharashtra" },
    { value: "manipur", label: "Manipur" },
    { value: "meghalaya", label: "Meghalaya" },
    { value: "mizoram", label: "Mizoram" },
    { value: "nagaland", label: "Nagaland" },
    { value: "odisha", label: "Odisha" },
    { value: "punjab", label: "Punjab" },
    { value: "rajasthan", label: "Rajasthan" },
    { value: "sikkim", label: "Sikkim" },
    { value: "tamil-nadu", label: "Tamil Nadu" },
    { value: "telangana", label: "Telangana" },
    { value: "tripura", label: "Tripura" },
    { value: "uttar-pradesh", label: "Uttar Pradesh" },
    { value: "uttarakhand", label: "Uttarakhand" },
    { value: "west-bengal", label: "West Bengal" },
    { value: "andaman-and-nicobar-islands", label: "Andaman and Nicobar Islands" },
    { value: "chandigarh", label: "Chandigarh" },
    { value: "dadra-and-nagar-haveli-and-daman-and-diu", label: "Dadra and Nagar Haveli and Daman and Diu" },
    { value: "delhi", label: "Delhi" },
    { value: "jammu-and-kashmir", label: "Jammu and Kashmir" },
    { value: "ladakh", label: "Ladakh" },
    { value: "lakshadweep", label: "Lakshadweep" },
    { value: "puducherry", label: "Puducherry" },
  ],
  subArtistSuggestions: [
    "Classical",
    "Contemporary",
    "Folk",
    "Bollywood",
    "Western",
    "Fusion",
  ],
};

export async function GET() {
  try {
    const id = "artist_profile_setup";
    const existing = await prisma.artistProfilePreference.findUnique({
      where: { id },
    });

    const record =
      existing ??
      (await prisma.artistProfilePreference.create({
        data: {
          id,
          languages: DEFAULT_PREFERENCES.languages,
          eventTypes: DEFAULT_PREFERENCES.eventTypes,
          memberOptions: DEFAULT_PREFERENCES.memberOptions,
          experienceYears: DEFAULT_PREFERENCES.experienceYears,
          states: DEFAULT_PREFERENCES.states,
          subArtistSuggestions: DEFAULT_PREFERENCES.subArtistSuggestions,
        },
      }));

    const preferences = {
      languages: record.languages as unknown as Option[],
      eventTypes: record.eventTypes as unknown as Option[],
      memberOptions: record.memberOptions as unknown as Option[],
      experienceYears: record.experienceYears as unknown as Option[],
      states: record.states as unknown as Option[],
      subArtistSuggestions: record.subArtistSuggestions as unknown as string[],
    };

    return NextResponse.json({ success: true, data: { preferences } });
  } catch (error) {
    console.error("Failed to fetch artist profile preferences", error);
    return NextResponse.json(
      { success: false, data: { preferences: DEFAULT_PREFERENCES } },
      { status: 500 },
    );
  }
}

