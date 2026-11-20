/**
 * Sub-categories are typed by hand, so the same word is spelled many ways in the DB
 * ("Sundarkand path", "Mata ki chauki", "Mata Ki Chowki Singer"). Expand a search term to
 * every spelling we know, so a service never comes back empty because of spelling.
 */
const SPELLING_GROUPS: { key: string; variants: string[] }[] = [
  { key: "sundarkand", variants: ["sundarkand", "sunderkand", "sundar kand", "sunder kand", "sundarkaand", "sunderkaand"] },
  { key: "sunderkand", variants: ["sundarkand", "sunderkand", "sundar kand", "sunder kand", "sundarkaand", "sunderkaand"] },
  { key: "chowki", variants: ["chowki", "chauki", "chowkee", "chaukee", "chouki"] },
  { key: "chauki", variants: ["chowki", "chauki", "chowkee", "chaukee", "chouki"] },
  { key: "jagran", variants: ["jagran", "jagrata", "jagraata", "jaagran"] },
  { key: "jagrata", variants: ["jagran", "jagrata", "jagraata", "jaagran"] },
  { key: "khatu", variants: ["khatu", "khatushyam"] },
  { key: "sandhya", variants: ["sandhya", "sandya"] },
  { key: "sankirtan", variants: ["sankirtan", "sankeertan", "sankirtana"] },
  { key: "ramayan", variants: ["ramayan", "ramayana"] },
  { key: "chalisa", variants: ["chalisa", "chaalisa"] },
];

const lettersOnly = (value: string) => value.toLowerCase().replace(/[^a-z]/g, "");

/** The term itself plus every known spelling variant. Lower-case, de-duplicated. */
export function expandSearchTerm(term: string): string[] {
  const clean = term.trim().toLowerCase();
  if (!clean) return [];
  const flat = lettersOnly(clean);
  const out = new Set<string>([clean]);
  for (const group of SPELLING_GROUPS) {
    if (flat.includes(group.key)) group.variants.forEach((v) => out.add(v));
  }
  return [...out];
}
