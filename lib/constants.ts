// Artist categories aligned with database and API mapping
export const ARTIST_CATEGORIES = [
  { value: "singer", label: "Singer" },
  { value: "spiritual", label: "Spiritual / Devotional" },
  { value: "dancer", label: "Dancer" },
  { value: "musician", label: "Musician" },
  { value: "comedian", label: "Comedian" },
  { value: "mimicry", label: "Mimicry Artist" },
  { value: "magician", label: "Magician" },
  { value: "actor", label: "Actor" },
  { value: "anchor", label: "Anchor / Host" },
  { value: "band", label: "Live Band" },
  { value: "dj", label: "DJ" },
  { value: "special-act", label: "Special Act" },
  { value: "kids-entertainer", label: "Kids Entertainer" },
];

// Video categories (includes "All" option)
export const VIDEO_CATEGORIES = [
  { value: "all", label: "All" },
  ...ARTIST_CATEGORIES,
];
