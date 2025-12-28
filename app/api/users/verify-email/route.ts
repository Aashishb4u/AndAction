/**
 * app/api/users/verify-email/route.ts
 *
 * Handles the email verification flow:
 * 1. POST (Initiate/Resend): Generates and sends a new verification link.
 * 2. POST (Complete): Validates the token and marks the user account as verified.
 *
 * Priority 5: POST /api/users/verify-email
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ApiErrors, successResponse } from '@/lib/api-response';
import { createVerificationTokenPair, verifyToken } from '@/lib/token-utils'; // Use our new utilities

// --- Shared Logic ---

/**
 * Handles the token generation, database update, and email simulation.
 * @param user The user object to update.
 */
async function initiateVerification(user: { id: string, email: string }): Promise<void> {
    const { cleartextToken, hashedToken, expiresAt } = await createVerificationTokenPair();

    // Store the hashed token and expiry in the database
    await prisma.user.update({
        where: { id: user.id },
        data: {
            verificationToken: hashedToken,
            verificationTokenExpiry: expiresAt,
        }
    });

    // NOTE: In a production environment, this would call an email service (e.g., SendGrid/Resend)
    // with the cleartextToken to send the link.
    const verificationLink = `/auth/verify-account?token=${cleartextToken}`;
    
    console.log(`[EMAIL SIMULATION] Verification Link for ${user.email}: ${verificationLink}`);
    // Simulate email sending delay or logging
}

// --- Route Handler ---

export async function POST(request: NextRequest): Promise<NextResponse<any>> {
    let body;
    try {
        body = await request.json();
    } catch (e) {
        return ApiErrors.badRequest('Invalid JSON body.');
    }

    const { email, token } = body;

    try {
        // ---------------------------------------------------------------------
        // SCENARIO 1: COMPLETE VERIFICATION (User clicks link, frontend submits token)
        // ---------------------------------------------------------------------
        if (token) {
            if (typeof token !== 'string') {
                 return ApiErrors.badRequest('Invalid token format.');
            }

            const now = new Date();

            // 1. Find User by HASHED token and check for expiry
            // We search by the HASHED token stored in the database.
            // The comparison against the cleartext token happens in step 3.
            const userWithToken = await prisma.user.findFirst({
                where: {
                    // Check if *any* user has an unexpired verification token
                    verificationTokenExpiry: { gt: now }, 
                },
                // Fetch the hashed token for comparison
                select: {
                    id: true,
                    isAccountVerified: true,
                    verificationToken: true,
                }
            });

            // 2. Handle Invalid, Expired, or Already Verified
            if (!userWithToken || !userWithToken.verificationToken) {
                // Return generic error for security
                return ApiErrors.unauthorized(); 
            }
            
            if (userWithToken.isAccountVerified) {
                // If token is technically valid but the account is already verified,
                // we treat it as successful completion.
                return successResponse({}, 'Account is already verified.', 200);
            }

            // 3. Verify the Cleartext Token against the Stored Hash
            const isTokenValid = await verifyToken(token, userWithToken.verificationToken);

            if (!isTokenValid) {
                // The hash check failed
                return ApiErrors.unauthorized();
            }

            // 4. Success: Mark Verified and Invalidate Token (CRUCIAL SECURITY STEP)
            await prisma.user.update({
                where: { id: userWithToken.id },
                data: {
                    isAccountVerified: true,
                    verificationToken: null,
                    verificationTokenExpiry: null, // Clear the token fields
                }
            });
            
            return successResponse({}, 'Account successfully verified!', 200);
        }

        // ---------------------------------------------------------------------
        // SCENARIO 2: INITIATE/RESEND VERIFICATION (User submits email)
        // ---------------------------------------------------------------------
        else if (email) {
            if (typeof email !== 'string') {
                return ApiErrors.badRequest('Invalid email format.');
            }
            
            const lowerCaseEmail = email.toLowerCase();
            
            const user = await prisma.user.findUnique({
                where: { email: lowerCaseEmail },
                select: { id: true, email: true, isAccountVerified: true }
            });

            // 1. Security Check: Don't reveal if email exists
            if (!user) {
                return successResponse(
                    {}, 
                    'If an account exists for this email, a verification link has been sent.',
                    200
                );
            }

            // 2. Check if already verified
            if (user.isAccountVerified) {
                 return successResponse(
                    {}, 
                    'This account is already verified.',
                    200
                );
            }

            // 3. Initiate the flow
            await initiateVerification(user);

            return successResponse(
                {}, 
                'Verification link sent. Please check your inbox.',
                200
            );
        }
        
        // ---------------------------------------------------------------------
        // SCENARIO 3: MISSING INPUT
        // ---------------------------------------------------------------------
        else {
            return ApiErrors.badRequest('Missing input: provide an email to resend link, or a token to verify.');
        }

    } catch (error) {
        console.error('Email Verification API Error:', error);
        return ApiErrors.internalError('An unexpected error occurred during email verification.');
    }
}
