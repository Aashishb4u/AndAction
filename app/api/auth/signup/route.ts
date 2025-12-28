// app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, validatePasswordStrength } from '@/lib/password';
import { ApiErrors, successResponse } from '@/lib/api-response';
import { UserRole } from '@/lib/types/database';

export async function POST(request: NextRequest): Promise<NextResponse<any>> {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return ApiErrors.badRequest('Invalid JSON body.');
  }

  const {
    email,
    phone,
    countryCode,
    password,
    firstName,
    lastName,
    avatar,
    state,
    city,
    noMarketing,
    shareData,
  } = body;

  const lowerCaseEmail = email ? email.toLowerCase() : undefined;
  const contactMethod = lowerCaseEmail || phone;

  if (!contactMethod || !password || !firstName || !lastName) {
    return ApiErrors.badRequest(
      'Contact method (email or phone), password, first name, and last name are required.'
    );
  }

  if (phone && !countryCode) {
    return ApiErrors.badRequest('Phone registration requires a country code.');
  }

  const strengthCheck = validatePasswordStrength(password);

  if (!strengthCheck.isValid) {
    return ApiErrors.badRequest(strengthCheck.message || 'Password strength requirements not met.');
  }

  try {
    // Normalize phone (store raw digits) and email
    const normalizedPhone = phone ? String(phone).replace(/\D/g, '') : undefined;
    const normalizedCountryCode = countryCode ? String(countryCode).trim() : undefined;

    // Duplicate checks
    let existingUser: any = null;
    if (lowerCaseEmail) {
      existingUser = await prisma.user.findUnique({ where: { email: lowerCaseEmail } });
    }

    if (!existingUser && normalizedPhone) {
      existingUser = await prisma.user.findFirst({
        where: {
          phoneNumber: normalizedPhone,
          countryCode: normalizedCountryCode,
        },
      });
    }

    if (existingUser) {
      const conflictField =
        existingUser.email === lowerCaseEmail ? 'email' : 'phone number';
      return ApiErrors.conflict(`A user with this ${conflictField} already exists.`);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email: lowerCaseEmail || null,
        phoneNumber: normalizedPhone || null,
        countryCode: normalizedCountryCode || null,
        password: hashedPassword,
        firstName,
        lastName,
        city: city || null,
        state: state || null,
        avatar: avatar ? String(avatar) : null,
        role: 'user' as UserRole,
        isAccountVerified: true, // OTP flow verified earlier
        isArtistVerified: false,
        isMarketingOptIn: !noMarketing,
        isDataSharingOptIn: !!shareData,
      },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        phoneNumber: true,
        countryCode: true,
      },
    });

    // Remove any leftover verification tokens for this identifier (if present)
    const finalIdentifier = lowerCaseEmail || (normalizedPhone ? `${normalizedCountryCode}${normalizedPhone}` : undefined);
    if (finalIdentifier) {
      await prisma.verificationToken.deleteMany({
        where: {
          identifier: finalIdentifier,
        },
      });
    }

    // Return success with created user and helpful contactIdentifier for client-side sign-in
    const contactIdentifier = lowerCaseEmail || (normalizedPhone || null);

    return successResponse(
      {
        user: newUser,
        // Helper field for frontend to auto sign-in using next-auth credentials provider
        contactIdentifier,
      },
      'Customer account created successfully.',
      201
    );
  } catch (error) {
    console.error('Customer Sign-up API Error:', error);
    if ((error as any)?.code === 'P2002') {
      return ApiErrors.conflict('A user with this contact information already exists.');
    }
    return ApiErrors.internalError('An unexpected error occurred during registration.');
  }
}
