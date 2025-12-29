/**
 * app/api/auth/forgot-password/route.ts
 *
 * Handles the initiation of the password reset process.
 * Generates a reset token and sends a simulated reset link to the user's email.
 *
 * Priority 4: POST /api/auth/forgot-password
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ApiErrors, successResponse } from '@/lib/api-response';
import { sendForgotPasswordEmail } from '@/lib/email';

const RESET_TOKEN_EXPIRY_MINUTES = 10;

/**
 * Generates a 6-digit numeric OTP.
 */
const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Handles POST requests to request a password reset OTP.
 */
export async function POST(request: NextRequest): Promise<NextResponse<any>> {
    let body;
    try {
        body = await request.json();
    } catch (e) {
        return ApiErrors.badRequest('Invalid JSON body.'); 
    }

    const { email } = body;

    if (!email) {
        return ApiErrors.badRequest('Email is required to initiate password reset.');
    }

    try {
        const lowerCaseEmail = email.toLowerCase();
        
        const user = await prisma.user.findUnique({
            where: { email: lowerCaseEmail },
        });

        if (!user) {
            // Security: Don't reveal if user exists
            return successResponse(
                {}, 
                'If an account exists for this email, an OTP has been sent.',
                200
            );
        }
        
        // Generate OTP and Expiry
        const otp = generateOTP();
        const resetTokenExpiry = new Date(Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000);

        // Update User Record with OTP
        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken: otp,
                resetTokenExpiry: resetTokenExpiry,
            }
        });

        // Send OTP Email
        const emailResult = await sendForgotPasswordEmail(user.email!, otp);
        console.log('OTP Email Result:', emailResult);
        if (!emailResult.success) {
            console.error('Failed to send OTP email:', emailResult.error);
            return ApiErrors.internalError('Failed to send OTP email.');
        }

        return successResponse(
            {}, 
            'If an account exists for this email, an OTP has been sent.',
            200
        );

    } catch (error) {
        console.error('Forgot Password API Error:', error);
        return ApiErrors.internalError('An unexpected error occurred during password recovery initiation.');
    }
}