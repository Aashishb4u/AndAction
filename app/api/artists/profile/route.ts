/**
 * app/api/artists/profile/route.ts
 * Creates or updates artist profile details after signup.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ApiErrors, successResponse } from '@/lib/api-response';
import { geocodeAddress } from '@/lib/geocoding';

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

    let geocodeData: { latitude?: number; longitude?: number; geocodedAt?: Date } = {};
    if (user.city && (!user.latitude || !user.longitude)) {
      try {
        const coords = await geocodeAddress(user.city, user.state || undefined);
        if (coords) {
          geocodeData = {
            latitude: coords.lat,
            longitude: coords.lng,
            geocodedAt: new Date(),
          };
          console.log(`✅ Geocoded ${user.city}: (${coords.lat}, ${coords.lng})`);
        }
      } catch (error) {
        console.error('Geocoding error during profile setup:', error);
        // Don't fail the request if geocoding fails
      }
    }

    // Update user coordinates if geocoded
    if (geocodeData.latitude && geocodeData.longitude) {
      await prisma.user.update({
        where: { id: userId },
        data: geocodeData,
      });
    }

    // Check if artist profile exists, create if not (for OAuth users)
    const existingArtist = await prisma.artist.findUnique({
      where: { userId },
    });

    const artistData = {
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
    };

    const updatedArtist = existingArtist
      ? await prisma.artist.update({
          where: { userId },
          data: artistData,
        })
      : await prisma.artist.create({
          data: {
            userId,
            ...artistData,
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
      artistType,
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
      return ApiErrors.badRequest("User ID is required.");
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser || existingUser.role !== "artist") {
      return ApiErrors.badRequest("Invalid artist user.");
    }

    // Check if city or state is being updated
    const isCityUpdated = city !== undefined && city !== existingUser.city;
    const isStateUpdated = state !== undefined && state !== existingUser.state;

    // Prepare geocoding if location changed
    let geocodeData: { latitude?: number; longitude?: number; geocodedAt?: Date } = {};
    if (isCityUpdated || isStateUpdated) {
      const geocodeCity = city !== undefined ? city : existingUser.city;
      const geocodeState = state !== undefined ? state : existingUser.state;

      if (geocodeCity) {
        try {
          const coords = await geocodeAddress(geocodeCity, geocodeState || undefined);
          if (coords) {
            geocodeData = {
              latitude: coords.lat,
              longitude: coords.lng,
              geocodedAt: new Date(),
            };
            console.log(`✅ Geocoded ${geocodeCity}: (${coords.lat}, ${coords.lng})`);
          }
        } catch (error) {
          console.error('Geocoding error during profile update:', error);
          // Don't fail the request if geocoding fails
        }
      }
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
        ...geocodeData, // Add geocoded coordinates if available
      },
    });
    const updatedArtistProfile = await prisma.artist.update({
      where: { userId },
      data: {
        ...(stageName !== undefined && { stageName }),
        ...(artistType !== undefined && { artistType }),
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
        ...(contactNumber !== undefined && { contactNumber }),
        ...(whatsappNumber !== undefined && { whatsappNumber }),
        ...(contactEmail !== undefined && { contactEmail }),
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
