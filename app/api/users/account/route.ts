/**
 * app/api/users/account/route.ts
 *
 * Handles the permanent deletion of the authenticated user's account.
 * This is a highly sensitive, protected API that requires the user to be logged in.
 *
 * Priority 11: DELETE /api/users/account
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ApiErrors, successResponse } from '@/lib/api-response';
import { auth } from '@/auth';

/**
 * Handles DELETE requests to permanently remove the authenticated user's account.
 * NOTE: Due to Prisma schema's onDelete: Cascade rules, deleting the User record
 * will automatically delete the associated Artist profile, Bookings made by the user, etc.
 */
export async function DELETE(request: NextRequest): Promise<NextResponse<any>> {
    try {
        // --- 1. Authentication ---
        const session = await auth();

        if (!session || !session.user || !session.user.id) {
            return ApiErrors.unauthorized();
        }

        const userId = session.user.id;

        // --- 2. Optional: Confirmation Step (Best Practice) ---
        // In a real application, the client should submit a confirmation (e.g., their password)
        // in the request body to prevent accidental or malicious deletion.
        
        // For now, we proceed with deletion based on a valid session.
        
        // --- 3. Account Deletion Transaction ---
        
        // Fetch the user's email before deletion for the response message
        const userToDelete = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true }
        });
        
        if (!userToDelete) {
             // Should not happen with a valid session, but a safety check
             return ApiErrors.notFound('Account not found.');
        }

        // The core deletion action
        await prisma.user.delete({
            where: { id: userId },
        });

        // --- 4. Return Success ---
        // Note: The session is now invalid for the client, and they should be logged out.
        return successResponse(
            null, // No data returned for a DELETE operation
            `Account successfully deleted for user: ${userToDelete.email}. All associated data has been removed.`,
            200 // Success
        );

    } catch (error) {
        // Log the error for debugging
        console.error('DELETE User Account API Error:', error);
        
        // Handle common database errors gracefully
        if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
            return ApiErrors.notFound('The specified account does not exist.');
        }
        
        return ApiErrors.internalError('An unexpected error occurred during account deletion.');
    }
}
