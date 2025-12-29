
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ApiErrors, successResponse } from '@/lib/api-response';

export async function POST(request: NextRequest): Promise<NextResponse<any>> {
    let body;
    try {
        body = await request.json();
    } catch (e) {
        return ApiErrors.badRequest('Invalid JSON body.');
    }

    const { email, otp } = body;

    if (!email || !otp) {
        return ApiErrors.badRequest('Email and OTP are required.');
    }

    try {
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

    } catch (error) {
        console.error('Verify OTP API Error:', error);
        return ApiErrors.internalError('An unexpected error occurred during OTP verification.');
    }
}
