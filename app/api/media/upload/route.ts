import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiErrors, successResponse } from "@/lib/api-response";
import { auth } from "@/auth";
import { uploadToVPS, deleteFromVPS } from "@/lib/vps-upload";
import { randomUUID } from "crypto";

const MAX_IMAGE_UPLOAD_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

function normalizeExtension(mimeType: string) {
  const raw = mimeType.split("/")[1] || "bin";
  return raw.split("+")[0].toLowerCase();
}

function buildImageKey(params: {
  userId: string;
  artistProfileId: string | null;
  extension: string;
}) {
  const safeExt = params.extension || "bin";
  const profilePart = params.artistProfileId ? params.artistProfileId : "user";
  return `${params.userId}-${profilePart}-${Date.now()}-${randomUUID()}.${safeExt}`;
}

export async function POST(request: NextRequest): Promise<NextResponse<any>> {
  const session = await auth();
  if (!session?.user?.id) return ApiErrors.unauthorized();

  const userId = session.user.id;

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const artistProfileIdRaw = formData.get("artistProfileId");
    const artistProfileId =
      typeof artistProfileIdRaw === "string" && artistProfileIdRaw.trim()
        ? artistProfileIdRaw.trim()
        : null;

    if (!file || !(file instanceof Blob)) {
      return ApiErrors.badRequest("No file uploaded or invalid file.");
    }

    const mimeType = file.type;
    const fileExtension = normalizeExtension(mimeType);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (mimeType.startsWith("image/") && buffer.length > MAX_IMAGE_UPLOAD_SIZE_BYTES) {
      return ApiErrors.badRequest("Image size must be 20MB or smaller.");
    }

    if (mimeType.startsWith("image/")) {
      const key = buildImageKey({ userId, artistProfileId, extension: fileExtension });
      const fileUrl = await uploadToVPS({ buffer, key, mimeType });

      // If an artist profile is provided, attach the image to it now.
      // Otherwise (e.g. creating a brand-new profile that doesn't exist yet),
      // just return the uploaded URL so the caller can persist it on save.
      if (artistProfileId) {
        const existingArtist = await prisma.artist.findFirst({
          where: { id: artistProfileId, userId },
          select: { id: true, profileImage: true },
        });

        if (!existingArtist) return ApiErrors.notFound("Artist profile not found.");

        if (existingArtist.profileImage && existingArtist.profileImage !== fileUrl) {
          await deleteFromVPS(existingArtist.profileImage).catch(() => {});
        }

        await prisma.artist.update({
          where: { id: existingArtist.id },
          data: { profileImage: fileUrl },
        });
      }

      return successResponse(
        { imageUrl: fileUrl },
        "Profile photo uploaded successfully."
      );
    }
    if (!mimeType.startsWith("video/")) {
      return ApiErrors.badRequest("Invalid file type. Upload image or video only.");
    }

    const title = formData.get("title") as string | null;
    const description = formData.get("description") as string | null;
    const duration = formData.get("duration") as string | null;
    if (!title || !duration) {
      return ApiErrors.badRequest("Title and duration are required.");
    }

    const key = `${userId}-${Date.now()}.${fileExtension}`;
    const fileUrl = await uploadToVPS({ buffer, key, mimeType });

    const artistCheck = await prisma.artist.findFirst({
      where: { userId },
      select: { id: true },
    });

    if (!artistCheck) return ApiErrors.forbidden();
    const thumbnailUrl = null;
    const newVideo = await prisma.video.create({
      data: {
        userId,
        title,
        description,
        url: fileUrl,
        thumbnailUrl,
        duration: parseInt(duration, 10),
        isApproved: false,
      },
      select: {
        id: true,
        title: true,
        url: true,
        thumbnailUrl: true,
        isApproved: true,
      },
    });

    return successResponse(
      { video: newVideo },
      "Media uploaded successfully and submitted for review.",
      201
    );

  } catch (err) {
    console.error("POST /api/media/upload Error:", err);
    return ApiErrors.internalError("Unexpected error during media upload.");
  }
}
