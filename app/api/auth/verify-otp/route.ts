/**
 * POST /api/auth/verify-otp
 * Verifies OTP for authentication (phone or email)
 * Supports both mobile login/signup and email password reset
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ApiErrors, successResponse } from '@/lib/api-response';

export async function POST(request: NextRequest): Promise<NextResponse<any>> {
    let body;
    try {
        body = await request.json();
    } catch {
        return ApiErrors.badRequest('Invalid JSON body.');
    }

    const { email, phoneNumber, countryCode = "+91", otp, type = "email" } = body;

    if (!otp) {
        return ApiErrors.badRequest('OTP is required.');
    }

    try {
        // Handle mobile OTP verification
        if (type === "phone") {
            if (!phoneNumber) {
                return ApiErrors.badRequest('Phone number is required.');
            }

            const identifier = `${countryCode}${phoneNumber}`;

            // Find the most recent valid OTP for this phone number
            const otpRecord = await prisma.verificationToken.findFirst({
                where: {
                    identifier,
                    token: otp,
                    expires: {
                        gte: new Date(), // Not expired
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
            });

            if (!otpRecord) {
                return ApiErrors.badRequest("Invalid or expired OTP");
            }

            // Delete OTP record after successful verification
            await prisma.verificationToken.delete({
                where: { id: otpRecord.id },
            });

            // Find user
            const user = await prisma.user.findFirst({
                where: {
                    phoneNumber,
                    countryCode,
                },
            });

            if (!user) {
                return ApiErrors.notFound(
                    "User not found. Please complete signup first."
                );
            }

            // Return user data for NextAuth session
            return successResponse(
                {
                    user: {
                        id: user.id,
                        email: user.email,
                        phoneNumber: user.phoneNumber,
                        countryCode: user.countryCode,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        role: user.role,
                        isAccountVerified: user.isAccountVerified,
                        isArtistVerified: user.isArtistVerified,
                    },
                },
                "OTP verified successfully"
            );
        }

        // Handle email OTP verification (password reset flow)
        if (type === "email") {
            if (!email) {
                return ApiErrors.badRequest('Email is required.');
            }

            const user = await prisma.user.findFirst({
                where: {
                    email: email.toLowerCase(),
                    resetToken: otp,
                    resetTokenExpiry: {
                        gt: new Date(),
                    },
                },
            });

            if (!user) {
                return ApiErrors.badRequest('Invalid or expired OTP.');
            }

            return successResponse({}, 'OTP verified successfully.', 200);
        }

        return ApiErrors.badRequest('Invalid verification type.');

    } catch (error) {
        console.error('Verify OTP API Error:', error);
        return ApiErrors.internalError('An unexpected error occurred during OTP verification.');
    }
}
