/**
 * app/api/users/profile/route.ts
 *
 * Handles the retrieval (GET) and updating (PUT) of the authenticated user's profile data.
 * This protected route sets the standard for session validation.
 *
 * Priority 6: GET /api/users/profile
 * Priority 7: PUT /api/users/profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ApiErrors, successResponse } from '@/lib/api-response';
// FIX: Assuming you export the 'auth' function for server-side session access
import { auth } from '@/auth'; 

/**
 * Strips sensitive data (like tokens and passwords) from the User object
 * before sending the response.
 * @param user The user object from Prisma (with potentially sensitive fields)
 * @returns A safe user object
 */
const selectSafeUser = (user: any) => {
    const { 
        password, resetToken, resetTokenExpiry, 
        verificationToken, verificationTokenExpiry, 
        phoneOtp, phoneOtpExpiry,
        ...safeUser 
    } = user;
    return safeUser;
};

// --- GET Handler (Retrieve Profile) ---

/**
 * Handles GET requests to retrieve the authenticated user's profile.
 */
export async function GET(request: NextRequest): Promise<NextResponse<any>> {
    try {
        // 1. Session Validation and User ID Retrieval (CRITICAL STEP)
        const session = await auth();

        if (!session || !session.user || !session.user.id) {
            // If no valid session, return 401 Unauthorized
            return ApiErrors.unauthorized();
        }

        const userId = session.user.id;
        const userRole = session.user.role; // Extract the custom role from the session

        // 2. Fetch User Data
        // Dynamically include the 'artist' relation only if the user is an artist.
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                // Fields to include directly from the User model (matches your schema)
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                avatar: true,
                isAccountVerified: true,
                isArtistVerified: true,
                phoneNumber: true,
                countryCode: true,
                city: true,
                state: true,
                address: true,
                zip: true,
                gender: true,
                dob: true,
                // Include sensitive fields only to strip them later in selectSafeUser
                password: true, 
                resetToken: true,
                verificationToken: true,
                phoneOtp: true,
                // Include the full Artist relation if the role is 'artist'
                artist: userRole === 'artist' ? {
                    select: {
                        stageName: true,
                        artistType: true,
                        shortBio: true,
                        // Add more artist fields as needed, e.g.,
                        // performingLanguage: true,
                        // soloChargesFrom: true,
                    }
                } : false,
            }
        });

        // 3. User Not Found (Should not happen if session is valid, but good for defense)
        if (!user) {
            return ApiErrors.notFound('User profile not found.');
        }

        // 4. Return Safe Data
        const safeUser = selectSafeUser(user);

        return successResponse(
            safeUser,
            'User profile retrieved successfully.',
        );

    } catch (error) {
        console.error('GET User Profile API Error:', error);
        // Handle potential errors during authentication or database access
        return ApiErrors.internalError('An unexpected error occurred while fetching the profile.');
    }
}

// --- PUT Handler (Update Profile) ---

/**
 * Handles PUT requests to update the authenticated user's profile information.
 */
export async function PUT(request: NextRequest): Promise<NextResponse<any>> {
    try {
        // 1. Session Validation and User ID Retrieval
        const session = await auth();

        if (!session || !session.user || !session.user.id) {
            return ApiErrors.unauthorized();
        }

        const userId = session.user.id;
        
        // 2. Parse Body and Filter Update Data
        const body = await request.json();
        
        // Allowed fields that a user can update directly on the User model
        const allowedFields = [
            'firstName', 'lastName', 'countryCode', 'phoneNumber',
            'city', 'state', 'address', 'zip', 'avatar',
            'gender', 'dob'
        ];
        
        // Create an update object containing only the allowed, provided fields
        const updateData: { [key: string]: any } = {};

        allowedFields.forEach(field => {
            if (body[field] !== undefined) {
                updateData[field] = body[field];
            }
        });
        
        // 3. Input Validation Check
        if (Object.keys(updateData).length === 0) {
            return ApiErrors.badRequest('No valid fields provided for update.');
        }

        // 4. Update the User Record
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            // Select the fields needed for the response (non-sensitive)
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                avatar: true,
                isAccountVerified: true,
                phoneNumber: true,
                city: true,
                state: true,
                address: true,
                zip: true,
                gender: true,
                dob: true,
            }
        });

        // 5. Success Response
        return successResponse(
            updatedUser,
            'User profile updated successfully.',
        );

    } catch (error) {
        console.error('PUT User Profile API Error:', error);
        return ApiErrors.internalError('An unexpected error occurred while updating the profile.');
    }
}
