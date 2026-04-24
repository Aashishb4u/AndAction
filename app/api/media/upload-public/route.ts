import { NextRequest, NextResponse } from "next/server";
import { uploadToVPS } from "@/lib/vps-upload";
import { ApiErrors, successResponse } from "@/lib/api-response";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

function requireUploadSecret(request: NextRequest) {
  const expectedPublic = process.env.PUBLIC_UPLOAD_SECRET;
  const expectedVps = process.env.VPS_UPLOAD_SECRET;
  if (!expectedPublic && !expectedVps) return false;
  const provided = request.headers.get("x-upload-secret");
  if (typeof provided !== "string" || !provided) return false;
  if (expectedPublic && provided === expectedPublic) return true;
  if (expectedVps && provided === expectedVps) return true;
  return false;
}

function normalizeExtension(extension: string) {
  const trimmed = String(extension || "").trim().toLowerCase();
  const raw = trimmed.includes(".") ? trimmed.split(".").pop() : trimmed;
  const safe = ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(String(raw))
    ? String(raw)
    : "jpg";
  return safe;
}

function parseBuffer(input: unknown) {
  if (typeof input === "string") {
    const normalized = input.startsWith("data:")
      ? input.slice(input.indexOf(",") + 1)
      : input;
    return Buffer.from(normalized, "base64");
  }

  if (Array.isArray(input) && input.every((x) => typeof x === "number")) {
    return Buffer.from(input as number[]);
  }

  return null;
}

async function saveImageLocally(userId: string, buffer: Buffer, extension: string) {
  const fileName = `${userId}-${Date.now()}.${extension}`;
  const relativeDir = path.join("uploads", "images");
  const absoluteDir = path.join(process.cwd(), "public", relativeDir);
  await mkdir(absoluteDir, { recursive: true });
  await writeFile(path.join(absoluteDir, fileName), buffer);
  return `/${relativeDir.replace(/\\/g, "/")}/${fileName}`;
}

export async function POST(request: NextRequest): Promise<NextResponse<any>> {
  if (!requireUploadSecret(request)) return ApiErrors.unauthorized();

  try {
    const body = (await request.json()) as {
      userId?: unknown;
      buffer?: unknown;
      extension?: unknown;
      mimeType?: unknown;
    };

    const userId = typeof body?.userId === "string" ? body.userId.trim() : "";
    if (!userId) return ApiErrors.badRequest("userId is required.");

    const buffer = parseBuffer(body?.buffer);
    if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
      return ApiErrors.badRequest("buffer is required.");
    }

    const extension =
      typeof body?.extension === "string" ? normalizeExtension(body.extension) : "jpg";
    const mimeType =
      typeof body?.mimeType === "string" && body.mimeType.startsWith("image/")
        ? body.mimeType
        : `image/${extension === "jpg" ? "jpeg" : extension}`;

    let fileUrl = "";
    try {
      const key = `${userId}/${Date.now()}.${extension}`;
      fileUrl = await uploadToVPS({ buffer, key, mimeType });
    } catch {
      fileUrl = await saveImageLocally(userId, buffer, extension);
    }

    return successResponse({ imageUrl: fileUrl }, "Image uploaded successfully.");
  } catch {
    return ApiErrors.internalError("Unexpected error during image upload.");
  }
}

