/**
 * app/api/artists/profile/route.ts
 * Creates or updates artist profile details after signup.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ApiErrors, successResponse } from '@/lib/api-response';
import { geocodeAddress } from '@/lib/geocoding';

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
      profileImage,
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
        ...(profileImage !== undefined && { profileImage: profileImage }),
      },
    });

    const refreshedUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { artists: { orderBy: { profileOrder: "asc" }, take: 1 } },
    });

    // Sync avatar to admin panel if profileImage was updated
    if (profileImage !== undefined) {
      try {
        const adminBase = 
          (process.env.ADMIN_API_BASE_URL ||
            process.env.NEXT_PUBLIC_ADMIN_BASE_URL ||
            "https://admin.andaction.in")
            .trim()
            .replace(/\/+$/, "");

        const vpsSecret = (process.env.VPS_UPLOAD_SECRET || "").trim();
        const publicSecret = (process.env.PUBLIC_UPLOAD_SECRET || "").trim();
        const secrets = Array.from(
          new Set([vpsSecret, publicSecret].filter((s) => typeof s === "string" && s)),
        );
        
        if (secrets.length > 0) {
          const email = refreshedUser.email || "";
          const phoneNumber = refreshedUser.phoneNumber || "";
          const profileImageUrl = updatedArtistProfile.profileImage || "";

          for (const secret of secrets) {
            try {
              const res = await fetch(`${adminBase}/api/media/sync-avatar`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-upload-secret": secret,
                },
                body: JSON.stringify({
                  email: email || null,
                  phoneNumber: phoneNumber || null,
                  avatarUrl: profileImageUrl,
                }),
              });
              if (res.ok) {
                console.log(`✅ Synced artist profileImage to admin panel: ${email}`);
                break;
              }
            } catch {
              // Continue to next secret
            }
          }
        }
      } catch (error) {
        console.error("Failed to sync profileImage to admin panel:", error);
      }
    }

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
