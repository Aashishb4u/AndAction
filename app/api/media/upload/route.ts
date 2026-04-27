import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiErrors, successResponse } from "@/lib/api-response";
import { auth } from "@/auth";
import { uploadToVPS, deleteFromVPS } from "@/lib/vps-upload";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

function normalizeExtension(mimeType: string) {
  const raw = mimeType.split("/")[1] || "bin";
  return raw.split("+")[0].toLowerCase();
}

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

  const vpsSecret = (process.env.VPS_UPLOAD_SECRET || "").trim();
  const publicSecret = (process.env.PUBLIC_UPLOAD_SECRET || "").trim();
  const secrets = Array.from(
    new Set([vpsSecret, publicSecret].filter((s) => typeof s === "string" && s)),
  );
  if (secrets.length === 0) return;

  const email = typeof params.email === "string" ? params.email.trim() : "";
  const phoneNumber =
    typeof params.phoneNumber === "string" ? params.phoneNumber.trim() : "";
  const avatarUrl = params.avatarUrl?.trim();
  if (!avatarUrl) return;
  if (!email && !phoneNumber) return;

  for (const secret of secrets) {
    try {
      const res = await fetch(`${adminBase}/api/media/sync-avatar`, {
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
      });
      if (res.ok) return;
    } catch {
    }
  }
}

async function saveImageLocally(
  userId: string,
  buffer: Buffer,
  extension: string
) {
  const safeExt = ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(extension)
    ? extension
    : "jpg";
  const fileName = `${userId}-${Date.now()}.${safeExt}`;
  const relativeDir = path.join("uploads", "images");
  const absoluteDir = path.join(process.cwd(), "public", relativeDir);
  await mkdir(absoluteDir, { recursive: true });
  await writeFile(path.join(absoluteDir, fileName), buffer);
  return `/${relativeDir.replace(/\\/g, "/")}/${fileName}`;
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

    if (mimeType.startsWith("image/")) {
      let fileUrl = "";
      try {
        const key = `${userId}/${Date.now()}.${fileExtension}`;
        fileUrl = await uploadToVPS({ buffer, key, mimeType });
      } catch (uploadErr) {
        console.error("VPS image upload failed, using local fallback:", uploadErr);
        fileUrl = await saveImageLocally(userId, buffer, fileExtension);
      }

      // Delete old profile photo from VPS to avoid orphaned files
      if (artistProfileId) {
        const existingArtist = await prisma.artist.findFirst({
          where: { id: artistProfileId, userId },
          select: { id: true, profileImage: true },
        });
        if (!existingArtist) return ApiErrors.notFound("Artist profile not found.");
        if (existingArtist.profileImage && existingArtist.profileImage !== fileUrl) {
          await deleteFromVPS(existingArtist.profileImage).catch(() => {});
        }
        const currentUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { avatar: true, image: true, email: true, phoneNumber: true },
        });
        if (currentUser?.avatar && currentUser.avatar !== fileUrl) {
          await deleteFromVPS(currentUser.avatar).catch(() => {});
        }
        if (
          currentUser?.image &&
          currentUser.image !== fileUrl &&
          currentUser.image !== currentUser.avatar
        ) {
          await deleteFromVPS(currentUser.image).catch(() => {});
        }

        await prisma.$transaction([
          prisma.artist.update({
            where: { id: existingArtist.id },
            data: { profileImage: fileUrl },
          }),
          prisma.user.update({
            where: { id: userId },
            data: { avatar: fileUrl, image: fileUrl },
          }),
        ]);

        await syncAvatarToAdminPanel({
          email: currentUser?.email,
          phoneNumber: currentUser?.phoneNumber,
          avatarUrl: fileUrl,
        });
      } else {
        const currentUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { avatar: true, image: true, email: true, phoneNumber: true },
        });
        if (currentUser?.avatar) {
          await deleteFromVPS(currentUser.avatar).catch(() => {});
        }
        if (currentUser?.image && currentUser.image !== currentUser.avatar) {
          await deleteFromVPS(currentUser.image).catch(() => {});
        }

        await prisma.user.update({
          where: { id: userId },
          data: { avatar: fileUrl, image: fileUrl },
        });

        await syncAvatarToAdminPanel({
          email: currentUser?.email,
          phoneNumber: currentUser?.phoneNumber,
          avatarUrl: fileUrl,
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

    const key = `${userId}/${Date.now()}.${fileExtension}`;
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
