/**
 * Artist Type Mapping Utility
 * Maps query types to actual database artistType values
 * Shared across all artist API endpoints
 */

export function getArtistTypeMatches(queryType: string): string[] {
  const typeMap: Record<string, string[]> = {
    singer: ["singer", "Singer"],
    spiritual: ["spiritual", "Spiritual / Devotional Singer", "Devotional / Spiritual Singer"],
    "spiritual / devotional singer": ["spiritual", "Spiritual / Devotional Singer", "Devotional / Spiritual Singer"],
    "devotional / spiritual singer": ["spiritual", "Spiritual / Devotional Singer", "Devotional / Spiritual Singer"],
    dancer: ["dancer", "Dancer / Dance Group"],
    dj: ["DJ / VJ"],
    "dj-percussionist": ["Dj Percussionist", "DJ Percussionist"],
    "dj percussionist": ["Dj Percussionist", "DJ Percussionist"],
    band: ["band", "Band", "Live Band", "Live Band ", "Live Band / Group"],
    "live band": ["band", "Band", "Live Band", "Live Band ", "Live Band / Group"],
    magician: ["Magician / Illusionist"],
    anchor: ["Anchor / Emcee / Host"],
    comedian: ["comedian", "Comedian", "Comedian / Mimicry"],
    comedians: ["comedian", "Comedian", "Comedian / Mimicry"],
    actor: ["actor"],
    mimicry: ["mimicry", "Mimicry", "Mimicry / Impressionist", "Comedian / Mimicry"],
    musician: ["musician", "Musician"],
    "special-act": ["Special Act", "Special Act Performer"],
    "kids-entertainer": ["Kids Entertainer"],
  };

  const normalizedType = queryType.trim().toLowerCase();
  return typeMap[normalizedType] || [queryType.trim()];
}
