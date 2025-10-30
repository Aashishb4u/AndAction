/**
 * app/api/auth/reset-password/route.ts
 *
 * Handles the final step of the password reset process.
 * Validates the token, hashes the new password, and updates the user record.
 *
 * Priority 5: POST /api/auth/reset-password
 */

import { NextRequest, NextResponse } from 'next/server'; // Added NextResponse for type use
import { prisma } from '@/lib/prisma';
import { ApiErrors, successResponse, ApiResponse } from '@/lib/api-response';
import { hashPassword, validatePasswordStrength } from '@/lib/password';


// FIX: Function signature changed to clean, type-safe Promise<NextResponse<any>>
export async function POST(request: NextRequest): Promise<NextResponse<any>> {
    let body;
    try {
        body = await request.json();
    } catch (e) {
        return ApiErrors.badRequest('Invalid JSON body.');
    }

    const { token, newPassword } = body;

    // 1. Input Validation
    if (!token || !newPassword) {
        return ApiErrors.badRequest('Token and newPassword are required for password reset.');
    }

    // 2. Password Strength Check
    const validationResult = validatePasswordStrength(newPassword);
    if (!validationResult.isValid) {
        return ApiErrors.validationError({ newPassword: validationResult.message });
    }

    try {
        const now = new Date();

        // 3. Find User by Token and Check Expiry
        // FIX: Removed 'as any' cast. The `where` clause structure is standard Prisma.
        const user = await prisma.user.findFirst({
            where: {
                resetToken: token,
                resetTokenExpiry: {
                    gt: now, // Greater than (i.e., not expired)
                },
            },
        });

        // 4. Handle Invalid or Expired Token
        if (!user) {
            // Returns a generic error message for security.
            return ApiErrors.unauthorized();
        }

        // 5. Hash New Password
        const hashedPassword = await hashPassword(newPassword);

        // 6. Update Password and Clear Token Fields
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null,
            }
            // FIX: Removed the unsafe 'as any' cast.
        });

        // 7. Success Response
        return successResponse(
            {}, 
            'Your password has been successfully reset. You can now log in.',
            200
        );

    } catch (error) {
        console.error('Password Reset API Error:', error);
        return ApiErrors.internalError('An unexpected error occurred during password reset.');
    }
}
