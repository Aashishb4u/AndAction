/**
 * Artist Type Mapping Utility
 * Maps query types to actual database artistType values
 * Shared across all artist API endpoints
 */

const ARTIST_TYPE_MAP: Record<string, string[]> = {
    // "live-band": ["live-band", "Live Band", "Live Band ", "band", "Band", "bands", "Live Band / Group"],
    // "live band": ["live-band", "Live Band", "Live Band ", "band", "Band", "bands", "Live Band / Group"],
    // band: ["live-band", "Live Band", "Live Band ", "band", "Band", "bands", "Live Band / Group"],
    // bands: ["live-band", "Live Band", "Live Band ", "band", "Band", "bands", "Live Band / Group"],
    // spiritual: ["spiritual", "Devotional/Spiritual Singer", "Spiritual / Devotional Singer", "Devotional / Spiritual Singer"],
    // "devotional/spiritual singer": ["spiritual", "Devotional/Spiritual Singer", "Spiritual / Devotional Singer", "Devotional / Spiritual Singer"],
    singer: ["singer", "Singer"],
    "devotional singer": ["spiritual-singer", "spiritual", "Spiritual / Devotional Singer", "Devotional / Spiritual Singer"],
    "spiritual singer": ["spiritual-singer", "spiritual", "Spiritual / Devotional Singer", "Devotional / Spiritual Singer"],
    dancer: ["dancer", "Dancer / Dance Group"],
    musician: ["musician", "Musician"],
    anchor: ["anchor", "Anchor / Emcee / Host"],
    "anchor/emcee/host": ["anchor", "Anchor / Emcee / Host"],
    dj: ["dj", "DJ / VJ"],
    "dj/vj": ["dj", "DJ / VJ"],
    "dj-based-band": ["dj-based-band", "DJ Based Band"],
    "dj based band": ["dj-based-band", "DJ Based Band"],
    "dj-percussionist": ["dj-percussionist", "Dj Percussionist", "DJ Percussionist"],
    "dj percussionist": ["dj-percussionist", "Dj Percussionist", "DJ Percussionist"],
    "live-band": ["live-band", "band", "Band", "Live Band", "Live Band ", "Live Band / Group"],
    comedian: ["comedian", "Comedian", "Comedian / Mimicry"],
    "comedian/mimicry": ["comedian", "Comedian", "Comedian / Mimicry"],
    "stand-up-comedian": ["stand-up-comedian", "Stand-up Comedian", "Stand Up Comedian"],
    magician: ["magician", "Magician / Illusionist"],
    "magicial/illusionist": ["magician", "Magician / Illusionist"],
    "musician/instrumentalist": ["musician", "Musician"],
    "dancer/dance group": ["dancer", "Dancer / Dance Group"],
    actor: ["actor", "Actor / Performer"],
    mimicry: ["mimicry", "Mimicry", "Mimicry / Impressionist", "Comedian / Mimicry"],
    "special-acts": ["special-act", "special-acts", "Special Act", "Special Act Performer"],
    "special act performer": ["special-act", "special-acts", "Special Act", "Special Act Performer"],
    "spiritual-singer": ["spiritual-singer", "spiritual", "Spiritual / Devotional Singer", "Devotional / Spiritual Singer"],
    "kids-entertainer": ["kids-entertainer", "Kids Entertainer"],
    "kids entertainer": ["kids-entertainer", "Kids Entertainer"],
    band: ["live-band", "band", "Band", "Live Band", "Live Band ", "Live Band / Group"],
    spiritual: ["spiritual-singer", "spiritual", "Spiritual / Devotional Singer", "Devotional / Spiritual Singer"],
    "live band": ["live-band", "band", "Band", "Live Band", "Live Band ", "Live Band / Group"],
    comedians: ["comedian", "Comedian", "Comedian / Mimicry"],
    "special-act": ["special-act", "special-acts", "Special Act", "Special Act Performer"],
    "spiritual / devotional singer": ["spiritual-singer", "spiritual", "Spiritual / Devotional Singer", "Devotional / Spiritual Singer"],
    "devotional / spiritual singer": ["spiritual-singer", "spiritual", "Spiritual / Devotional Singer", "Devotional / Spiritual Singer"],
    "motivational speaker": ["motivational-speaker"],
    "folk artist": ["folk-artist"],
    model: ["model"],
};

export function getArtistTypeMatches(queryType: string): string[] {
  const normalizedType = queryType.trim().toLowerCase();
  return ARTIST_TYPE_MAP[normalizedType] || [queryType.trim()];
}

/**
 * Returns the canonical artistType slug ONLY when `value` is a recognised
 * category (exact key in the map). Unknown values (e.g. a business name like
 * "Shiv Aradhya Group") return null instead of being echoed back verbatim.
 */
export function resolveCanonicalArtistType(
  value: string | null | undefined,
): string | null {
  const key = String(value ?? "").trim().toLowerCase();
  if (!key) return null;
  return ARTIST_TYPE_MAP[key]?.[0] ?? null;
}

/**
 * Keyword rules for pulling a category out of free text (business title, bio,
 * or a messy artist_type). Ordered most-specific first. Used as a fallback when
 * the discovery pipeline sends a business name instead of a clean category.
 */
const ARTIST_TYPE_KEYWORD_RULES: Array<[RegExp, string]> = [
  [/\b(bhajan|kirtan|devotional|spiritual|jagran|mata\s*ki\s*chowki)\b/i, "spiritual-singer"],
  [/\bdj\s*percussion/i, "dj-percussionist"],
  [/\bdj\s*based\s*band\b/i, "dj-based-band"],
  [/\b(dj|vj)\b/i, "dj"],
  [/\b(orchestra|live\s*band|\bband\b)\b/i, "live-band"],
  [/\b(dancer|dance\s*group|choreograph)\b/i, "dancer"],
  [/\b(instrumentalist|musician|tabla|guitar|keyboard|flute|violin|sitar|percussionist)\b/i, "musician"],
  [/\b(anchor|emcee|compere|\bhost\b)\b/i, "anchor"],
  [/\b(comedian|mimicry|stand[-\s]?up)\b/i, "comedian"],
  [/\b(magician|illusionist)\b/i, "magician"],
  [/\bmotivational\b/i, "motivational-speaker"],
  [/\bfolk\b/i, "folk-artist"],
  [/\bkids?\s*(entertain|show)/i, "kids-entertainer"],
  [/\b(singer|vocalist|gayak)\b/i, "singer"],
];

export function detectArtistTypeFromText(
  text: string | null | undefined,
): string | null {
  const source = String(text ?? "");
  if (!source.trim()) return null;
  for (const [pattern, slug] of ARTIST_TYPE_KEYWORD_RULES) {
    if (pattern.test(source)) return slug;
  }
  return null;
}
