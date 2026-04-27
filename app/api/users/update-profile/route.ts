/**
 * app/api/users/update-profile/route.ts
 *
 * Dedicated endpoint for user profile updates from the profile page.
 * Handles phone number unique constraint properly.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ApiErrors, successResponse } from '@/lib/api-response';
import { auth } from '@/auth'; 

async function syncAvatarToAdminPanel(params: {
    email?: string | null;
    phoneNumber?: string | null;
    avatarUrl: string;
}) {
    const adminBase =
        (process.env.ADMIN_API_BASE_URL ||
            process.env.NEXT_PUBLIC_ADMIN_BASE_URL ||
            "https://admin.andaction.in")
            .trim()
            .replace(/\/+$/, "");

    const secret = (
        process.env.VPS_UPLOAD_SECRET ||
        process.env.PUBLIC_UPLOAD_SECRET ||
        ""
    ).trim();

    if (!secret) return;

    const email = typeof params.email === "string" ? params.email.trim() : "";
    const phoneNumber =
        typeof params.phoneNumber === "string" ? params.phoneNumber.trim() : "";
    const avatarUrl = params.avatarUrl?.trim();
    if (!avatarUrl) return;
    if (!email && !phoneNumber) return;

    await fetch(`${adminBase}/api/media/sync-avatar`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-upload-secret": secret,
        },
        body: JSON.stringify({
            email: email || null,
            phoneNumber: phoneNumber || null,
            avatarUrl,
        }),
    }).catch(() => { });
}

/**
 * Handles PUT requests to update the authenticated user's profile information.
 * Special handling for phoneNumber to avoid unique constraint conflicts.
 */
export async function PUT(request: NextRequest): Promise<NextResponse<any>> {
    try {
        // 1. Session Validation and User ID Retrieval
        const session = await auth();

        if (!session || !session.user || !session.user.id) {
            return ApiErrors.unauthorized();
        }

        const userId = session.user.id;
        
        // 2. Parse Body
        const body = await request.json();
        
        // 3. Build update data with proper handling
        const updateData: { [key: string]: any } = {};

        // Handle firstName
        if (body.firstName !== undefined && body.firstName.trim() !== '') {
            updateData.firstName = body.firstName.trim();
        }

        // Handle lastName
        if (body.lastName !== undefined && body.lastName.trim() !== '') {
            updateData.lastName = body.lastName.trim();
        }

        // Handle phoneNumber - only update if it has a valid value
        if (body.phoneNumber !== undefined && body.phoneNumber !== null) {
            const phoneValue = typeof body.phoneNumber === 'string' ? body.phoneNumber.trim() : body.phoneNumber;
            if (phoneValue && phoneValue !== '') {
                // Check if this phone number is already used by another user
                const existingUser = await prisma.user.findFirst({
                    where: {
                        phoneNumber: phoneValue,
                        NOT: { id: userId }
                    }
                });

                if (existingUser) {
                    return ApiErrors.badRequest('This phone number is already in use by another account.');
                }

                updateData.phoneNumber = phoneValue;
            }
            // If phoneNumber is empty/null, don't include it in the update
        }

        // Handle countryCode
        if (body.countryCode !== undefined) {
            updateData.countryCode = body.countryCode;
        }

        // Handle state
        if (body.state !== undefined && body.state.trim() !== '') {
            updateData.state = body.state.trim();
        }

        // Handle city
        if (body.city !== undefined && body.city.trim() !== '') {
            updateData.city = body.city.trim();
        }

        // Handle avatar
        if (body.avatar !== undefined) {
            updateData.avatar = body.avatar;
        }

        // Handle address
        if (body.address !== undefined) {
            updateData.address = body.address;
        }

        // Handle zip
        if (body.zip !== undefined) {
            updateData.zip = body.zip;
        }

        // Handle gender
        if (body.gender !== undefined) {
            updateData.gender = body.gender;
        }

        // Handle dob
        if (body.dob !== undefined) {
            updateData.dob = body.dob;
        }
        
        // 4. Validation Check
        if (Object.keys(updateData).length === 0) {
            return ApiErrors.badRequest('No valid fields provided for update.');
        }

        // 5. Update the User Record
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                avatar: true,
                isAccountVerified: true,
                phoneNumber: true,
                countryCode: true,
                city: true,
                state: true,
                address: true,
                zip: true,
                gender: true,
                dob: true,
            }
        });

        // 6. Success Response
        if (updateData.avatar !== undefined) {
            const avatarValue =
                typeof updateData.avatar === 'string' ? updateData.avatar.trim() : '';
            if (avatarValue) {
                await syncAvatarToAdminPanel({
                    email: updatedUser.email,
                    phoneNumber: updatedUser.phoneNumber,
                    avatarUrl: avatarValue,
                });
            }
        }
        return successResponse(
            updatedUser,
            'User profile updated successfully.',
        );

    } catch (error: any) {
        console.error('PUT Update Profile API Error:', error);
        
        // Handle Prisma unique constraint errors
        if (error.code === 'P2002') {
            return ApiErrors.badRequest('This phone number is already in use by another account.');
        }
        
        return ApiErrors.internalError('An unexpected error occurred while updating the profile.');
    }
}
