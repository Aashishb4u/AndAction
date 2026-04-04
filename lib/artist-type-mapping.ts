/**
 * Artist Type Mapping Utility
 * Maps query types to actual database artistType values
 * Shared across all artist API endpoints
 */

export function getArtistTypeMatches(queryType: string): string[] {
  const typeMap: Record<string, string[]> = {
    "live-band": ["live-band", "Live Band", "Live Band ", "band", "Band", "bands", "Live Band / Group"],
    "live band": ["live-band", "Live Band", "Live Band ", "band", "Band", "bands", "Live Band / Group"],
    band: ["live-band", "Live Band", "Live Band ", "band", "Band", "bands", "Live Band / Group"],
    bands: ["live-band", "Live Band", "Live Band ", "band", "Band", "bands", "Live Band / Group"],
    spiritual: ["spiritual", "Devotional/Spiritual Singer", "Spiritual / Devotional Singer", "Devotional / Spiritual Singer"],
    "devotional/spiritual singer": ["spiritual", "Devotional/Spiritual Singer", "Spiritual / Devotional Singer", "Devotional / Spiritual Singer"],
    singer: ["singer", "Singer"],
    anchor: ["anchor", "Anchor/Emcee/Host", "Anchor / Emcee / Host"],
    "dj/vj": ["dj", "DJ/VJ", "DJ / VJ"],
    dj: ["dj", "DJ/VJ", "DJ / VJ"],
    "dj-based-band": ["dj-based-band", "DJ based Band"],
    "dj based band": ["dj-based-band", "DJ based Band"],
    "dj-percussionist": ["dj-percussionist", "Dj Percussionist", "DJ Percussionist"],
    "dj percussionist": ["dj-percussionist", "Dj Percussionist", "DJ Percussionist"],
    musician: ["musician", "Musician/Instrumentalist", "Musician", "Musician / Instrumentalist"],
    "musician/instrumentalist": ["musician", "Musician/Instrumentalist", "Musician", "Musician / Instrumentalist"],
    dancer: ["dancer", "Dancer/Dance group", "Dancer / Dance Group"],
    "dancer/dance group": ["dancer", "Dancer/Dance group", "Dancer / Dance Group"],
    magician: ["magician", "Magicial/Illusionist", "Magician / Illusionist"],
    "magicial/illusionist": ["magician", "Magicial/Illusionist", "Magician / Illusionist"],
    "comedian-mimicry": ["comedian-mimicry", "Comedian/Mimicry", "comedian", "Comedian", "mimicry", "Mimicry", "Comedian / Mimicry", "Mimicry / Impressionist"],
    "comedian/mimicry": ["comedian-mimicry", "Comedian/Mimicry", "comedian", "Comedian", "mimicry", "Mimicry", "Comedian / Mimicry", "Mimicry / Impressionist"],
    comedian: ["comedian-mimicry", "Comedian/Mimicry", "comedian", "Comedian", "Comedian / Mimicry"],
    mimicry: ["comedian-mimicry", "Comedian/Mimicry", "mimicry", "Mimicry", "Mimicry / Impressionist", "Comedian / Mimicry"],
    "special-act": ["special-act", "Special act performer", "Special Act Performer", "Special Act"],
    "special act performer": ["special-act", "Special act performer", "Special Act Performer", "Special Act"],
    "motivational-speaker": ["motivational-speaker", "Motivational speaker"],
    "motivational speaker": ["motivational-speaker", "Motivational speaker"],
    "kids-entertainer": ["kids-entertainer", "Kids entertainer", "Kids Entertainer"],
    "kids entertainer": ["kids-entertainer", "Kids entertainer", "Kids Entertainer"],
    "folk-artist": ["folk-artist", "Folk Artist"],
    "folk artist": ["folk-artist", "Folk Artist"],
    model: ["model", "Model"],
  };

  const normalizedType = queryType.trim().toLowerCase();
  return typeMap[normalizedType] || [queryType.trim()];
}
