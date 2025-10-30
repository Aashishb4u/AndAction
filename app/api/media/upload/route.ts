/**
 * app/api/media/upload/route.ts
 *
 * Handles:
 * 1. POST /api/media/upload: Uploads video or image content using multipart/form-data.
 * This route is protected and only accessible to authenticated users (artists).
 *
 * NOTE: Due to the nature of Next.js route handlers and file streaming, 
 * this implementation uses a standard approach for handling multipart data 
 * but simulates the actual file system/cloud storage saving.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ApiErrors, successResponse } from '@/lib/api-response';
import { auth } from '@/auth';
import { simulateFileUpload } from '@/lib/utils'; // Placeholder utility

// Define the maximum size for the request body (e.g., 100MB for video)
// In a production environment, this is often handled by a library or server config.
export const config = {
    api: {
        bodyParser: false, // Must disable default body parser for file uploads
    },
};

/**
 * Handles POST request for media upload.
 */
export async function POST(request: NextRequest): Promise<NextResponse<any>> {
    // 1. Session Validation
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return ApiErrors.unauthorized();
    }
    const userId = session.user.id;

    // Check if the user is an Artist (only Artists should upload content)
    // NOTE: This assumes the session payload includes the 'role' or we fetch it.
    // For a production check, you'd fetch the user role from the database if not in session.
    // We'll rely on the Prisma check below to ensure the user is linked to an Artist profile.

    try {
        // 2. Parse FormData
        const formData = await request.formData();
        
        // Extract the file and video details
        const file = formData.get('file');
        const title = formData.get('title') as string | null;
        const description = formData.get('description') as string | null;
        const duration = formData.get('duration') as string | null; // Expected in seconds (string)
        const isShort = formData.get('isShort') === 'true'; // Boolean field
        
        if (!file || !(file instanceof Blob)) {
            return ApiErrors.badRequest('No file uploaded or file is invalid.');
        }
        if (!title || !duration) {
            return ApiErrors.badRequest('Title and duration are required.');
        }

        // 3. Simulate Cloud Storage Upload
        // In production, this would be a real call to S3/GCS.
        const fileExtension = file.type.split('/')[1] || 'mp4';
        const fileBuffer = await file.arrayBuffer();
        const { url: fileUrl, thumbnailUrl } = simulateFileUpload(
            userId, 
            fileBuffer, 
            fileExtension
        );

        // 4. Save Metadata to Database (Requires the user to be an Artist or have an 'artist' role)
        
        // Check if the user is linked to an artist profile
        const artistCheck = await prisma.artist.findUnique({
            where: { userId: userId },
        });

        if (!artistCheck) {
            return ApiErrors.forbidden();
        }

        const newVideo = await prisma.video.create({
            data: {
                userId: userId,
                title: title,
                description: description,
                url: fileUrl,
                thumbnailUrl: thumbnailUrl,
                duration: parseInt(duration, 10),
                // isApproved is false by default, requiring admin approval before public listing
                isApproved: false, 
            },
            select: { id: true, title: true, url: true, thumbnailUrl: true, isApproved: true },
        });

        // 5. Success Response
        return successResponse(
            { video: newVideo },
            'Media uploaded successfully and submitted for review.',
            201
        );

    } catch (error) {
        console.error('POST /api/media/upload API Error:', error);
        return ApiErrors.internalError('An unexpected error occurred during media upload.');
    }
}
