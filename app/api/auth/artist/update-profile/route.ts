/**
 * app/api/auth/artist/update-profile/route.ts
 * Updates existing OAuth user's profile to complete artist registration.
 * Used when users sign up with Google/Facebook and need to complete profile.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ApiErrors, successResponse } from "@/lib/api-response";
import { geocodeFullAddress } from "@/lib/geocoding";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get current session - OAuth users should already be authenticated
    const session = await auth();

    if (!session?.user?.id) {
      return ApiErrors.unauthorized();
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      address,
      latitude: inputLatitude,
      longitude: inputLongitude,
      pinCode,
      state,
      city,
      noMarketing,
      shareData,
    } = body;

    if (!firstName || !lastName) {
      return ApiErrors.badRequest("First name and last name are required.");
    }
    const existingUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { artists: { orderBy: { profileOrder: "asc" }, take: 1 } },
    });

    if (!existingUser) {
      return ApiErrors.notFound("User not found.");
    }

    if (existingUser.role !== "artist") {
      return ApiErrors.forbidden();
    }

    const parsedDob = dateOfBirth ? new Date(dateOfBirth) : null;
    const fullName = `${firstName} ${lastName}`;

    let latitude: number | null = null;
    let longitude: number | null = null;

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

    if (Number.isFinite(parsedLat) && Number.isFinite(parsedLng)) {
      latitude = parsedLat as number;
      longitude = parsedLng as number;
    } else if (address || city || state || pinCode) {
      try {
        const geocodeResult = await geocodeFullAddress({
          address,
          city,
          state,
          pinCode,
          country: "India",
        });
        if (geocodeResult) {
          latitude = geocodeResult.lat;
          longitude = geocodeResult.lng;
        }
      } catch (geoError) {
        console.error("Failed to geocode artist location:", geoError);
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        firstName,
        lastName,
        gender: gender || null,
        dob: parsedDob,
        name: fullName,
        address: address || null,
        zip: pinCode || null,
        state: state || null,
        city: city || null,
        latitude: latitude,
        longitude: longitude,
        geocodedAt: latitude && longitude ? new Date() : null,
        isMarketingOptIn: !noMarketing,
        isDataSharingOptIn: !!shareData,
      },
    });

    let artistProfile = existingUser.artists?.[0] ?? null;

    if (!artistProfile) {
      artistProfile = await prisma.artist.create({
        data: {
          userId: session.user.id,
          profileOrder: 0,
        },
      });
    }

    return successResponse(
      {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          phoneNumber: updatedUser.phoneNumber,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          role: updatedUser.role,
        },
        artistProfile: {
          id: artistProfile.id,
        },
      },
      "Profile updated successfully",
    );
  } catch (error: any) {
    console.error(" Update profile error:", error);
    return ApiErrors.internalError();
  }
}
