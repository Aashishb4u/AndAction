import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiErrors, successResponse } from "@/lib/api-response";
import { auth } from "@/auth";
import { simulateFileUpload } from "@/lib/utils";

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request: NextRequest): Promise<NextResponse<any>> {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return ApiErrors.unauthorized();
  }

  const userId = session.user.id;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return ApiErrors.badRequest("No file uploaded or invalid file.");
    }

    const mimeType = file.type; // e.g. image/jpeg or video/mp4
    const fileExtension = mimeType.split("/")[1] || "bin";

    const arrayBuffer = await file.arrayBuffer();
    if (mimeType.startsWith("image/")) {
      const { url: imageUrl } = simulateFileUpload(
        userId,
        arrayBuffer,
        fileExtension
      );

      await prisma.user.update({
        where: { id: userId },
        data: { avatar: imageUrl },
      });

      return successResponse(
        { imageUrl },
        "Profile photo uploaded successfully.",
        200
      );
    }
    if (!mimeType.startsWith("video/")) {
      return ApiErrors.badRequest("Invalid file type. Upload image or video only.");
    }

    const title = formData.get("title") as string | null;
    const description = formData.get("description") as string | null;
    const duration = formData.get("duration") as string | null;
    const isShort = formData.get("isShort") === "true";

    if (!title || !duration) {
      return ApiErrors.badRequest("Title and duration are required.");
    }

    const artistCheck = await prisma.artist.findUnique({
      where: { userId },
    });

    if (!artistCheck) return ApiErrors.forbidden();

    const { url: fileUrl, thumbnailUrl } = simulateFileUpload(
      userId,
      arrayBuffer,
      fileExtension
    );

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
