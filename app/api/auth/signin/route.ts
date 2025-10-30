/**
 * app/api/auth/signin/route.ts
 *
 * Handles user login for both 'customer' and 'artist' roles.
 * Validates email, compares password hash, and returns user data on success.
 *
 * Priority 3: POST /api/auth/signin
 */

import { NextRequest, NextResponse } from 'next/server'; // FIX: Added NextResponse for the function signature
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/password'; 
import { ApiErrors, successResponse, ApiResponse } from '@/lib/api-response';

/**
 * Utility function to strip sensitive data (like the password) from the user object.
 * @param user The user object from Prisma (with password)
 * @returns A safe user object
 */
const selectSafeUser = (user: any) => {
    const { password, ...safeUser } = user;
    return safeUser;
};

/**
 * Handles POST requests for user sign-in.
 * FIX: Function signature changed to the clean, type-safe Promise<NextResponse<any>>
 */
export async function POST(request: NextRequest): Promise<NextResponse<any>> {
    let body;
    try {
        body = await request.json();
    } catch (e) {
        return ApiErrors.badRequest('Invalid JSON body.');
    }

    const { email, password } = body;

    // 1. Basic Input Validation
    if (!email || !password) {
        return ApiErrors.badRequest('Email and password are required for login.');
    }

    try {
        const lowerCaseEmail = email.toLowerCase();
        
        // 2. Find User
        const user = await prisma.user.findUnique({
            where: { email: lowerCaseEmail },
            // Ensure we fetch the password for comparison
            select: {
                id: true,
                email: true,
                role: true,
                password: true, // Necessary for comparison
                firstName: true,
                lastName: true,
                isAccountVerified: true,
            }
        });

        // 3. User Not Found
        if (!user) {
            // Use a generic error message for security (don't reveal if email exists)
            return ApiErrors.unauthorized(); 
        }
        
        // 4. Check if user has a password set (i.e., didn't sign up via OAuth)
        if (!user.password) {
            // If a user exists but has no password, they must use OAuth or request a reset link.
            return ApiErrors.unauthorized(); 
        }
        
        // 5. Verify Password
        // Note: TypeScript/runtime is now safe because we checked for user.password existence above.
        const isPasswordValid = await verifyPassword(password, user.password);

        if (!isPasswordValid) {
            // Use a generic error message for security
            return ApiErrors.unauthorized(); 
        }

        // 6. Successful Login
        const safeUser = selectSafeUser(user);
        
        // NOTE ON NEXTAUTH: 
        // In a full NextAuth implementation, this route would be used by the 
        // Credentials Provider, which handles session creation. For now, 
        // we return the user data and a simulated session message.

        return successResponse(
            { 
                user: safeUser,
                // Placeholder for what would be session data
                session: {
                    userId: safeUser.id,
                    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
                }
            },
            `Login successful. Welcome back, ${safeUser.firstName || safeUser.email}!`,
        );

    } catch (error) {
        console.error('Sign-in API Error:', error);
        return ApiErrors.internalError('An unexpected error occurred during login.');
    }
}
