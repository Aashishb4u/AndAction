import { parseISO, set } from 'date-fns';
import { UserRole } from '@/lib/types/database';
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
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
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
export async function getAuthUser(token: string): Promise<AuthUserPayload | null> {
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
    if (!token.startsWith('jwt-token-')) {
        return null;
    }

    // A simple mock for testing admin access in the verify route
    // The literal 'admin' is explicitly cast to UserRole to satisfy the interface.
    return {
        id: 'mock-admin-id-123',
        role: 'admin' as UserRole, // Explicitly cast the literal string to the UserRole type
        email: 'admin.tester@example.com',
        firstName: 'MockAdmin',
    };
}



/**
 * Converts a "YYYY-MM-DD" string from the user to a UTC Date at midnight
 */
export function localDateToUTC(dateString: string): Date {
  const localDate = parseISO(dateString); // e.g., "2025-11-26"
  const utcMidnight = set(localDate, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });

  // Adjust for timezone offset
  const offsetMs = utcMidnight.getTimezoneOffset() * 60 * 1000;
  return new Date(utcMidnight.getTime() - offsetMs);
}

export function isTokenExpired(expiryDate: Date | null): boolean {
  if (!expiryDate) return true;
  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
  return expiryDate < fiveMinutesFromNow;
}

export function buildArtishProfileUrl(avatar:string) {
  if (!avatar) return '/avatars/default.jpg';
  
  if (!isNaN(Number(avatar))) {
    return `/avatars/${avatar}.png`;
  }
  
  if (avatar.startsWith('http')) {
    return avatar;
  }
    return avatar;
}

type ProgressResult = {
  percentage: number;
  completed: number;
  total: number;
};

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isFilled = (value: unknown): boolean => {
  if (value === null || typeof value === "undefined") return false;
  if (typeof value === "number") return true;
  if (typeof value === "boolean") return true;
  if (isNonEmptyString(value)) return true;
  if (Array.isArray(value)) return value.filter((v) => isFilled(v)).length > 0;
  return false;
};

const isFilledCsv = (value: unknown): boolean => {
  if (!isNonEmptyString(value)) return false;
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean).length > 0;
};

export function getArtistProfileProgress(input: {
  user?: unknown | null;
  artistProfile?: unknown | null;
}): ProgressResult {
  const toRecord = (value: unknown): Record<string, unknown> => {
    if (!value || typeof value !== "object") return {};
    return value as Record<string, unknown>;
  };

  const user = toRecord(input.user);
  const artist = toRecord(input.artistProfile);

  const checks: boolean[] = [
    isFilled(user.avatar),
    isFilled(user.firstName),
    isFilled(user.lastName),
    isFilled(user.gender),
    isFilled(user.dob),
    isFilled(user.address),
    isFilled(user.city),
    isFilled(user.state),
    isFilled(user.zip),

    isFilled(artist.stageName),
    isFilled(artist.artistType),
    isFilled(artist.subArtistType),
    isFilled(artist.achievements),
    isFilled(artist.yearsOfExperience),
    isFilled(artist.shortBio),

    isFilledCsv(artist.performingLanguage),
    isFilledCsv(artist.performingEventType),
    isFilledCsv(artist.performingStates),
    isFilled(artist.performingDurationFrom),
    isFilled(artist.performingDurationTo),
    isFilled(artist.performingMembers),
    isFilled(artist.offStageMembers),

    isFilled(artist.contactNumber) || isFilled(user.phoneNumber),
    isFilled(artist.whatsappNumber),
    isFilled(artist.contactEmail) || isFilled(user.email),

    isFilled(artist.soloChargesFrom),
    isFilled(artist.soloChargesDescription),
    isFilled(artist.chargesWithBacklineFrom),
    isFilled(artist.chargesWithBacklineDescription),
  ];

  const total = checks.length;
  const completed = checks.filter(Boolean).length;
  const percentage = total === 0 ? 0 : Math.min(100, Math.max(0, Math.round((completed / total) * 100)));

  return { percentage, completed, total };
}
