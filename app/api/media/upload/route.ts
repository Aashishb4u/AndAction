import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiErrors, successResponse } from "@/lib/api-response";
import { auth } from "@/auth";
import { uploadToS3 } from "@/lib/s3";

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request: NextRequest): Promise<NextResponse<any>> {
  const session = await auth();
  if (!session?.user?.id) return ApiErrors.unauthorized();

  const userId = session.user.id;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return ApiErrors.badRequest("No file uploaded or invalid file.");
    }

    const mimeType = file.type;
    const fileExtension = mimeType.split("/")[1] || "bin";

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const key = `${userId}/${Date.now()}.${fileExtension}`;
    const fileUrl = await uploadToS3({buffer, key, mimeType});
    if (mimeType.startsWith("image/")) {
      await prisma.user.update({
        where: { id: userId },
        data: { avatar: fileUrl },
      });

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

    const artistCheck = await prisma.artist.findUnique({
      where: { userId },
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
