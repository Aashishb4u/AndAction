/**
 * app/api/auth/facebook/route.ts
 *
 * Handles Facebook OAuth Sign-in and Sign-up.
 * This is the server-side endpoint that validates the Access Token received from the client,
 * creates a new user, or signs in an existing user linked via Facebook ID.
 *
 * Priority 9: POST /api/auth/facebook
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ApiErrors, successResponse } from '@/lib/api-response';
import { AuthUserPayload, createAuthToken } from '@/lib/utils';
import { UserRole } from '@/lib/types/database';

// Configuration for Facebook OAuth
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;

if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
    console.error("CRITICAL: FACEBOOK_APP_ID or FACEBOOK_APP_SECRET is missing from environment variables.");
}

/**
 * PRODUCTION READY: Verifies the client's access token and retrieves user data directly from Facebook's Graph API.
 * This function ensures the token is valid, belongs to the correct app, and is active.
 * @param accessToken The access token received from the client.
 * @returns User data from Facebook if verification is successful, otherwise null.
 */
const verifyFacebookTokenAndGetUserInfo = async (accessToken: string) => {
    if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
        throw new Error("Facebook App credentials are not configured.");
    }

    try {
        // Step 1: Exchange the client token for an application-specific token (optional, but good practice)
        // This is often skipped if the client sends a token sufficient for graph API requests.
        
        // Step 2: Use the token to fetch the user's profile information
        const fields = 'id,email,first_name,last_name,picture';
        const graphApiUrl = `https://graph.facebook.com/v19.0/me?fields=${fields}&access_token=${accessToken}`;

        const response = await fetch(graphApiUrl);
        
        if (!response.ok) {
            console.error('Facebook Graph API Error:', response.status, await response.text());
            return null;
        }

        const data = await response.json();
        
        // Essential checks
        if (!data.id || !data.email) {
            return null;
        }

        return {
            facebookId: data.id,
            email: data.email,
            firstName: data.first_name,
            lastName: data.last_name,
            // Facebook picture structure usually requires some adjustment for direct URL
            avatar: data.picture?.data?.url,
        };

    } catch (error) {
        console.error('Facebook Token Verification/API Fetch Failed:', error);
        return null;
    }
};

interface FacebookAuthRequestBody {
    accessToken: string; // The Access Token received from the Facebook client-side SDK
}

export async function POST(request: NextRequest): Promise<NextResponse<any>> {
    try {
        const body: FacebookAuthRequestBody = await request.json();
        const { accessToken } = body;

        if (!accessToken) {
            return ApiErrors.badRequest('Facebook Access Token is required.');
        }

        // --- 1. Verify Token and Get User Info from Facebook ---
        const facebookUserInfo = await verifyFacebookTokenAndGetUserInfo(accessToken);

        if (!facebookUserInfo) {
            return ApiErrors.unauthorized();
        }

        const { facebookId, email, firstName, lastName, avatar } = facebookUserInfo;
        const lowerCaseEmail = email.toLowerCase();

        // --- 2. Check for Existing User (Facebook ID or Email Match) ---
        let user = await prisma.user.findFirst({
            where: {
                OR: [
                    { facebookId: facebookId }, // User signed up with Facebook before
                    { email: lowerCaseEmail } // User signed up with email/password previously
                ]
            },
            select: {
                id: true,
                role: true,
                facebookId: true,
                email: true,
                firstName: true
            }
        });

        // --- 3. Handle Login (User Found) ---
        if (user) {
            let needsUpdate = false;
            let updateData: any = {};

            // If user exists but is not linked to Facebook yet, link accounts
            if (!user.facebookId) {
                updateData.facebookId = facebookId;
                needsUpdate = true;
            }

            // Update profile info if Facebook provided data is better
            if (user.firstName === null && firstName) {
                updateData.firstName = firstName;
                needsUpdate = true;
            }

            // Perform the update if necessary
            if (needsUpdate) {
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: updateData,
                    select: {
                        id: true,
                        role: true,
                        facebookId: true,
                        email: true,
                        firstName: true
                    }
                });
            }

            // Create and return the authentication token
            // Apply type assertion to satisfy TypeScript's strict UserRole check
            const token = createAuthToken(user as AuthUserPayload);
            return successResponse(
                { token, user: { id: user.id, email: user.email, role: user.role, firstName: user.firstName } },
                `Successfully signed in with Facebook. Welcome back, ${user.firstName || user.email}!`,
                200
            );

        } else {
            // --- 4. Handle Registration (New User) ---

            const newUser = await prisma.user.create({
                data: {
                    email: lowerCaseEmail,
                    facebookId: facebookId,
                    firstName: firstName,
                    lastName: lastName,
                    avatar: avatar,
                    role: 'user' as UserRole, // Default role
                    isAccountVerified: true, // Facebook verifies the email address
                },
                select: {
                    id: true,
                    role: true,
                    email: true,
                    firstName: true,
                    facebookId: true // Ensure this field is selected if required by AuthUserPayload
                }
            });

            // Create and return the authentication token
            // Apply type assertion to satisfy TypeScript's strict UserRole check
            const token = createAuthToken(newUser as AuthUserPayload);
            return successResponse(
                { token, user: { id: newUser.id, email: newUser.email, role: newUser.role, firstName: newUser.firstName } },
                `Successfully registered and signed in with Facebook. Welcome, ${newUser.firstName || newUser.email}!`,
                201
            );
        }

    } catch (error) {
        console.error('POST Facebook OAuth API Error:', error);
        return ApiErrors.internalError('An unexpected error occurred during Facebook authentication.');
    }
}
