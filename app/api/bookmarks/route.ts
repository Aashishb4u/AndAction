/**
 * app/api/bookmarks/route.ts
 *
 * Handles the creation of a new bookmark.
 * A bookmark must reference EITHER a video ID OR an artist ID.
 *
 * Priority: POST /api/bookmarks
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ApiErrors, successResponse } from '@/lib/api-response';
import { auth } from '@/auth'; // For session authentication

export async function POST(request: NextRequest): Promise<NextResponse<any>> {
    // 1. Session Validation
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return ApiErrors.unauthorized();
    }
    const userId = session.user.id;

    let body;
    try {
        body = await request.json();
    } catch (e) {
        return ApiErrors.badRequest('Invalid JSON body.');
    }

    const { videoId, artistId } = body;

    // --- 2. Input Validation ---
    
    // Must provide exactly one ID
    if (!videoId && !artistId) {
        return ApiErrors.badRequest('Must provide either a videoId or an artistId to bookmark.');
    }
    if (videoId && artistId) {
        return ApiErrors.badRequest('Cannot bookmark both a video and an artist in a single request.');
    }

    try {
        let referenceId: string;
        let referenceType: 'Video' | 'Artist';
        let checkExistPromise: Promise<any>;

        // Determine type and check existence of the referenced entity (Video or Artist)
        if (videoId) {
            referenceId = videoId;
            referenceType = 'Video';
            // Check if video exists and is approved
            checkExistPromise = prisma.video.findUnique({
                where: { id: videoId, isApproved: true },
                select: { id: true }
            });
        } else { // artistId must be present
            referenceId = artistId;
            referenceType = 'Artist';
            // Check if artist exists
            checkExistPromise = prisma.artist.findUnique({
                where: { id: artistId },
                select: { id: true }
            });
        }
        
        const entityExists = await checkExistPromise;
        if (!entityExists) {
            return ApiErrors.notFound(`${referenceType} with ID ${referenceId} not found or is not available.`);
        }

        // --- 3. Check for Duplicate Bookmark ---
        // The unique constraints in the schema will catch this, but checking explicitly
        // allows us to return a clearer "Conflict" response instead of a generic "Internal Error".
        const existingBookmark = await prisma.bookmark.findFirst({
            where: {
                userId,
                // Only one of these will be non-null
                videoId: videoId || undefined, 
                artistId: artistId || undefined,
            },
            select: { id: true }
        });

        if (existingBookmark) {
            return ApiErrors.conflict(`${referenceType} is already bookmarked by this user.`);
        }

        // --- 4. Create the Bookmark ---
        const newBookmark = await prisma.bookmark.create({
            data: {
                userId,
                videoId: videoId || null,
                artistId: artistId || null,
            },
            select: {
                id: true,
                videoId: true,
                artistId: true,
                createdAt: true,
            }
        });

        // --- 5. Success Response ---
        return successResponse(
            { bookmark: newBookmark },
            `${referenceType} successfully bookmarked.`,
            201
        );

    } catch (error) {
        console.error('POST /api/bookmarks API Error:', error);
        // Catch any unexpected database or system errors
        return ApiErrors.internalError('An unexpected error occurred while creating the bookmark.');
    }
}
