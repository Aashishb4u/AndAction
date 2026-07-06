import { parseISO, set } from "date-fns";
import { UserRole } from "@/lib/types/database";
export interface AuthUserPayload {
  id: string;
  role: UserRole; // Now explicitly using the imported type
  email: string;
  firstName: string | null;
  // Making googleId optional to resolve the type error in the OAuth routes
  googleId?: string | null;
  facebookId?: string | null; // Added for completeness with Facebook OAuth
  // Add other properties necessary for token creation
}

/**
 * Creates a secure JWT (JSON Web Token) for the user's session.
 * In a real environment, this function MUST use a library like `jsonwebtoken` or equivalent
 * to sign the payload with a secret key (`process.env.JWT_SECRET`).
 * * @param user The user payload containing necessary data (id, role, email).
 * @returns A signed JWT string used for authentication.
 */
export function createAuthToken(user: AuthUserPayload): string {
  const tokenPayload = {
    userId: user.id,
    role: user.role,
    // Calculate expiry time (e.g., 7 days from now)
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
  };

  // PRODUCTION IMPLEMENTATION:
  // return jwt.sign(tokenPayload, process.env.JWT_SECRET, { algorithm: 'HS256' });

  // DEVELOPMENT PLACEHOLDER: Returns a generic token string for API testing
  return `jwt-token-${user.id}-${tokenPayload.exp}`;
}

/**
 * Verifies a JWT token and returns the user's payload.
 * In a real environment, this function MUST use a library like `jsonwebtoken`
 * to verify the signature and ensure the token is not expired.
 * @param token The JWT token string from the Authorization header.
 * @returns The verified user payload or null if verification fails.
 */
export async function getAuthUser(
  token: string,
): Promise<AuthUserPayload | null> {
  // PRODUCTION IMPLEMENTATION:
  /*
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET) as Omit<AuthUserPayload, 'firstName'> & { exp: number };
        
        // In a real app, you would fetch the full user object if needed,
        // but for role/id check, the token payload is often enough.
        
        // Mocking user data that would be in a verified payload
        return {
            id: payload.userId,
            role: payload.role as UserRole, // Assume token signing ensures correct role format
            email: 'verified.user@example.com', // Placeholder for email
            firstName: 'Verified',
        } as AuthUserPayload;
    } catch (e) {
        // Handle TokenExpiredError, JsonWebTokenError, etc.
        return null;
    }
    */

  // DEVELOPMENT PLACEHOLDER:
  // For development, we'll assume any token starting with 'jwt-token-' is valid
  // and we'll extract the user role from the payload (or default to admin for testing)
  if (!token.startsWith("jwt-token-")) {
    return null;
  }

  // A simple mock for testing admin access in the verify route
  // The literal 'admin' is explicitly cast to UserRole to satisfy the interface.
  return {
    id: "mock-admin-id-123",
    role: "admin" as UserRole, // Explicitly cast the literal string to the UserRole type
    email: "admin.tester@example.com",
    firstName: "MockAdmin",
  };
}

/**
 * Converts a "YYYY-MM-DD" string from the user to a UTC Date at midnight
 */
export function localDateToUTC(dateString: string): Date {
  const localDate = parseISO(dateString); // e.g., "2025-11-26"
  const utcMidnight = set(localDate, {
    hours: 0,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
  });

  // Adjust for timezone offset
  const offsetMs = utcMidnight.getTimezoneOffset() * 60 * 1000;
  return new Date(utcMidnight.getTime() - offsetMs);
}

export function formatDisplayLabel(raw?: string | null): string {
  if (!raw) return "";

  return raw
    .toString()
    .trim()
    .split(/[,/]+/)
    .map((segment) =>
      segment
        .trim()
        .split(/[-_\s]+/)
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ")
    )
    .filter(Boolean)
    .join(", ");
}

export function formatDisplayLabels(raw?: string | null): string[] {
  if (!raw) return [];

  return raw
    .toString()
    .split(",")
    .map((item) => formatDisplayLabel(item))
    .filter(Boolean);
}

export function formatDisplayValues(values?: string[] | null): string[] {
  if (!values) return [];
  return values.map((value) => formatDisplayLabel(value)).filter(Boolean);
}

export function isTokenExpired(expiryDate: Date | null): boolean {
  if (!expiryDate) return true;
  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
  return expiryDate < fiveMinutesFromNow;
}

export function buildArtishProfileUrl(avatar: string) {
  const value = typeof avatar === "string" ? avatar.trim() : "";
  if (!value) return "/avatars/default.jpg";

  if (/^\d+$/.test(value)) {
    return `/avatars/${value}.png`;
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return "/avatars/default.jpg";
}

export function getArtishName(
  name: string | null,
  firstName: string | null,
  lastName: string | null,
): string {
  if (name) return name;
  if (firstName && lastName) return `${firstName} ${lastName}`;
  if (firstName) return firstName;
  if (lastName) return lastName;
  return "Unknown Artist";
}

/**
 * Mask a phone number preserving the first 2 and last 3 digits.
 * Removes non-digit characters before masking.
 */
export function maskPhone(phone: string): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length <= 4) return digits;
  const first = digits.slice(0, 2);
  const last = digits.slice(-3);
  const middleLength = Math.max(3, digits.length - 5);
  const middle = "*".repeat(middleLength);
  return `${first}${middle}${last}`;
}

/**
 * Validate a phone number for the given country dial code.
 * Returns an error message string when invalid, or null when valid.
 *
 * India (+91) mobiles must be exactly 10 digits and start with 6-9.
 * Other countries fall back to a general 7-15 digit check.
 * Obviously fake numbers (all-zero / all-same-digit) are always rejected.
 */
export function validatePhoneNumber(
  phone: string,
  dialCode: string = "+91",
): string | null {
  const digits = (phone || "").replace(/\D/g, "");

  if (!digits) {
    return "Phone number is required";
  }

  // Reject all-zero or repeated-single-digit numbers (e.g. 0000000000, 9999999999).
  if (/^(\d)\1*$/.test(digits)) {
    return "Please enter a valid phone number";
  }

  if (dialCode === "+91") {
    if (!/^[6-9]\d{9}$/.test(digits)) {
      return "Please enter a valid 10-digit mobile number";
    }
    return null;
  }

  if (digits.length < 7 || digits.length > 15) {
    return "Please enter a valid phone number";
  }

  return null;
}
