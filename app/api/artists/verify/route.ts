/**
 * app/api/artists/verify/route.ts
 *
 * Handles the administrative action of verifying an artist's profile.
 * Only users with the 'admin' role can execute this action.
 *
 * Priority: POST /api/artists/verify
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ApiErrors, successResponse } from '@/lib/api-response';
import { getAuthUser, AuthUserPayload } from '@/lib/utils'; // Import UserRole from utils for type safety
import { UserRole } from '@/lib/types/database';

interface VerificationRequestBody {
    userId: string; // The ID of the User to be marked as a verified Artist
}

/**
 * Utility function to enforce that the requester is an 'admin'.
 * It attempts to verify the JWT token in the Authorization header.
 * @param request The incoming NextRequest object.
 * @returns The authenticated admin user's payload.
 * @throws Error with message 'UNAUTHORIZED' or 'FORBIDDEN'.
 */
async function requireAdminAuth(request: NextRequest): Promise<AuthUserPayload> {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
        // Token is missing
        throw new Error('UNAUTHORIZED');
    }
    
    // Assumed call to lib/utils function that verifies the token, checks expiration, and returns the payload.
    const user = await getAuthUser(token); 

    if (!user) {
        // Token is invalid or expired
        throw new Error('UNAUTHORIZED');
    }
    
    // --- FIX: Explicitly cast the literal 'admin' to UserRole to resolve type overlap error ---
    if (user.role !== ('admin' as UserRole)) {
        // User is authenticated but lacks the required role
        throw new Error('FORBIDDEN');
    }
    
    return user;
}


export async function POST(request: NextRequest): Promise<NextResponse<any>> {
    try {
        // --- 1. Authorization Check (Admin Only) ---
        try {
            // Check if the requesting user is an admin. If not, this throws an error.
            await requireAdminAuth(request);
        } catch (authError) {
            // Catch the specific error types thrown by requireAdminAuth
            const errorMsg = (authError as Error).message;
            if (errorMsg === 'UNAUTHORIZED') {
                return ApiErrors.unauthorized();
            }
            if (errorMsg === 'FORBIDDEN') {
                return ApiErrors.forbidden();
            }
            // Re-throw if it's an unexpected internal error during auth
            throw new Error('Internal authentication error.');
        }


        // --- 2. Input Validation ---
        const body: VerificationRequestBody = await request.json();
        const { userId } = body;

        if (!userId) {
            return ApiErrors.badRequest('Target userId is required for verification.');
        }

        // --- 3. Check Target User Status ---
        const targetUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, role: true, isArtistVerified: true, email: true }
        });

        if (!targetUser) {
            return ApiErrors.notFound(`User with ID ${userId} not found.`);
        }
        
        if (targetUser.role !== 'artist') {
            return ApiErrors.badRequest(`User ${userId} is a '${targetUser.role}', not an 'artist'.`);
        }

        if (targetUser.isArtistVerified) {
            return ApiErrors.conflict(`Artist ${userId} is already verified.`);
        }

        // --- 4. Perform Verification Update ---
        await prisma.user.update({
            where: { id: userId },
            data: { 
                isArtistVerified: true,
            }
        });

        // --- 5. Success Response ---
        return successResponse(
            { userId: userId, isArtistVerified: true },
            `Successfully verified artist profile for user ${userId}.`,
            200
        );

    } catch (error) {
        console.error('POST /api/artists/verify API Error:', error);
        return ApiErrors.internalError('An unexpected error occurred during artist verification.');
    }
}
