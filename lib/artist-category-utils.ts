export interface ArtistCategoryOption {
  value: string;
  label: string;
}

const ALIAS_TO_VALUE: Record<string, string> = {
  band: "Live Band",
  bands: "Live Band",
  "live band": "Live Band",
  "live band / group": "Live Band",
  liveband: "Live Band",
  "spiritual / devotional singer": "spiritual",
  "devotional / spiritual singer": "spiritual",
  "spiritual/devotional": "spiritual",
  "dj percussionist": "dj-percussionist",
  djpercussionist: "dj-percussionist",
  "special act": "special-act",
  specialact: "special-act",
  "kids entertainer": "kids-entertainer",
  "kids entertainers": "kids-entertainer",
  kidsentertainer: "kids-entertainer",
};

export function normalizeArtistCategoryValue(rawValue: string): string {
  const raw = (rawValue || "").trim();
  if (!raw) return "";

  const normalized = ALIAS_TO_VALUE[raw.toLowerCase()];
  return normalized || raw;
}

export function findCategoryLabel(
  categories: ArtistCategoryOption[],
  rawValue?: string,
): string {
  const value = normalizeArtistCategoryValue(rawValue || "");
  if (!value) return "";

  const byValue = categories.find(
    (item) => item.value.toLowerCase() === value.toLowerCase(),
  );
  if (byValue) return byValue.label;

  const byLabel = categories.find(
    (item) => item.label.toLowerCase() === value.toLowerCase(),
  );
  if (byLabel) return byLabel.label;

  return rawValue || value;
}
