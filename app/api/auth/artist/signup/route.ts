/**
 * app/api/auth/artist/signup/route.ts
 *
 * Handles the registration of a new artist user (role: 'artist').
 * Uses a nested Prisma write to atomically create the User record AND the related Artist profile.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Assumed to be correctly configured singleton
import { hashPassword, validatePasswordStrength } from '@/lib/password'; // Assumed to contain bcrypt logic
import { ApiErrors, successResponse } from '@/lib/api-response'; // Assumed to contain response helpers
import { UserRole } from '@/lib/types/database'; // Assumed to contain 'user' | 'artist' | 'admin' type

export async function POST(request: NextRequest): Promise<NextResponse<any>> {
    let body;
    try {
        body = await request.json();
    } catch (e) {
        return ApiErrors.badRequest('Invalid JSON body.');
    }

    const { email, password, firstName, lastName } = body;

    if (!email || !password || !firstName || !lastName) {
        return ApiErrors.badRequest('Email, password, first name, and last name are required for artist registration.');
    }

    const strengthCheck = validatePasswordStrength(password);
    if (!strengthCheck.isValid) {
        return ApiErrors.badRequest(strengthCheck.message || 'Password strength requirements not met.');
    }

    try {
        const lowerCaseEmail = email.toLowerCase();
        
        const existingUser = await prisma.user.findUnique({
            where: { email: lowerCaseEmail },
        });

        if (existingUser) {
            return ApiErrors.conflict('A user with this email already exists.');
        }
        
        const hashedPassword = await hashPassword(password);

        // --- 4. Atomic Creation (User + Artist Profile) ---
        // Use a nested write to ensure the User and the associated Artist profile 
        // are created together as a single database transaction.
        const newArtistUser = await prisma.user.create({
            data: {
                email: lowerCaseEmail,
                password: hashedPassword,
                firstName,
                lastName,
                role: 'artist' as UserRole, // Set role to 'artist'
                isAccountVerified: false,
                isArtistVerified: false,
                // Nested write: Creates the related Artist record, linking userId automatically
                artist: {
                    create: {} 
                }
            },
            // Select only safe fields for the response
            select: {
                id: true,
                email: true,
                role: true,
                firstName: true,
                artist: {
                    select: {
                        id: true, // Return the newly created Artist profile ID
                    }
                }
            }
        });

        // --- 5. Success Response ---
        return successResponse(
            { 
                user: {
                    id: newArtistUser.id,
                    email: newArtistUser.email,
                    role: newArtistUser.role,
                    firstName: newArtistUser.firstName,
                },
                artistProfileId: newArtistUser.artist?.id // Provides the ID needed for subsequent profile setup steps
            },
            'Artist account created successfully. Please proceed to profile setup.',
            201
        );

    } catch (error) {
        console.error('Artist Sign-up API Error:', error);
        // Catch any unexpected Prisma or system errors
        return ApiErrors.internalError('An unexpected error occurred during artist registration.');
    }
}
