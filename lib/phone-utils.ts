/**
 * Phone number normalisation for lead lookups. India only (+91).
 *
 * Numbers reach us in every shape: bare national ("9876543210"), country-code
 * prefixed ("919876543210"), E.164 ("+91 98765 43210"), trunk-prefixed
 * ("09876543210") and IDD-dialled ("00919876543210").
 *
 * Matching on "the last 10 digits" would look fine for India but collides
 * across countries: a US "+1 962 883 6942" and an Indian "9628836942" share
 * their last 10 digits. So we pull out the 10-digit Indian national number
 * explicitly and refuse anything that isn't +91.
 */

export const INDIA_CALLING_CODE = "91";

/**
 * Optional IDD prefix, optional 91 country code, optional 0 trunk prefix,
 * then exactly 10 national digits.
 *   9876543210 | 919876543210 | 09876543210 | 00919876543210 | 91 0 9876543210
 */
const INDIA_PHONE_PATTERN = /^(?:00)?(?:91)?0?(\d{10})$/;

/** Legacy rows hold a few numbers shorter than 10 digits; match those exactly. */
const MIN_SHORT_DIGITS = 6;

export interface NormalizedPhone {
  /** Every digit in the input, IDD prefix stripped. */
  digits: string;
  /** The 10-digit Indian national number (or the raw digits for short rows). */
  nationalNumber: string;
  /** Country calling code detected on the input, if any. */
  callingCode: string | null;
  /** False when the input is not a valid Indian number. */
  isIndian: boolean;
  /** Stored digit-strings that should be treated as this number. */
  candidates: string[];
}

/** Digits of an explicit country code, e.g. "+91" -> "91". */
function readCountryCode(raw?: string | null): string | null {
  const digits = String(raw ?? "").replace(/\D/g, "");
  return digits || null;
}

export function normalizePhoneNumber(
  rawPhone: string,
  rawCountryCode?: string | null,
): NormalizedPhone | null {
  const trimmed = String(rawPhone ?? "").trim();
  if (!trimmed) return null;

  const hadPlus = trimmed.startsWith("+");
  const allDigits = trimmed.replace(/\D/g, "");
  if (!allDigits) return null;

  const explicitCc = readCountryCode(rawCountryCode);

  // A country code we were handed that isn't India rules the number out up
  // front — no need to look at the digits.
  if (explicitCc && explicitCc !== INDIA_CALLING_CODE) {
    return {
      digits: allDigits,
      nationalNumber: allDigits,
      callingCode: explicitCc,
      isIndian: false,
      candidates: [],
    };
  }

  // When the caller wrote the number in international form ("+65 6123 4567",
  // "0065..."), the country code is part of the string and must be 91.
  // Without this a foreign number that happens to total 10 digits would be
  // read as an Indian national number.
  const iddStripped = allDigits.startsWith("00")
    ? allDigits.slice(2)
    : allDigits;
  const isInternationalForm = hadPlus || allDigits.startsWith("00");

  if (isInternationalForm && !iddStripped.startsWith(INDIA_CALLING_CODE)) {
    return {
      digits: allDigits,
      nationalNumber: allDigits,
      callingCode: null,
      isIndian: false,
      candidates: [],
    };
  }

  const match = allDigits.match(INDIA_PHONE_PATTERN);

  if (match) {
    const national = match[1];
    const carriedCode =
      allDigits.length > 10 && allDigits.includes(INDIA_CALLING_CODE)
        ? INDIA_CALLING_CODE
        : explicitCc;

    return {
      digits: allDigits,
      nationalNumber: national,
      callingCode: carriedCode ?? null,
      isIndian: true,
      // Every shape the same number might already be stored in.
      candidates: [
        national,
        `0${national}`,
        `${INDIA_CALLING_CODE}${national}`,
        `00${INDIA_CALLING_CODE}${national}`,
      ],
    };
  }

  // Not an Indian number. Short bare digits are still allowed through so the
  // handful of legacy sub-10-digit rows stay reachable by exact match.
  const isShortBareNumber =
    !hadPlus &&
    allDigits.length >= MIN_SHORT_DIGITS &&
    allDigits.length < 10;

  if (isShortBareNumber) {
    return {
      digits: allDigits,
      nationalNumber: allDigits,
      callingCode: null,
      isIndian: true,
      candidates: [allDigits],
    };
  }

  return {
    digits: allDigits,
    nationalNumber: allDigits,
    callingCode: null,
    isIndian: false,
    candidates: [],
  };
}
