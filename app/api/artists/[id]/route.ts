/**
 * app/api/artists/[id]/route.ts
 *
 * Handles:
 * 1. GET /api/artists/[id]: Retrieves the public profile details for a specific Artist ID.
 * This route is public (unauthenticated).
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ApiErrors, successResponse } from '@/lib/api-response';

// Define the structure for the URL parameters
interface ArtistRouteContext {
    params: {
        id: string; // The ID of the artist (Artist model ID, NOT the UserId)
    };
}

/**
 * Handles GET requests to retrieve a public artist profile.
 */
export async function GET(
    request: NextRequest,
    context: ArtistRouteContext
): Promise<NextResponse<any>> {
    const artistId = context.params.id;

    if (!artistId) {
        return ApiErrors.badRequest('Artist ID is required.');
    }

    try {
        // Fetch the Artist profile, including the related User data
        const artist = await prisma.artist.findUnique({
            where: { 
                id: artistId 
            },
            select: {
                id: true,
                stageName: true,
                artistType: true,
                subArtistType: true,
                achievements: true,
                yearsOfExperience: true,
                shortBio: true,
                performingLanguage: true,
                performingEventType: true,
                performingStates: true,
                performingDurationFrom: true,
                performingDurationTo: true,
                performingMembers: true,
                offStageMembers: true,
                soloChargesFrom: true,
                soloChargesTo: true,
                soloChargesDescription: true,
                chargesWithBacklineFrom: true,
                chargesWithBacklineTo: true,
                chargesWithBacklineDescription: true,
                youtubeChannelId: true,
                instagramId: true,
                createdAt: true,
                updatedAt: true,
                whatsappNumber: true,
                // Include the related User model for basic contact info and verification status
                user: {
                    select: {
                        id: true, // This is the userId
                        firstName: true,
                        lastName: true,
                        avatar: true, // Assumed to be 'profilePictureUrl' based on latest schema update
                        isArtistVerified: true, // Verification status
                        city: true,
                        state: true,
                        phoneNumber: true,
                        // NOTE: Email and phone are typically private, so we don't expose them publicly
                    }
                }
            }
        });

        if (!artist) {
            return ApiErrors.notFound('Artist not found.');
        }

        // Success Response
        return successResponse(
            { artist },
            'Artist profile retrieved successfully.',
            200
        );

    } catch (error) {
        console.error('GET /api/artists/[id] API Error:', error);
        return ApiErrors.internalError('An unexpected error occurred while fetching the artist profile.');
    }
}
