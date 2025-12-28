/**
 * app/api/auth/forgot-password/route.ts
 *
 * Handles the initiation of the password reset process.
 * Generates a reset token and sends a simulated reset link to the user's email.
 *
 * Priority 4: POST /api/auth/forgot-password
 */

import { NextRequest, NextResponse } from 'next/server'; // Added NextResponse for type clarity
import { prisma } from '@/lib/prisma';
import { ApiErrors, successResponse, ApiResponse } from '@/lib/api-response';
import crypto from 'crypto';

const RESET_TOKEN_EXPIRY_HOURS = 1;

/**
 * Generates a secure, hexadecimal reset token.
 */
const generateResetToken = (): string => {
    return crypto.randomBytes(32).toString('hex');
};

/**
 * Handles POST requests to request a password reset link.
 * FIX: Function signature changed to clean, type-safe Promise<NextResponse<any>>
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
            console.warn(`Forgot Password attempted for non-existent email: ${lowerCaseEmail}`);
            
            return successResponse(
                {}, 
                'If an account exists for this email, a password reset link has been sent.',
                200
            );
        }
        
        // 4. Generate Token and Expiry
        const resetToken = generateResetToken();
        const resetTokenExpiry = new Date(Date.now() + RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000); // 1 hour from now

        // 5. Update User Record with Token
        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken: resetToken,
                resetTokenExpiry: resetTokenExpiry,
            }
        });

        console.log(`[EMAIL SIMULATION] Password Reset Link for ${user.email}: /auth/reset-password?token=${resetToken}`);

        return successResponse(
            {}, 
            'If an account exists for this email, a password reset link has been sent.',
            200
        );

    } catch (error) {
        console.error('Forgot Password API Error:', error);
        return ApiErrors.internalError('An unexpected error occurred during password recovery initiation.');
    }
}