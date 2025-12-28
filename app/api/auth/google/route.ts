/**
 * app/api/auth/google/route.ts
 *
 * Handles Google OAuth Sign-in and Sign-up.
 * This is the server-side endpoint that validates the token received from the client,
 * creates a new user, or signs in an existing user linked via Google ID.
 *
 * Priority 10: POST /api/auth/google
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ApiErrors, successResponse } from '@/lib/api-response';
import { AuthUserPayload, createAuthToken } from '@/lib/utils'; // Assumed to handle session/JWT creation
import { OAuth2Client } from 'google-auth-library'; // Production library for token verification
import { UserRole } from '@/lib/types/database';

// Constants for Google OAuth integration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
if (!GOOGLE_CLIENT_ID) {
    console.error("CRITICAL: GOOGLE_CLIENT_ID is missing from environment variables.");
}

// Initialize the Google OAuth client
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

/**
 * Verifies the Google ID token and extracts user information.
 * @param idToken The ID token received from the client-side Google SDK.
 * @returns User data from Google if verification is successful, otherwise null.
 */
const verifyGoogleTokenAndGetUserInfo = async (idToken: string) => {
    if (!GOOGLE_CLIENT_ID) {
        throw new Error("Google Client ID is not configured.");
    }

    try {
        const ticket = await client.verifyIdToken({
            idToken: idToken,
            audience: GOOGLE_CLIENT_ID, // Ensure the token is for this application
        });
        
        const payload = ticket.getPayload();
        
        // Essential checks
        if (!payload || !payload.sub || !payload.email) {
            return null;
        }

        return {
            googleId: payload.sub,
            email: payload.email,
            firstName: payload.given_name,
            lastName: payload.family_name,
            avatar: payload.picture,
        };

    } catch (error) {
        console.error('Google Token Verification Failed:', error);
        return null;
    }
};

interface GoogleAuthRequestBody {
    idToken: string; // The ID token received from the Google client-side SDK
}

export async function POST(request: NextRequest): Promise<NextResponse<any>> {
    try {
        const body: GoogleAuthRequestBody = await request.json();
        const { idToken } = body;

        if (!idToken) {
            return ApiErrors.badRequest('Google ID token is required.');
        }

        // --- 1. Verify Token and Get User Info from Google ---
        const googleUserInfo = await verifyGoogleTokenAndGetUserInfo(idToken);

        if (!googleUserInfo) {
            // This could be due to an expired token, invalid token, or misconfigured client ID.
            return ApiErrors.unauthorized();
        }

        const { googleId, email, firstName, lastName, avatar } = googleUserInfo;
        const lowerCaseEmail = email.toLowerCase();

        // --- 2. Check for Existing User (Google ID or Email Match) ---
        let user = await prisma.user.findFirst({
            where: {
                OR: [
                    { googleId: googleId }, // User signed up with Google before
                    { email: lowerCaseEmail } // User signed up with email/password previously
                ]
            },
            // Select only safe fields for session creation and response
            select: {
                id: true,
                role: true,
                googleId: true,
                email: true,
                firstName: true
            }
        });

        // --- 3. Handle Login (User Found) ---
        if (user) {
            let needsUpdate = false;
            let updateData: any = {};

            // If user exists but is not linked to Google yet (signed up via email/password), link accounts
            if (!user.googleId) {
                updateData.googleId = googleId;
                needsUpdate = true;
            }

            // Update profile info if Google provided data is better (e.g., initial null values)
            if (user.firstName === null && firstName) {
                updateData.firstName = firstName;
                needsUpdate = true;
            }
            // NOTE: We generally avoid overwriting existing non-null data unless explicitly confirmed by the user.

            // Perform the update if necessary
            if (needsUpdate) {
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: updateData,
                    select: {
                        id: true,
                        role: true,
                        googleId: true,
                        email: true,
                        firstName: true
                    }
                });
            }

            // Create and return the authentication token
            const token = createAuthToken(user as AuthUserPayload);
            return successResponse(
                { token, user: { id: user.id, email: user.email, role: user.role, firstName: user.firstName } },
                `Successfully signed in with Google. Welcome back, ${user.firstName || user.email}!`,
                200
            );

        } else {
            // --- 4. Handle Registration (New User) ---

            const newUser = await prisma.user.create({
                data: {
                    email: lowerCaseEmail,
                    googleId: googleId,
                    firstName: firstName,
                    lastName: lastName,
                    avatar: avatar,
                    role: 'user' as UserRole, // Default role for new signups
                    isAccountVerified: true, // Google verifies the email address
                    // Password field is intentionally left null for OAuth users
                },
                select: { 
                    id: true, 
                    role: true, 
                    email: true, 
                    firstName: true,
                    googleId: true // Required for AuthUserPayload
                }
            });

            // Create and return the authentication token
            const token = createAuthToken(newUser as AuthUserPayload);
            return successResponse(
                { token, user: { id: newUser.id, email: newUser.email, role: newUser.role, firstName: newUser.firstName } },
                `Successfully registered and signed in with Google. Welcome, ${newUser.firstName || newUser.email}!`,
                201
            );
        }

    } catch (error) {
        console.error('POST Google OAuth API Error:', error);
        return ApiErrors.internalError('An unexpected error occurred during Google authentication.');
    }
}
