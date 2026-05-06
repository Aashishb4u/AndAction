import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ApiErrors, successResponse } from '@/lib/api-response';

/**
 * API endpoint to sync avatar updates from admin panel to website
 * This ensures that when admin updates profile photo, it reflects on website
 */
export async function POST(request: NextRequest): Promise<NextResponse<any>> {
    try {
        // Verify sync secret for security
        const syncSecret = request.headers.get('x-sync-secret');
        const expectedSecret = process.env.WEBSITE_SYNC_SECRET;
        
        if (!expectedSecret || syncSecret !== expectedSecret) {
            return ApiErrors.unauthorized('Invalid sync secret');
        }

        const body = await request.json();
        const { email, phoneNumber, avatarUrl } = body;

        if (!avatarUrl || typeof avatarUrl !== 'string') {
            return ApiErrors.badRequest('avatarUrl is required');
        }

        if ((!email || typeof email !== 'string') && (!phoneNumber || typeof phoneNumber !== 'string')) {
            return ApiErrors.badRequest('Either email or phoneNumber is required');
        }

        // Find user by email or phone number
        let whereClause: any = {};
        
        if (email && typeof email === 'string') {
            whereClause.email = email.trim();
        } else if (phoneNumber && typeof phoneNumber === 'string') {
            whereClause.phoneNumber = phoneNumber.trim();
        }

        const user = await prisma.user.findFirst({
            where: whereClause
        });

        if (!user) {
            return ApiErrors.notFound('User not found');
        }

        // Update user's avatar
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { 
                avatar: avatarUrl.trim(),
                updatedAt: new Date()
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatar: true,
                phoneNumber: true
            }
        });

        console.log(`✅ Avatar synced from admin panel for user: ${updatedUser.email || updatedUser.phoneNumber}`);

        return successResponse(
            { user: updatedUser },
            'Avatar synced successfully from admin panel'
        );

    } catch (error: any) {
        console.error('POST Admin Sync Avatar API Error:', error);
        return ApiErrors.internalError('Failed to sync avatar from admin panel');
    }
}
