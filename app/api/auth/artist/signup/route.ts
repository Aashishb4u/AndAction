/**
 * app/api/auth/artist/signup/route.ts
 * Handles new artist account registration (with password).
 * Creates both User (role: 'artist') and Artist profile atomically.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, validatePasswordStrength } from '@/lib/password';
import { ApiErrors, successResponse } from '@/lib/api-response';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const {
      email,
      phoneNumber,
      countryCode,
      password,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      address,
      pinCode,
      state,
      city,
      noMarketing,
      shareData,
    } = body;

    if (!email || !password || !firstName || !lastName) {
      return ApiErrors.badRequest('Email, password, first name and last name are required.');
    }

    const lowerCaseEmail = email.toLowerCase();

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: lowerCaseEmail }, phoneNumber ? { phoneNumber } : {}],
      },
    });

    if (existingUser) {
      return ApiErrors.conflict('A user with this email or phone number already exists.');
    }

    const strength = validatePasswordStrength(password);
    if (!strength.isValid) {
      return ApiErrors.badRequest(strength.message || 'Weak password.');
    }

    const hashedPassword = await hashPassword(password);
    const parsedDob = dateOfBirth ? new Date(dateOfBirth) : null;

    const newUser = await prisma.user.create({
      data: {
        email: lowerCaseEmail,
        phoneNumber: phoneNumber || null,
        countryCode: countryCode || '+91',
        password: hashedPassword,
        firstName,
        lastName,
        gender: gender || null,
        dob: parsedDob,
        address: address || null,
        zip: pinCode || null,
        state: state || null,
        city: city || null,
        role: 'artist',
        isMarketingOptIn: !noMarketing,
        isDataSharingOptIn: shareData,
        isAccountVerified: true,
        isArtistVerified: false,
      },
    });

    const artistProfile = await prisma.artist.create({
      data: {
        userId: newUser.id,
        stageName: `${firstName} ${lastName}`,
        contactEmail: lowerCaseEmail,
        contactNumber: phoneNumber,
        whatsappNumber: phoneNumber,
      },
    });

    return successResponse(
      {
        user: newUser,
        artistProfile,
      },
      'Artist account created successfully. Please sign in to continue profile setup.',
      201
    );
  } catch (error: any) {
    console.error('Artist Sign-up Error:', error);
    if (error.code === 'P2002') {
      return ApiErrors.conflict('Email or phone number already exists.');
    }
    return ApiErrors.internalError('Unexpected error during artist registration.');
  }
}
