/**
 * app/api/artists/profile/route.ts
 * Creates or updates artist profile details after signup.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ApiErrors, successResponse } from '@/lib/api-response';
import { geocodeFullAddress } from '@/lib/geocoding';

const parseYearsOfExperienceBucket = (input: unknown): number | null => {
  if (input === null || input === undefined) return null;

  if (typeof input === "number") {
    if (!Number.isFinite(input)) return null;
    return Math.trunc(input);
  }

  const raw = String(input).trim();
  if (!raw) return null;

  if (/^\d+$/.test(raw)) return parseInt(raw, 10);

  const normalized = raw.toLowerCase();
  if (normalized.includes("10+")) return 5;
  if (normalized.includes("5-10")) return 4;
  if (normalized.includes("3-5")) return 3;
  if (normalized.includes("1-3")) return 2;
  if (normalized.includes("0-1")) return 1;

  return null;
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    const {
      userId,
      createNewProfile,
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
    if (
      (!user.latitude || !user.longitude) &&
      (user.address || user.city || user.state || user.zip)
    ) {
      try {
        const coords = await geocodeFullAddress({
          address: user.address,
          city: user.city,
          state: user.state,
          pinCode: user.zip,
          country: "India",
        });
        if (coords) {
          geocodeData = {
            latitude: coords.lat,
            longitude: coords.lng,
            geocodedAt: new Date(),
          };
        }
      } catch (error) {
        console.error('Geocoding error during profile setup:', error);
        // Don't fail the request if geocoding fails
      }
    }

    // Update user coordinates and country code
    const userUpdateData: any = {
      ...geocodeData,
      countryCode: '+91',
    };
    await prisma.user.update({
      where: { id: userId },
      data: userUpdateData,
    });

    const parsedYearsOfExperience = parseYearsOfExperienceBucket(yearsOfExperience);
    if (yearsOfExperience !== undefined && yearsOfExperience !== null && String(yearsOfExperience).trim() !== "" && parsedYearsOfExperience === null) {
      return ApiErrors.badRequest("Invalid yearsOfExperience value.");
    }

    // Check if artist profile exists, create if not (for OAuth users)
    const existingPrimaryArtist = await prisma.artist.findFirst({
      where: { userId, profileOrder: 0 },
      select: { id: true, profileOrder: true },
    });

    const artistData = {
      stageName,
      artistType,
      subArtistType,
      achievements,
      yearsOfExperience: parsedYearsOfExperience,
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

    const updatedArtist = createNewProfile
      ? await (async () => {
          const last = await prisma.artist.findFirst({
            where: { userId },
            orderBy: { profileOrder: "desc" },
            select: { profileOrder: true },
          });
          const nextOrder = (last?.profileOrder ?? -1) + 1;
          return prisma.artist.create({
            data: {
              userId,
              profileOrder: nextOrder,
              ...artistData,
            },
          });
        })()
      : existingPrimaryArtist
      ? await prisma.artist.update({
          where: { id: existingPrimaryArtist.id },
          data: artistData,
        })
      : await prisma.artist.create({
          data: {
            userId,
            profileOrder: 0,
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
      artistProfileId,
      stageName,
      artistType,
      subArtistType,
      firstName,
      lastName,
      gender,
      dob,
      address,
      latitude: inputLatitude,
      longitude: inputLongitude,
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

    const normalizedContactNumber =
      contactNumber !== undefined && contactNumber !== null
        ? String(contactNumber).replace(/\D/g, "")
        : undefined;
    const normalizedWhatsappNumber =
      whatsappNumber !== undefined && whatsappNumber !== null
        ? String(whatsappNumber).replace(/\D/g, "")
        : undefined;

    const parsedLat =
      typeof inputLatitude === "number"
        ? inputLatitude
        : inputLatitude != null && String(inputLatitude).trim() !== ""
          ? Number(inputLatitude)
          : null;
    const parsedLng =
      typeof inputLongitude === "number"
        ? inputLongitude
        : inputLongitude != null && String(inputLongitude).trim() !== ""
          ? Number(inputLongitude)
          : null;

    const isCityUpdated = city !== undefined && city !== existingUser.city;
    const isStateUpdated = state !== undefined && state !== existingUser.state;
    const isAddressUpdated = address !== undefined && address !== existingUser.address;
    const isPinUpdated = pinCode !== undefined && pinCode !== existingUser.zip;

    // Prepare geocoding if location changed
    let geocodeData: { latitude?: number; longitude?: number; geocodedAt?: Date } = {};
    if (Number.isFinite(parsedLat) && Number.isFinite(parsedLng)) {
      geocodeData = {
        latitude: parsedLat as number,
        longitude: parsedLng as number,
        geocodedAt: new Date(),
      };
    } else if (isAddressUpdated || isPinUpdated || isCityUpdated || isStateUpdated) {
      const geocodeAddressValue = address !== undefined ? address : existingUser.address;
      const geocodeCity = city !== undefined ? city : existingUser.city;
      const geocodeState = state !== undefined ? state : existingUser.state;
      const geocodePin = pinCode !== undefined ? pinCode : existingUser.zip;

      try {
        const coords = await geocodeFullAddress({
          address: geocodeAddressValue,
          city: geocodeCity,
          state: geocodeState,
          pinCode: geocodePin,
          country: "India",
        });
        if (coords) {
          geocodeData = {
            latitude: coords.lat,
            longitude: coords.lng,
            geocodedAt: new Date(),
          };
        }
      } catch (error) {
        console.error("Geocoding error during profile update:", error);
      }
    }

    const phoneUpdateData: { phoneNumber?: string } = {};
    if (normalizedContactNumber && normalizedContactNumber.length >= 10 && normalizedContactNumber.length <= 15) {
      const existingPhoneOwner = await prisma.user.findFirst({
        where: {
          phoneNumber: normalizedContactNumber,
          NOT: { id: userId },
        },
        select: { id: true },
      });
      if (!existingPhoneOwner) {
        phoneUpdateData.phoneNumber = normalizedContactNumber;
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
                ...phoneUpdateData,
                // Save default country code +91 if not already set
                countryCode: '+91',
                ...geocodeData, // Add geocoded coordinates if available
            },
        });
    const targetArtist = artistProfileId
      ? await prisma.artist.findFirst({
          where: { id: artistProfileId, userId },
          select: { id: true },
        })
      : await prisma.artist.findFirst({
          where: { userId, profileOrder: 0 },
          select: { id: true },
        });

    if (!targetArtist) {
      return ApiErrors.notFound("Artist profile not found.");
    }

    const parsedYearsOfExperience = parseYearsOfExperienceBucket(yearsOfExperience);
    if (yearsOfExperience !== undefined && yearsOfExperience !== null && String(yearsOfExperience).trim() !== "" && parsedYearsOfExperience === null) {
      return ApiErrors.badRequest("Invalid yearsOfExperience value.");
    }

    const updatedArtistProfile = await prisma.artist.update({
      where: { id: targetArtist.id },
      data: {
        ...(stageName !== undefined && { stageName }),
        ...(artistType !== undefined && { artistType }),
        ...(subArtistType !== undefined && { subArtistType }),
        ...(shortBio !== undefined && { shortBio }),
        ...(achievements !== undefined && { achievements }),
        ...(yearsOfExperience !== undefined && { yearsOfExperience: parsedYearsOfExperience }),
        ...(performingLanguage !== undefined && { performingLanguage }),
        ...(performingEventType !== undefined && { performingEventType }),
        ...(performingStates !== undefined && { performingStates }),
        ...(performingDurationFrom !== undefined && { performingDurationFrom }),
        ...(performingDurationTo !== undefined && { performingDurationTo }),
        ...(performingMembers !== undefined && { performingMembers }),
        ...(offStageMembers !== undefined && { offStageMembers }),
        ...(normalizedContactNumber !== undefined && { contactNumber: normalizedContactNumber }),
        ...(normalizedWhatsappNumber !== undefined && { whatsappNumber: normalizedWhatsappNumber }),
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
      include: { artists: { orderBy: { profileOrder: "asc" }, take: 1 } },
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
