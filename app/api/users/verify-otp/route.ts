// In app/api/auth/verify-otp/route.ts
/**
 * route.ts (POST /api/auth/verify-otp)
 *
 * Priority 8 (Part 2): Finalizes phone verification by checking the OTP and
 * removing the token from the VerificationToken table.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ApiErrors, successResponse } from '@/lib/api-response';

interface VerifyOtpRequestBody {
    identifier: string;
    otp: string;
}

export async function POST(request: Request): Promise<NextResponse<any>> {
    try {
        const { identifier, otp }: VerifyOtpRequestBody = await request.json();

        if (!identifier || !otp) {
            return ApiErrors.badRequest('Identifier (phone number/email) and OTP are required.');
        }

        const tokenRecord = await prisma.verificationToken.findFirst({
            where: {
                identifier: identifier,
                token: otp, // Check for both identifier and the exact token
                expires: { gte: new Date() }, // Check if not expired
            },
            orderBy: {
                createdAt: 'desc',
            }
        });

        if (!tokenRecord) {
            const expiredCheck = await prisma.verificationToken.findFirst({
                where: { identifier: identifier },
            });
            
            if (expiredCheck && expiredCheck.expires < new Date()) {
                 return ApiErrors.badRequest('The verification code has expired. Please request a new one.');
            }
            
            return ApiErrors.badRequest('Invalid verification code.');
        }

        await prisma.verificationToken.delete({
            where: { id: tokenRecord.id },
        });

        return successResponse(
            { isVerified: true, identifier: identifier },
            'Verification code accepted successfully. Ready for password creation.'
        );

    } catch (error) {
        console.error('Error verifying OTP:', error);
        return ApiErrors.internalError('An unexpected error occurred during OTP verification.');
    }
}