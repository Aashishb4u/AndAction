/**
 * Profile completeness checks used after OAuth sign-in.
 *
 * Google/Facebook only give us a name, email and avatar, so every other field
 * the signup flow collects is empty afterwards. These helpers decide whether a
 * user still needs to finish the "Complete Profile" step.
 */

/** Where each role finishes signing up. */
export const ARTIST_COMPLETE_PROFILE_PATH =
  "/auth/artist?step=userInfo&oauth=true";
export const USER_COMPLETE_PROFILE_PATH = "/user/profile";

export interface ProfileCompletionInput {
  role?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  state?: string | null;
  city?: string | null;
  dob?: Date | string | null;
  gender?: string | null;
  address?: string | null;
  zip?: string | null;
}

const isFilled = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (value instanceof Date) return !Number.isNaN(value.getTime());
  return String(value).trim().length > 0;
};

/**
 * Fields the regular signup "profile" step collects
 * (app/auth/signup/page.tsx) and that /user/profile edits.
 */
export function getMissingUserProfileFields(
  user: ProfileCompletionInput,
): string[] {
  const required: Array<[string, unknown]> = [
    ["firstName", user.firstName],
    ["lastName", user.lastName],
    ["state", user.state],
    ["city", user.city],
  ];

  return required.filter(([, value]) => !isFilled(value)).map(([key]) => key);
}

/**
 * Fields the artist signup "userInfo" step collects
 * (app/auth/artist/page.tsx). Superset of the user fields.
 */
export function getMissingArtistProfileFields(
  user: ProfileCompletionInput,
): string[] {
  const required: Array<[string, unknown]> = [
    ["firstName", user.firstName],
    ["lastName", user.lastName],
    ["dateOfBirth", user.dob],
    ["gender", user.gender],
    ["address", user.address],
    ["pinCode", user.zip],
    ["state", user.state],
    ["city", user.city],
  ];

  return required.filter(([, value]) => !isFilled(value)).map(([key]) => key);
}

export interface ProfileCompletionResult {
  isComplete: boolean;
  missingFields: string[];
  /** Where to send the user when the profile is incomplete. */
  completeProfilePath: string;
}

/** Role-aware completeness check. */
export function checkProfileCompletion(
  user: ProfileCompletionInput,
): ProfileCompletionResult {
  const isArtist = user.role === "artist";

  const missingFields = isArtist
    ? getMissingArtistProfileFields(user)
    : getMissingUserProfileFields(user);

  return {
    isComplete: missingFields.length === 0,
    missingFields,
    completeProfilePath: isArtist
      ? ARTIST_COMPLETE_PROFILE_PATH
      : USER_COMPLETE_PROFILE_PATH,
  };
}
