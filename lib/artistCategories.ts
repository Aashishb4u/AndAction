// Centralized mapping for artist category display names
// Source of truth for display labels used across the site.

export const TITLE_MAP: Record<string, string> = {
  liveBands: "Live Band",
  devotionalSpiritualSingers: "Devotional/Spiritual Singer",
  singers: "Singer",
  anchorEmceeHosts: "Anchor/Emcee/Host",
  djVjs: "DJ/VJ",
  djBasedBands: "DJ based Band",
  djPercussionists: "DJ Percussionist",
  musiciansInstrumentalists: "Musician/Instrumentalist",
  dancersDanceGroups: "Dancer/Dance group",
  magicialIllusionists: "Magicial/Illusionist",
  comedianMimicry: "Comedian/Mimicry",
  specialActPerformers: "Special act performer",
  motivationalSpeakers: "Motivational speaker",
  kidsEntertainers: "Kids Entertainer",
  folkArtists: "Folk Artist",
  models: "Model",
};

export const PREFERRED_ORDER = [
  "liveBands",
  "devotionalSpiritualSingers",
  "singers",
  "anchorEmceeHosts",
  "djVjs",
  "djBasedBands",
  "djPercussionists",
  "musiciansInstrumentalists",
  "dancersDanceGroups",
  "magicialIllusionists",
  "comedianMimicry",
  "specialActPerformers",
  "motivationalSpeakers",
  "kidsEntertainers",
  "folkArtists",
  "models",
];

export function prettifyKey(key: string) {
  const withoutS = key.replace(/s$/, "");
  return withoutS.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// Map video/category 'value' strings used in constants to TITLE_MAP keys.
// This keeps existing value strings (query params) stable while using
// the TITLE_MAP labels for display.
export const VALUE_TO_KEY: Record<string, string> = {
  "live-band": 'liveBands',
  "live band": 'liveBands',
  "live band ": 'liveBands',
  "Live Band": 'liveBands',
  "Live Band ": 'liveBands',
  band: 'liveBands',
  bands: 'liveBands',
  singer: 'singers',
  spiritual: 'devotionalSpiritualSingers',
  "devotional-spiritual-singer": 'devotionalSpiritualSingers',
  dancer: 'dancersDanceGroups',
  musician: 'musiciansInstrumentalists',
  anchor: 'anchorEmceeHosts',
  dj: 'djVjs',
  "dj-vj": 'djVjs',
  "dj-based-band": 'djBasedBands',
  "dj-percussionist": 'djPercussionists',
  magician: 'magicialIllusionists',
  "magicial-illusionist": 'magicialIllusionists',
  "comedian-mimicry": 'comedianMimicry',
  comedian: 'comedianMimicry',
  mimicry: 'comedianMimicry',
  "special-act": 'specialActPerformers',
  "special-act-performer": 'specialActPerformers',
  "motivational-speaker": 'motivationalSpeakers',
  "kids-entertainer": 'kidsEntertainers',
  kidsEntertainer: 'kidsEntertainers',
  "folk-artist": 'folkArtists',
  model: 'models',
};

export function getLabelForValue(value: string) {
  const key = VALUE_TO_KEY[value] || value;
  return TITLE_MAP[key] || prettifyKey(key);
}

// Reverse map: from TITLE_MAP key -> standard query value (if known)
const KEY_TO_VALUE: Record<string, string> = Object.keys(VALUE_TO_KEY).reduce(
  (acc, k) => {
    const key = VALUE_TO_KEY[k];
    if (key && !acc[key]) acc[key] = k;
    return acc;
  },
  {} as Record<string, string>,
);

export function getValueForKey(key: string) {
  const normalizedKey = key.trim().toLowerCase();
  if (
    key === "liveBands" ||
    key === "live-band" ||
    normalizedKey === "live band" ||
    normalizedKey === "band" ||
    normalizedKey === "bands"
  ) {
    return "Live Band";
  }
  return KEY_TO_VALUE[key] || key;
}
