/**
 * app/api/artists/profile/route.ts
 * Creates or updates artist profile details after signup.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ApiErrors, successResponse } from '@/lib/api-response';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    const {
      userId,
      stageName,
      artistType,
      subArtistType,
      achievements,
      yearsOfExperience,
      shortBio,
      performingLanguages,
      performingEventTypes,
      performingStates,
      performingDurationFrom,
      performingDurationTo,
      performingMembers,
      offStageMembers,
      contactNumber,
      whatsappNumber,
      contactEmail,
      soloChargesFrom,
      soloChargesTo,
      soloChargesDescription,
      chargesWithBacklineFrom,
      chargesWithBacklineTo,
      chargesWithBacklineDescription,
      youtubeChannelId,
      instagramId,
    } = body;

    if (!userId) {
      return ApiErrors.badRequest('User ID is required to create artist profile.');
    }

    // Ensure user exists and is artist
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'artist') {
      return ApiErrors.badRequest('Invalid artist user.');
    }

    // Update the artist table entry
    const updatedArtist = await prisma.artist.update({
      where: { userId },
      data: {
        stageName,
        artistType,
        subArtistType,
        achievements,
        yearsOfExperience: yearsOfExperience ? parseInt(yearsOfExperience) : null,
        shortBio,
        performingLanguage: performingLanguages?.join(','),
        performingEventType: performingEventTypes?.join(','),
        performingStates: performingStates?.join(','),
        performingDurationFrom,
        performingDurationTo,
        performingMembers,
        offStageMembers,
        contactNumber,
        whatsappNumber,
        contactEmail,
        soloChargesFrom: soloChargesFrom ? parseFloat(soloChargesFrom) : null,
        soloChargesTo: soloChargesTo ? parseFloat(soloChargesTo) : null,
        soloChargesDescription,
        chargesWithBacklineFrom: chargesWithBacklineFrom ? parseFloat(chargesWithBacklineFrom) : null,
        chargesWithBacklineTo: chargesWithBacklineTo ? parseFloat(chargesWithBacklineTo) : null,
        chargesWithBacklineDescription,
        youtubeChannelId,
        instagramId,
      },
    });

    return successResponse(
      { artistProfile: updatedArtist },
      'Artist profile setup completed successfully.',
      200
    );
  } catch (error: any) {
    console.error('Artist Profile Setup Error:', error);
    return ApiErrors.internalError('Failed to complete artist profile setup.');
  }
}
