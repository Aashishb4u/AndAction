/**
 * app/api/artists/profile/route.ts
 *
 * Handles the creation (POST) and updating (PUT) of the detailed Artist profile record.
 * This is performed by an authenticated user who has the 'artist' role.
 *
 * Priority 8: POST /api/artists/profile
 * Priority 9: PUT /api/artists/profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ApiErrors, successResponse } from '@/lib/api-response';
import { auth } from '@/auth'; // NextAuth server-side session access
// Import specific types from Prisma Client to satisfy the type checker
import { Prisma } from '@prisma/client'; 

/**
 * Defines the fields allowed for direct creation/update on the Artist model.
 * These are keys from the JSON body that correspond to your Prisma Artist model.
 */
const allowedArtistFields = [
    'stageName', 'artistType', 'subArtistType', 'achievements', 'shortBio',
    'performingLanguage', 'performingEventType', 'performingStates',
    'performingDurationFrom', 'performingDurationTo', 'performingMembers', 'offStageMembers',
    'contactNumber', 'whatsappNumber', 'contactEmail',
    'soloChargesFrom', 'soloChargesTo', 'soloChargesDescription',
    'chargesWithBacklineFrom', 'chargesWithBacklineTo', 'chargesWithBacklineDescription',
    'youtubeChannelId', 'instagramId',
];

/**
 * Handles POST requests to create the Artist profile.
 */
export async function POST(request: NextRequest): Promise<NextResponse<any>> {
    try {
        // 1. Session Validation and Role Check (CRITICAL STEP)
        const session = await auth();

        if (!session || !session.user || !session.user.id) {
            return ApiErrors.unauthorized();
        }
        
        const userId = session.user.id;
        
        // Ensure the user actually has the 'artist' role before allowing creation
        if (session.user.role !== 'artist') {
            return ApiErrors.forbidden();
        }

        // 2. Check for Pre-existing Artist Profile
        const existingArtist = await prisma.artist.findUnique({
            where: { userId: userId }
        });

        if (existingArtist) {
            // If the profile already exists, use a PUT request instead
            return ApiErrors.conflict('Artist profile already exists. Use PUT /api/artists/profile to update.');
        }

        // 3. Parse Body and Filter Update Data
        const body = await request.json();

        // Check for minimum required fields (stageName is generally mandatory for an artist)
        if (!body.stageName) {
            return ApiErrors.badRequest('The stageName is required to create the profile.');
        }

        // Initialize createData as a partial of the UncheckedCreateInput type to handle the foreign key (userId) directly.
        const createData: Prisma.ArtistUncheckedCreateInput = { userId };

        // Filter and compile data for creation
        allowedArtistFields.forEach(field => {
            if (body[field] !== undefined) {
                // Use a non-type-safe assignment here, relying on allowedArtistFields to filter valid keys
                (createData as any)[field] = body[field];
            }
        });

        // 4. Handle specific data types (e.g., converting 'yearsOfExperience' to Int)
        if (body.yearsOfExperience !== undefined) {
            const years = parseInt(body.yearsOfExperience, 10);
            if (!isNaN(years)) {
                createData.yearsOfExperience = years;
            }
        }
        
        // 5. Create the Artist Record
        const newArtist = await prisma.artist.create({
            // The type checker is now satisfied because we've structured createData 
            // to match the ArtistUncheckedCreateInput pattern (providing userId directly).
            data: createData,
            select: {
                // Select only the non-sensitive fields to return
                id: true,
                stageName: true,
                artistType: true,
                yearsOfExperience: true,
                createdAt: true,
                userId: true,
            }
        });

        // 6. Success Response
        return successResponse(
            newArtist,
            `Artist profile for ${newArtist.stageName} created successfully.`,
            201 // 201 Created status
        );

    } catch (error) {
        console.error('POST Artist Profile API Error:', error);
        return ApiErrors.internalError('An unexpected error occurred during artist profile creation.');
    }
}

// --- PUT Handler (Update Artist Profile) ---

/**
 * Handles PUT requests to update the authenticated artist's profile information.
 */
export async function PUT(request: NextRequest): Promise<NextResponse<any>> {
    try {
        // 1. Session Validation and Role Check (CRITICAL STEP)
        const session = await auth();

        if (!session || !session.user || !session.user.id) {
            return ApiErrors.unauthorized();
        }
        
        const userId = session.user.id;
        
        // Ensure the user actually has the 'artist' role before allowing update
        if (session.user.role !== 'artist') {
            return ApiErrors.forbidden();
        }

        // 2. Check for Existing Artist Profile
        const existingArtist = await prisma.artist.findUnique({
            where: { userId: userId }
        });

        if (!existingArtist) {
            // Cannot update if the profile hasn't been created yet
            return ApiErrors.notFound('Artist profile does not exist. Please use POST /api/artists/profile to create it first.');
        }

        // 3. Parse Body and Filter Update Data
        const body = await request.json();

        // Use Prisma.ArtistUncheckedUpdateInput for the data object
        const updateData: Prisma.ArtistUncheckedUpdateInput = {};

        // Filter and compile data for update
        allowedArtistFields.forEach(field => {
            if (body[field] !== undefined) {
                // Use a non-type-safe assignment here, relying on allowedArtistFields to filter valid keys
                (updateData as any)[field] = body[field];
            }
        });

        // 4. Handle specific data types (e.g., converting 'yearsOfExperience' to Int)
        if (body.yearsOfExperience !== undefined) {
            const years = parseInt(body.yearsOfExperience, 10);
            if (!isNaN(years)) {
                updateData.yearsOfExperience = years;
            }
        }
        
        // 5. Input Validation Check
        if (Object.keys(updateData).length === 0) {
            return ApiErrors.badRequest('No valid fields provided for update.');
        }

        // 6. Update the Artist Record
        const updatedArtist = await prisma.artist.update({
            where: { userId: userId },
            data: updateData,
            select: {
                // Select only the non-sensitive fields to return
                id: true,
                stageName: true,
                artistType: true,
                yearsOfExperience: true,
                updatedAt: true,
                userId: true,
            }
        });

        // 7. Success Response
        return successResponse(
            updatedArtist,
            `Artist profile for ${updatedArtist.stageName} updated successfully.`,
        );

    } catch (error) {
        console.error('PUT Artist Profile API Error:', error);
        return ApiErrors.internalError('An unexpected error occurred during artist profile update.');
    }
}
