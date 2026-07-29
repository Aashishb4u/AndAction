/**
 * Helpers for the artist "years of experience" field.
 *
 * The canonical option list lives in artist_profile_preferences.experienceYears
 * and is served by /api/preferences/artist-profile. Artist.yearsOfExperience
 * stores the option's `value`, so labels must always be resolved against that
 * table — never against a copy hardcoded in a component.
 *
 * A stored value can go stale when an option is removed or renumbered, and
 * imported rows may hold a raw year count. Those fall back to matching the
 * number against the ranges parsed from the option labels.
 */

export type ExperienceOption = { value: string; label: string };

const parseLabelRange = (
  label: string,
): { min: number; max: number } | null => {
  const openEnded = label.match(/(\d+)\s*\+/);
  if (openEnded) return { min: Number(openEnded[1]), max: Infinity };

  const bounded = label.match(/(\d+)\s*-\s*(\d+)/);
  if (bounded) return { min: Number(bounded[1]), max: Number(bounded[2]) };

  return null;
};

export const resolveExperienceOption = (
  value: unknown,
  options: ExperienceOption[],
): ExperienceOption | null => {
  if (value === null || value === undefined) return null;

  const raw = String(value).trim();
  if (!raw || !Array.isArray(options) || options.length === 0) return null;

  const matchedOption = options.find(
    (option) => option && String(option.value) === raw,
  );
  if (matchedOption) return matchedOption;

  // Legacy / imported rows: the number is a raw year count, not a bucket code.
  const years = Number(raw);
  if (!Number.isFinite(years) || years <= 0) return null;

  const matchedRange = options.find((option) => {
    const range = parseLabelRange(option?.label || "");
    return range ? years > range.min && years <= range.max : false;
  });

  return matchedRange ?? null;
};

export const resolveExperienceLabel = (
  value: unknown,
  options: ExperienceOption[],
): string | null => resolveExperienceOption(value, options)?.label ?? null;
