/**
 * Artist Type Mapping Utility
 * Maps query types to actual database artistType values
 * Shared across all artist API endpoints
 */

export function getArtistTypeMatches(queryType: string): string[] {
  const typeMap: Record<string, string[]> = {
    singer: ["singer", "Singer"],
    spiritual: ["Devotional / Spiritual Singer"],
    dancer: ["dancer", "Dancer / Dance Group"],
    dj: ["DJ / VJ", "Dj Percussionist"],
    band: ["band", "Live Band"],
    magician: ["Magician / Illusionist"],
    anchor: ["Anchor / Emcee / Host"],
    comedian: ["Comedian / Mimicry"],
    actor: ["actor"],
    mimicry: ["Comedian / Mimicry"],
    musician: ["musician", "Musician"],
    "special-act": ["Special Act", "Special Act Performer"],
    "kids-entertainer": ["Kids Entertainer"],
  };

  return typeMap[queryType.toLowerCase()] || [queryType];
}
