/**
 * Artist Type Mapping Utility
 * Maps query types to actual database artistType values
 * Shared across all artist API endpoints
 */

export function getArtistTypeMatches(queryType: string): string[] {
  const typeMap: Record<string, string[]> = {
    // "live-band": ["live-band", "Live Band", "Live Band ", "band", "Band", "bands", "Live Band / Group"],
    // "live band": ["live-band", "Live Band", "Live Band ", "band", "Band", "bands", "Live Band / Group"],
    // band: ["live-band", "Live Band", "Live Band ", "band", "Band", "bands", "Live Band / Group"],
    // bands: ["live-band", "Live Band", "Live Band ", "band", "Band", "bands", "Live Band / Group"],
    // spiritual: ["spiritual", "Devotional/Spiritual Singer", "Spiritual / Devotional Singer", "Devotional / Spiritual Singer"],
    // "devotional/spiritual singer": ["spiritual", "Devotional/Spiritual Singer", "Spiritual / Devotional Singer", "Devotional / Spiritual Singer"],
    singer: ["singer", "Singer"],
    dancer: ["dancer", "Dancer / Dance Group"],
    musician: ["musician", "Musician"],
    anchor: ["anchor", "Anchor / Emcee / Host"],
    dj: ["dj", "DJ / VJ"],
    "dj-based-band": ["dj-based-band", "DJ Based Band"],
    "dj-percussionist": ["dj-percussionist", "Dj Percussionist", "DJ Percussionist"],
    "live-band": ["live-band", "band", "Band", "Live Band", "Live Band ", "Live Band / Group"],
    comedian: ["comedian", "Comedian", "Comedian / Mimicry"],
    "stand-up-comedian": ["stand-up-comedian", "Stand-up Comedian", "Stand Up Comedian"],
    magician: ["magician", "Magician / Illusionist"],
    actor: ["actor", "Actor / Performer"],
    mimicry: ["mimicry", "Mimicry", "Mimicry / Impressionist", "Comedian / Mimicry"],
    "special-acts": ["special-act", "special-acts", "Special Act", "Special Act Performer"],
    "spiritual-singer": ["spiritual-singer", "spiritual", "Spiritual / Devotional Singer", "Devotional / Spiritual Singer"],
    "kids-entertainer": ["kids-entertainer", "Kids Entertainer"],
    band: ["live-band", "band", "Band", "Live Band", "Live Band ", "Live Band / Group"],
    spiritual: ["spiritual-singer", "spiritual", "Spiritual / Devotional Singer", "Devotional / Spiritual Singer"],
    "live band": ["live-band", "band", "Band", "Live Band", "Live Band ", "Live Band / Group"],
    comedians: ["comedian", "Comedian", "Comedian / Mimicry"],
    "dj percussionist": ["dj-percussionist", "Dj Percussionist", "DJ Percussionist"],
    "special-act": ["special-act", "special-acts", "Special Act", "Special Act Performer"],
    "spiritual / devotional singer": ["spiritual-singer", "spiritual", "Spiritual / Devotional Singer", "Devotional / Spiritual Singer"],
    "devotional / spiritual singer": ["spiritual-singer", "spiritual", "Spiritual / Devotional Singer", "Devotional / Spiritual Singer"],
  };

  const normalizedType = queryType.trim().toLowerCase();
  return typeMap[normalizedType] || [queryType.trim()];
}
