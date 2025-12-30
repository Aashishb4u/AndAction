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
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'artist') {
      return ApiErrors.badRequest('Invalid artist user.');
    }

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
    const refreshedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        avatar: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        countryCode: true,
        city: true,
        state: true,
        address: true,
        zip: true,
        gender: true,
        dob: true,
        isAccountVerified: true,
        role: true,
      },
    });

    return successResponse(
      {
        user: {
          ...refreshedUser,
          isArtistVerified: true,
        },
        artistProfile: updatedArtist
      },
      "Artist profile setup completed successfully.",
      200
    );

  } catch (error: any) {
    console.error('Artist Profile Setup Error:', error);
    return ApiErrors.internalError('Failed to complete artist profile setup.');
  }
}


export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const {
      userId,
      stageName,
      subArtistType,
      firstName,
      lastName,
      gender,
      dob,
      address,
      pinCode,
      city,
      state,
      shortBio,
      achievements,
      yearsOfExperience,
      performingLanguage,
      performingEventType,
      performingStates,
      performingDurationFrom,
      performingDurationTo,
      performingMembers,
      offStageMembers,
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
      return ApiErrors.badRequest("User ID is required.");
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser || existingUser.role !== "artist") {
      return ApiErrors.badRequest("Invalid artist user.");
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(gender && { gender }),
        ...(dob && { dob: new Date(dob) }),
        ...(address !== undefined && { address }),
        ...(pinCode !== undefined && { zip: pinCode }),
        ...(city !== undefined && { city }),
        ...(state !== undefined && { state }),
      },
    });
    const updatedArtistProfile = await prisma.artist.update({
      where: { userId },
      data: {
        ...(stageName !== undefined && { stageName }),
        ...(subArtistType !== undefined && { subArtistType }),
        ...(shortBio !== undefined && { shortBio }),
        ...(achievements !== undefined && { achievements }),
        ...(yearsOfExperience !== undefined && { yearsOfExperience: Number(yearsOfExperience) }),
        ...(performingLanguage !== undefined && { performingLanguage }),
        ...(performingEventType !== undefined && { performingEventType }),
        ...(performingStates !== undefined && { performingStates }),
        ...(performingDurationFrom !== undefined && { performingDurationFrom }),
        ...(performingDurationTo !== undefined && { performingDurationTo }),
        ...(performingMembers !== undefined && { performingMembers }),
        ...(offStageMembers !== undefined && { offStageMembers }),
        ...(soloChargesFrom !== undefined && { soloChargesFrom: Number(soloChargesFrom) }),
        ...(soloChargesTo !== undefined && { soloChargesTo: Number(soloChargesTo) }),
        ...(soloChargesDescription !== undefined && { soloChargesDescription }),
        ...(chargesWithBacklineFrom !== undefined && { chargesWithBacklineFrom: Number(chargesWithBacklineFrom) }),
        ...(chargesWithBacklineTo !== undefined && { chargesWithBacklineTo: Number(chargesWithBacklineTo) }),
        ...(chargesWithBacklineDescription !== undefined && { chargesWithBacklineDescription }),
        ...(youtubeChannelId !== undefined && { youtubeChannelId }),
        ...(instagramId !== undefined && { instagramId }),
      },
    });

    const refreshedUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { artist: true },
    });

    return successResponse(
      {
        user: refreshedUser,
        artistProfile: updatedArtistProfile,
      },
      "Artist profile updated successfully.",
      200
    );

  } catch (error) {
    console.error("Artist Profile Update Error:", error);
    return ApiErrors.internalError("Failed to update artist profile.");
  }
}
