// Centralized mapping for artist category display names
// Source of truth for display labels used across the site.

export const TITLE_MAP: Record<string, string> = {
  singers: "Singer",
  dancers: "Dancer / Dance Group",
  anchors: "Anchor / Emcee / Host",
  djs: "DJ",
  bands: "Live Band / Group",
  comedians: "Comedian",
  musicians: "Musician / Instrumentalist",
  magicians: "Magician / Illusionist",
  actors: "Theatre Artist / Actor",
  mimicry: "Mimicry / Impressionist",
  specialAct: "Special Act Performer",
  spiritual: "Spiritual / Devotional",
  kidsEntertainers: "Kids Entertainer",
};

export const PREFERRED_ORDER = [
  "singers",
  "dancers",
  "musicians",
  "anchors",
  "djs",
  "bands",
  "comedians",
  "magicians",
  "actors",
  "mimicry",
  "specialAct",
  "spiritual",
  "kidsEntertainers",
];

export function prettifyKey(key: string) {
  const withoutS = key.replace(/s$/, "");
  return withoutS.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// Map video/category 'value' strings used in constants to TITLE_MAP keys.
// This keeps existing value strings (query params) stable while using
// the TITLE_MAP labels for display.
export const VALUE_TO_KEY: Record<string, string> = {
  singer: 'singers',
  dancer: 'dancers',
  musician: 'musicians',
  musicians: 'musicians',
  anchor: 'anchors',
  DJ: 'djs',
  dj: 'djs',
  band: 'bands',
  comedian: 'comedians',
  magician: 'magicians',
  actor: 'actors',
  mimicry: 'mimicry',
  specialAct: 'specialAct',
  spiritual: 'spiritual',
  kidsEntertainer: 'kidsEntertainers',
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
  return KEY_TO_VALUE[key] || key;
}
