import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/password';
import { ApiErrors, successResponse, ApiResponse } from '@/lib/api-response';

/**
 * Utility function to strip sensitive data (like the password) from the user object.
 * @param user The user object from Prisma (with password)
 * @returns A safe user object
 */
const selectSafeUser = (user: any) => {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
};

export async function POST(request: NextRequest): Promise<NextResponse<any>> {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return ApiErrors.badRequest('Invalid JSON body.');
  }

  const { email, phone, countryCode, password } = body;

  // 1️⃣ Basic Input Validation
  if ((!email && !phone) || !password) {
    return ApiErrors.badRequest(
      'Either email or phone (with country code) and password are required for login.'
    );
  }

  try {
    const lowerCaseEmail = email ? String(email).toLowerCase().trim() : undefined;
    const normalizedPhone = phone ? String(phone).replace(/\D/g, '') : undefined;
    const normalizedCountryCode = countryCode ? String(countryCode).trim() : undefined;

    // 2️⃣ Find User (email or phone)
    let user: any | null = null;

    if (lowerCaseEmail) {
      user = await prisma.user.findUnique({
        where: { email: lowerCaseEmail },
        select: {
          id: true,
          email: true,
          role: true,
          password: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          countryCode: true,
          avatar: true,
          city: true,
          state: true,
          isAccountVerified: true,
        },
      });
    }

    if (!user && normalizedPhone) {
      user = await prisma.user.findFirst({
        where: {
          phoneNumber: normalizedPhone,
          countryCode: normalizedCountryCode,
        },
        select: {
          id: true,
          email: true,
          role: true,
          password: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          countryCode: true,
          avatar: true,
          city: true,
          state: true,
          isAccountVerified: true,
        },
      });
    }

    // 3️⃣ Handle User Not Found
    if (!user) {
      return ApiErrors.unauthorized();
    }

    // 4️⃣ Ensure Password Exists
    if (!user.password) {
      return ApiErrors.unauthorized();
    }

    // 5️⃣ Verify Password
    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return ApiErrors.unauthorized();
    }

    // 6️⃣ Strip sensitive fields
    const safeUser = selectSafeUser(user);

    // 7️⃣ Add identifier for frontend Sign In compatibility
    const contactIdentifier = safeUser.email || safeUser.phoneNumber || null;

    // 8️⃣ Return Success Response
    return successResponse(
      {
        user: safeUser,
        contactIdentifier,
      },
      `Login successful. Welcome back, ${safeUser.firstName || safeUser.email || 'user'}!`
    );
  } catch (error) {
    console.error('Customer Sign In API Error:', error);
    return ApiErrors.internalError('An unexpected error occurred during login.');
  }
}
