import { UserRole } from '@/lib/types/database';
import fs from "fs";
import path from "path";
export interface AuthUserPayload {
    id: string;
    role: UserRole; // Now explicitly using the imported type
    email: string;
    firstName: string | null;
    // Making googleId optional to resolve the type error in the OAuth routes
    googleId?: string | null;
    facebookId?: string | null; // Added for completeness with Facebook OAuth
    // Add other properties necessary for token creation
}

/**
 * Creates a secure JWT (JSON Web Token) for the user's session.
 * In a real environment, this function MUST use a library like `jsonwebtoken` or equivalent
 * to sign the payload with a secret key (`process.env.JWT_SECRET`).
 * * @param user The user payload containing necessary data (id, role, email).
 * @returns A signed JWT string used for authentication.
 */
export function createAuthToken(user: AuthUserPayload): string {
    const tokenPayload = {
        userId: user.id,
        role: user.role,
        // Calculate expiry time (e.g., 7 days from now)
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
    };

    // PRODUCTION IMPLEMENTATION: 
    // return jwt.sign(tokenPayload, process.env.JWT_SECRET, { algorithm: 'HS256' });

    // DEVELOPMENT PLACEHOLDER: Returns a generic token string for API testing
    return `jwt-token-${user.id}-${tokenPayload.exp}`;
}

/**
 * Verifies a JWT token and returns the user's payload.
 * In a real environment, this function MUST use a library like `jsonwebtoken`
 * to verify the signature and ensure the token is not expired.
 * @param token The JWT token string from the Authorization header.
 * @returns The verified user payload or null if verification fails.
 */
export async function getAuthUser(token: string): Promise<AuthUserPayload | null> {
    // PRODUCTION IMPLEMENTATION:
    /*
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET) as Omit<AuthUserPayload, 'firstName'> & { exp: number };
        
        // In a real app, you would fetch the full user object if needed,
        // but for role/id check, the token payload is often enough.
        
        // Mocking user data that would be in a verified payload
        return {
            id: payload.userId,
            role: payload.role as UserRole, // Assume token signing ensures correct role format
            email: 'verified.user@example.com', // Placeholder for email
            firstName: 'Verified',
        } as AuthUserPayload;
    } catch (e) {
        // Handle TokenExpiredError, JsonWebTokenError, etc.
        return null;
    }
    */

    // DEVELOPMENT PLACEHOLDER:
    // For development, we'll assume any token starting with 'jwt-token-' is valid 
    // and we'll extract the user role from the payload (or default to admin for testing)
    if (!token.startsWith('jwt-token-')) {
        return null;
    }

    // A simple mock for testing admin access in the verify route
    // The literal 'admin' is explicitly cast to UserRole to satisfy the interface.
    return {
        id: 'mock-admin-id-123',
        role: 'admin' as UserRole, // Explicitly cast the literal string to the UserRole type
        email: 'admin.tester@example.com',
        firstName: 'MockAdmin',
    };
}

interface FileUploadResult {
    url: string; // The URL of the main media file (e.g., video)
    thumbnailUrl: string; // The URL of the automatically generated thumbnail
}

interface FileUploadResult {
  url: string;
  thumbnailUrl: string;
}

export function simulateFileUpload(
  userId: string,
  fileBuffer: ArrayBuffer,
  fileExtension: string
): FileUploadResult {
  const buffer = Buffer.from(fileBuffer);

  const uniqueId = Math.random().toString(36).substring(2, 9);
  const fileName = `${userId}-${uniqueId}.${fileExtension}`;

  const isImage = ["jpg", "jpeg", "png", "webp", "gif"].includes(
    fileExtension.toLowerCase()
  );

  const uploadFolder = isImage ? "images" : "videos";

  const savePath = path.join(
    process.cwd(),
    "public",
    "uploads",
    uploadFolder,
    fileName
  );

  const dirPath = path.dirname(savePath);
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

  fs.writeFileSync(savePath, buffer);

  const fileUrl = `/uploads/${uploadFolder}/${fileName}`;

  let thumbnailUrl = "";

  if (isImage) {
    thumbnailUrl = fileUrl;
  } else {
    const thumbName = `${userId}-${uniqueId}-thumb.jpg`;
    const thumbPath = path.join(
      process.cwd(),
      "public",
      "uploads",
      "thumbnails",
      thumbName
    );

    const thumbDir = path.dirname(thumbPath);
    if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true });

    fs.writeFileSync(thumbPath, Buffer.from([]));

    thumbnailUrl = `/uploads/thumbnails/${thumbName}`;
  }

  console.log(`[LOCAL UPLOAD] Saved: ${fileUrl}`);

  return {
    url: fileUrl,
    thumbnailUrl,
  };
}