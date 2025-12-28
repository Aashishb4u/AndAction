/**
 * lib/token-utils.ts
 *
 * Central utility functions for generating, hashing, and calculating expiry
 * for various one-time security tokens (e.g., Email Verification, Password Reset).
 */

import crypto from 'crypto';
import * as bcrypt from 'bcryptjs';

// Configuration for database storage
const TOKEN_HASH_SALT_ROUNDS = 10;

// Configuration for token expiry times in HOURS
// NOTE: Password reset tokens (already implemented) are usually shorter than verification tokens.
const EMAIL_VERIFICATION_EXPIRY_HOURS = 24; 

// --- Types ---

interface TokenPair {
    cleartextToken: string; // The token sent to the user (e.g., in a link)
    hashedToken: string;    // The token stored in the database
    expiresAt: Date;
}

// --- Utility Functions ---

/**
 * Generates a secure, random cleartext token.
 * We use a secure 32-byte hexadecimal string for high entropy.
 * @returns A 64-character hexadecimal token string.
 */
function generateCleartextToken(): string {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Hashes a cleartext token using bcrypt for secure storage in the database.
 * This ensures that even if the database is compromised, the actual tokens
 * (which grant access) cannot be easily discovered.
 * @param cleartextToken The token string to hash.
 * @returns The bcrypt hashed token string.
 */
async function hashToken(cleartextToken: string): Promise<string> {
    // Note: We use bcrypt for hashing the token itself, similar to a password.
    return bcrypt.hash(cleartextToken, TOKEN_HASH_SALT_ROUNDS);
}

/**
 * Calculates the expiry date for an email verification token.
 * @returns A Date object representing the expiry time.
 */
function calculateVerificationExpiry(): Date {
    return new Date(Date.now() + EMAIL_VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000);
}

/**
 * Public function to create the required token pair and expiry date for email verification.
 * @returns An object containing the cleartext token, its hash, and the expiry date.
 */
export async function createVerificationTokenPair(): Promise<TokenPair> {
    const cleartextToken = generateCleartextToken();
    const hashedToken = await hashToken(cleartextToken);
    const expiresAt = calculateVerificationExpiry();

    return {
        cleartextToken,
        hashedToken,
        expiresAt,
    };
}

/**
 * Compares a cleartext token provided by the user (from the link) against a stored hash.
 * @param cleartextToken The token to verify.
 * @param hashedToken The hash stored in the database.
 * @returns True if the token matches the hash, false otherwise.
 */
export async function verifyToken(cleartextToken: string, hashedToken: string): Promise<boolean> {
    return bcrypt.compare(cleartextToken, hashedToken);
}
